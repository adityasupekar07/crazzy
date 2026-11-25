import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
} from 'firebase/auth';

// Firebase configuration loaded from environment variables (.env)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Prevent re-initialization
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const auth = getAuth(app);

// -----------------------------------------------------------------------
// Singleton RecaptchaVerifier
// -----------------------------------------------------------------------
let recaptchaVerifier: RecaptchaVerifier | null = null;

function getRecaptchaVerifier(): RecaptchaVerifier {
  if (recaptchaVerifier) return recaptchaVerifier;

  recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
    size: 'invisible',
    callback: () => {
      console.log('reCAPTCHA solved');
    },
    'expired-callback': () => {
      clearRecaptchaVerifier();
    },
  });

  return recaptchaVerifier;
}

export function clearRecaptchaVerifier() {
  if (recaptchaVerifier) {
    try {
      recaptchaVerifier.clear();
    } catch (e) {
      console.warn('Error clearing reCAPTCHA verifier:', e);
    }
    recaptchaVerifier = null;
  }
}

export async function sendPhoneOtp(
  phoneNumber: string
): Promise<ConfirmationResult> {
  const verifier = getRecaptchaVerifier();

  try {
    return await signInWithPhoneNumber(auth, phoneNumber, verifier);
  } catch (error) {
    clearRecaptchaVerifier();
    throw error;
  }
}