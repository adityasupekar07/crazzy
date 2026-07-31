import { create } from 'zustand';
import { request } from '../../utils/api';
import { sendPhoneOtp, clearRecaptchaVerifier, auth } from '../../utils/firebase';
import type { ConfirmationResult } from 'firebase/auth';
import type { StoreStatus } from '../utils/asyncHelper';
import { useCustomerStore } from '../customer/useCustomerStore';
import { useMilkCollectionStore } from '../collection/useMilkCollectionStore';
import { useFeedStore } from '../feed/useFeedStore';
import { useAdvanceStore } from '../advance/useAdvanceStore';
import { useRateChartStore } from '../rate-chart/useRateChartStore';
import { useDashboardStore } from '../dashboard/useDashboardStore';
import { useProfileStore } from '../profile/useProfileStore';

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

function toE164(mobile: string): string {
  const digits = mobile.replace(/\D/g, '');
  if (digits.startsWith('91') && digits.length === 12) return `+${digits}`;
  if (digits.length === 10) return `+91${digits}`;
  if (mobile.startsWith('+')) return mobile;
  return `+91${digits}`;
}

export interface AuthState {
  // Data
  user: Admin | null;
  token: string | null;
  tempToken: string | null;
  registrationProgress: 'phone' | 'otp' | 'details';
  tempOwnerName: string;
  tempMobile: string;
  _confirmationResult: ConfirmationResult | null;

  // Status
  status: StoreStatus;
  error: string | null;

  // Actions
  initialize: () => void;
  sendOtp: (ownerName: string, mobile: string) => Promise<boolean>;
  confirmOtp: (otp: string) => Promise<boolean>;
  register: (details: Omit<Admin, 'id' | 'mobile' | 'ownerName'> & { password: string }) => Promise<boolean>;
  login: (mobile: string, password: string) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
  resetToPhoneStep: () => void;
  reset: () => void;
}

const initialAuthData = {
  user: null,
  token: null,
  tempToken: null,
  registrationProgress: 'phone' as const,
  tempOwnerName: '',
  tempMobile: '',
  _confirmationResult: null,
  status: 'idle' as StoreStatus,
  error: null,
};

function resetAllBusinessStores() {
  useCustomerStore.getState().reset();
  useMilkCollectionStore.getState().reset();
  useFeedStore.getState().reset();
  useAdvanceStore.getState().reset();
  useRateChartStore.getState().reset();
  useDashboardStore.getState().reset();
  useProfileStore.getState().reset();
}

export const useAuthStore = create<AuthState>((set, get) => ({
  ...initialAuthData,

  initialize: () => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (savedToken && savedUser) {
      try {
        set({ token: savedToken, user: JSON.parse(savedUser), status: 'success' });
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({ token: null, user: null, status: 'idle' });
      }
    }
  },

  sendOtp: async (ownerName, mobile) => {
    set({ status: 'loading', error: null });
    const phoneNumber = toE164(mobile);
    try {
      const confirmationResult = await sendPhoneOtp(phoneNumber);
      set({
        _confirmationResult: confirmationResult,
        tempOwnerName: ownerName,
        tempMobile: phoneNumber,
        registrationProgress: 'otp',
        status: 'success',
      });
      return true;
    } catch (err: any) {
      clearRecaptchaVerifier();
      const msg = err?.code === 'auth/invalid-phone-number'
        ? 'Invalid phone number. Use a valid 10-digit Indian number.'
        : err?.code === 'auth/too-many-requests'
        ? 'Too many OTP requests. Please wait a few minutes and try again.'
        : err?.message ?? 'Failed to send OTP. Check your internet connection.';
      set({ error: msg, status: 'error' });
      return false;
    }
  },

  confirmOtp: async (otp) => {
    const { _confirmationResult, tempOwnerName } = get();
    if (!_confirmationResult) {
      set({ error: 'OTP session expired. Please go back and resend.', status: 'error' });
      return false;
    }
    set({ status: 'loading', error: null });
    try {
      const credential = await _confirmationResult.confirm(otp);
      const firebaseToken = await credential.user.getIdToken();
      await auth.signOut();

      const res = await request('/auth/verify-phone', 'POST', {
        firebaseToken,
        ownerName: tempOwnerName,
      });

      set({
        tempToken: res.tempToken,
        _confirmationResult: null,
        registrationProgress: 'details',
        status: 'success',
      });
      return true;
    } catch (err: any) {
      const msg = err?.code === 'auth/invalid-verification-code'
        ? 'Incorrect OTP. Please try again.'
        : err?.code === 'auth/code-expired'
        ? 'OTP has expired. Go back and resend.'
        : err?.message ?? 'OTP verification failed.';
      set({ error: msg, status: 'error' });
      return false;
    }
  },

  register: async (details) => {
    set({ status: 'loading', error: null });
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
        registrationProgress: 'phone',
        status: 'success',
      });
      return true;
    } catch (err: any) {
      set({ error: err.message || 'Registration failed', status: 'error' });
      return false;
    }
  },

  login: async (mobile, password) => {
    set({ status: 'loading', error: null });
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
        status: 'success',
      });
      return true;
    } catch (err: any) {
      set({ error: err.message || 'Login failed', status: 'error' });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    resetAllBusinessStores();
    set({ ...initialAuthData });
  },

  clearError: () => set({ error: null }),

  resetToPhoneStep: () =>
    set({
      registrationProgress: 'phone',
      _confirmationResult: null,
      error: null,
    }),

  reset: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    resetAllBusinessStores();
    set({ ...initialAuthData });
  },
}));
