import { create } from 'zustand';
import { request } from '../utils/api';
import { sendPhoneOtp, clearRecaptchaVerifier, auth } from '../utils/firebase';
import type { ConfirmationResult } from 'firebase/auth';

export interface Admin {
  id: string;
  ownerName: string;
  mobile: string;
  dairyName: string;
  village: string;
  taluka: string;
  district: string;
  state: string;
  collectionType: 'FIXED_RATE' | 'FAT_BASED' | 'FAT_SNF_BASED';
  milkType: 'COW' | 'BUFFALO' | 'MIX';
  collectionShift: 'MORNING' | 'EVENING' | 'BOTH';
  paymentPeriod: 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
  logoUrl?: string;
  address?: string;
  gstin?: string;
}

/** Normalise a raw mobile number to E.164 Indian format (+91xxxxxxxxxx) */
function toE164(mobile: string): string {
  const digits = mobile.replace(/\D/g, '');
  if (digits.startsWith('91') && digits.length === 12) return `+${digits}`;
  if (digits.length === 10) return `+91${digits}`;
  // Already full with +
  if (mobile.startsWith('+')) return mobile;
  return `+91${digits}`;
}

interface AuthState {
  user: Admin | null;
  token: string | null;
  tempToken: string | null;
  // Registration multi-step progress
  registrationProgress: 'phone' | 'otp' | 'details';
  tempOwnerName: string;
  tempMobile: string;
  // Internal OTP confirmation handle (not serialisable — keep in memory only)
  _confirmationResult: ConfirmationResult | null;
  isLoading: boolean;
  error: string | null;

  /** Step 1: send Firebase SMS OTP */
  sendOtp: (ownerName: string, mobile: string) => Promise<boolean>;
  /** Step 2: confirm OTP, get Firebase ID token, call /auth/verify-phone */
  confirmOtp: (otp: string) => Promise<boolean>;
  /** Step 3: complete registration with dairy details */
  register: (details: Omit<Admin, 'id' | 'mobile' | 'ownerName'> & { password: string }) => Promise<boolean>;
  login: (mobile: string, password: string) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
  initialize: () => void;
  /** Allow going back to phone step on OTP screen */
  resetToPhoneStep: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  tempToken: null,
  registrationProgress: 'phone',
  tempOwnerName: '',
  tempMobile: '',
  _confirmationResult: null,
  isLoading: false,
  error: null,

  initialize: () => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (savedToken && savedUser) {
      try {
        set({ token: savedToken, user: JSON.parse(savedUser) });
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  },

  // ---------------------------------------------------------------------------
  // STEP 1 — Send OTP via Firebase phone auth
  // ---------------------------------------------------------------------------
  sendOtp: async (ownerName, mobile) => {
    set({ isLoading: true, error: null });
    const phoneNumber = toE164(mobile);
    try {
      const confirmationResult = await sendPhoneOtp(phoneNumber);
      set({
        _confirmationResult: confirmationResult,
        tempOwnerName: ownerName,
        tempMobile: phoneNumber,
        registrationProgress: 'otp',
        isLoading: false,
      });
      return true;
    } catch (err: any) {
      clearRecaptchaVerifier();
      const msg = err?.code === 'auth/invalid-phone-number'
        ? 'Invalid phone number. Use a valid 10-digit Indian number.'
        : err?.code === 'auth/too-many-requests'
        ? 'Too many OTP requests. Please wait a few minutes and try again.'
        : err?.message ?? 'Failed to send OTP. Check your internet connection.';
      set({ error: msg, isLoading: false });
      return false;
    }
  },

  // ---------------------------------------------------------------------------
  // STEP 2 — Confirm OTP → get Firebase ID token → call backend /verify-phone
  // ---------------------------------------------------------------------------
  confirmOtp: async (otp) => {
    const { _confirmationResult, tempOwnerName } = get();
    if (!_confirmationResult) {
      set({ error: 'OTP session expired. Please go back and resend.' });
      return false;
    }
    set({ isLoading: true, error: null });
    try {
      const credential = await _confirmationResult.confirm(otp);
      const firebaseToken = await credential.user.getIdToken();

      // Sign out of Firebase client session — we use our own JWT from here on
      await auth.signOut();

      const res = await request('/auth/verify-phone', 'POST', {
        firebaseToken,
        ownerName: tempOwnerName,
      });

      set({
        tempToken: res.tempToken,
        _confirmationResult: null,
        registrationProgress: 'details',
        isLoading: false,
      });
      return true;
    } catch (err: any) {
      const msg = err?.code === 'auth/invalid-verification-code'
        ? 'Incorrect OTP. Please try again.'
        : err?.code === 'auth/code-expired'
        ? 'OTP has expired. Go back and resend.'
        : err?.message ?? 'OTP verification failed.';
      set({ error: msg, isLoading: false });
      return false;
    }
  },

  // ---------------------------------------------------------------------------
  // STEP 3 — Register with dairy details
  // ---------------------------------------------------------------------------
  register: async (details) => {
    set({ isLoading: true, error: null });
    const { tempToken } = get();
    try {
      if (!tempToken) throw new Error('Phone verification required first');

      const res = await request('/auth/register', 'POST', {
        tempToken,
        password: details.password,
        dairyName: details.dairyName,
        village: details.village,
        taluka: details.taluka,
        district: details.district,
        state: details.state,
        collectionType: details.collectionType,
        milkType: details.milkType,
        collectionShift: details.collectionShift,
        paymentPeriod: details.paymentPeriod,
      });

      const adminUser: Admin = res.admin;
      const accessToken: string = res.accessToken;

      localStorage.setItem('token', accessToken);
      localStorage.setItem('user', JSON.stringify(adminUser));

      set({
        user: adminUser,
        token: accessToken,
        tempToken: null,
        registrationProgress: 'phone', // reset for next time
        isLoading: false,
      });
      return true;
    } catch (err: any) {
      set({ error: err.message || 'Registration failed', isLoading: false });
      return false;
    }
  },

  // ---------------------------------------------------------------------------
  // LOGIN
  // ---------------------------------------------------------------------------
  login: async (mobile, password) => {
    set({ isLoading: true, error: null });
    try {
      const normalised = toE164(mobile);
      const res = await request('/auth/login', 'POST', {
        mobile: normalised,
        password,
      });

      const adminUser: Admin = res.admin;
      const accessToken: string = res.accessToken;

      localStorage.setItem('token', accessToken);
      localStorage.setItem('user', JSON.stringify(adminUser));

      set({
        user: adminUser,
        token: accessToken,
        isLoading: false,
      });
      return true;
    } catch (err: any) {
      set({ error: err.message || 'Login failed', isLoading: false });
      return false;
    }
  },

  // ---------------------------------------------------------------------------
  // LOGOUT
  // ---------------------------------------------------------------------------
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({
      user: null,
      token: null,
      tempToken: null,
      registrationProgress: 'phone',
      _confirmationResult: null,
    });
  },

  clearError: () => set({ error: null }),

  resetToPhoneStep: () =>
    set({
      registrationProgress: 'phone',
      _confirmationResult: null,
      error: null,
    }),
}));
