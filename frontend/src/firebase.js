import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";

export const REAL_FIREBASE_API_KEY = "AIzaSyDDJtEncYZQBMlSzXZlZoPBinhKfnVRl-4";

export const getFirebaseApiKey = () => {
  const envKey = import.meta.env.VITE_FIREBASE_API_KEY;
  if (envKey && envKey !== "YOUR_FIREBASE_API_KEY" && envKey.trim()) {
    return envKey.trim();
  }
  try {
    const localKey = localStorage.getItem("VITE_FIREBASE_API_KEY");
    if (localKey && localKey !== "YOUR_FIREBASE_API_KEY" && localKey.trim()) {
      return localKey.trim();
    }
  } catch {}
  return REAL_FIREBASE_API_KEY;
};

export const isFirebaseConfigured = () => {
  const key = getFirebaseApiKey();
  return Boolean(key && key.startsWith("AIza"));
};

export const saveFirebaseApiKey = (key) => {
  if (key && key.trim()) {
    localStorage.setItem("VITE_FIREBASE_API_KEY", key.trim());
  }
};

const resolvedApiKey = getFirebaseApiKey();

const firebaseConfig = {
  apiKey: resolvedApiKey,
  authDomain: "login-a5f6f.firebaseapp.com",
  projectId: "login-a5f6f",
  storageBucket: "login-a5f6f.firebasestorage.app",
  messagingSenderId: "892529272438",
  appId: "1:892529272438:web:9873e6217336f146eba157",
  measurementId: "G-NZXRCWD3B5"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');
googleProvider.addScope('openid');

// Custom parameters to ensure account selection prompt
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Analytics is optional and supported only in compatible browser environments.
export const analyticsPromise = isSupported().then((supported) =>
  supported ? getAnalytics(app) : null
).catch(() => null);

export default app;
