import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  User
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/spreadsheets');
provider.addScope('https://www.googleapis.com/auth/drive.file');

let isSigningIn = false;
let cachedAccessToken: string | null = typeof window !== 'undefined' ? localStorage.getItem('pos_google_access_token') : null;

export const initAuth = (
  onAuthSuccess?: (user: any, token: string) => void,
  onAuthFailure?: () => void
) => {
  // If we already have token and user in localStorage, restore immediately
  if (typeof window !== 'undefined') {
    const savedToken = localStorage.getItem('pos_google_access_token');
    const savedUser = localStorage.getItem('pos_google_user');
    if (savedToken && savedUser) {
      try {
        const userObj = JSON.parse(savedUser);
        cachedAccessToken = savedToken;
        if (onAuthSuccess) onAuthSuccess(userObj, savedToken);
      } catch (e) {}
    }
  }

  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      const token = cachedAccessToken || (typeof window !== 'undefined' ? localStorage.getItem('pos_google_access_token') : null) || '';
      if (token) {
        cachedAccessToken = token;
        if (onAuthSuccess) onAuthSuccess(user, token);
      } else {
        if (onAuthSuccess) onAuthSuccess(user, '');
      }
    } else {
      const hasStoredToken = typeof window !== 'undefined' && !!localStorage.getItem('pos_google_access_token');
      if (!hasStoredToken) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    }
  });
};

export const isGoogleTokenExpired = (): boolean => {
  if (typeof window === 'undefined') return false;
  const timeStr = localStorage.getItem('pos_google_token_time');
  if (!timeStr) return false;
  const time = parseInt(timeStr, 10);
  if (isNaN(time)) return false;
  // Consider expired after 50 minutes (Google OAuth token valid for 60 min)
  return Date.now() - time > 50 * 60 * 1000;
};

export const clearGoogleTokenOnly = () => {
  cachedAccessToken = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('pos_google_access_token');
    localStorage.removeItem('pos_google_token_time');
  }
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    provider.setCustomParameters({ prompt: 'select_account' });
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Gagal mendapatkan access token dari Google Auth');
    }

    cachedAccessToken = credential.accessToken;
    if (typeof window !== 'undefined') {
      localStorage.setItem('pos_google_access_token', credential.accessToken);
      localStorage.setItem('pos_google_token_time', Date.now().toString());
      localStorage.setItem(
        'pos_google_user',
        JSON.stringify({
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName,
          photoURL: result.user.photoURL
        })
      );
    }
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Sign-in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  if (isGoogleTokenExpired()) {
    clearGoogleTokenOnly();
    return null;
  }
  if (cachedAccessToken) return cachedAccessToken;
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('pos_google_access_token');
    if (saved) {
      cachedAccessToken = saved;
      return saved;
    }
  }
  return null;
};

export const setManualAccessToken = (token: string | null) => {
  cachedAccessToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem('pos_google_access_token', token);
      localStorage.setItem('pos_google_token_time', Date.now().toString());
    } else {
      localStorage.removeItem('pos_google_access_token');
      localStorage.removeItem('pos_google_token_time');
    }
  }
};

export const logoutGoogle = async () => {
  try {
    await signOut(auth);
  } catch (e) {}
  cachedAccessToken = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('pos_google_access_token');
    localStorage.removeItem('pos_google_token_time');
    localStorage.removeItem('pos_google_user');
  }
};
