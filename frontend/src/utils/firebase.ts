import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
} from 'firebase/auth';

/**
 * Firebase project config for phone-dairy-a4089.
 * Must match the backend firebase-service-account.json project.
 */
const firebaseConfig = {
  apiKey: 'AIzaSyAWISyz5F_iZQ1M9XxCuNzdwCToFOEy0CA',
  authDomain: 'phone-dairy-a4089.firebaseapp.com',
  projectId: 'phone-dairy-a4089',
  storageBucket: 'phone-dairy-a4089.firebasestorage.app',
  messagingSenderId: '1029722857655',
  appId: '1:1029722857655:web:351984065949c1f2276d32',
};

// Prevent re-initialization in HMR / StrictMode
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// -----------------------------------------------------------------------
// Singleton RecaptchaVerifier — created once per session, cleared on error
// -----------------------------------------------------------------------
let recaptchaVerifier: RecaptchaVerifier | null = null;

function getRecaptchaVerifier(): RecaptchaVerifier {
  if (recaptchaVerifier) return recaptchaVerifier;

  recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
    size: 'invisible',
    callback: () => {
      // reCAPTCHA solved — nothing to do, Firebase handles it internally
    },
    'expired-callback': () => {
      clearRecaptchaVerifier();
    },
  });

  return recaptchaVerifier;
}

export function clearRecaptchaVerifier() {
  if (recaptchaVerifier) {
    recaptchaVerifier.clear();
    recaptchaVerifier = null;
  }
}

/**
 * Send OTP to the given phone number (must include country code, e.g. +919876543210).
 * Returns a ConfirmationResult that you must call .confirm(otp) on.
 */
export async function sendPhoneOtp(phoneNumber: string): Promise<ConfirmationResult> {
  const verifier = getRecaptchaVerifier();
  try {
    const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, verifier);
    return confirmationResult;
  } catch (err) {
    // Clear the verifier so a fresh one is created on retry
    clearRecaptchaVerifier();
    throw err;
  }
}
