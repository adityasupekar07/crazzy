import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
} from 'firebase/auth';

// Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyDDv8QjM_l8KL3dmfRJLDkj4qyCGTGmKQ8',
  authDomain: 'mobile-dairy-5a09a.firebaseapp.com',
  projectId: 'mobile-dairy-5a09a',
  storageBucket: 'mobile-dairy-5a09a.firebasestorage.app',
  messagingSenderId: '984926042103',
  appId: '1:984926042103:web:e9cec760d40ae383eae0f2',
  measurementId: 'G-3PJ5PEZXM1', // optional
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
    recaptchaVerifier.clear();
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