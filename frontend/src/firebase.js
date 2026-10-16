import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "YOUR_FIREBASE_API_KEY",
  authDomain: "login-a5f6f.firebaseapp.com",
  projectId: "login-a5f6f",
  storageBucket: "login-a5f6f.firebasestorage.app",
  messagingSenderId: "892529272438",
  appId: "1:892529272438:web:9873e6217336f146eba157",
  measurementId: "G-NZXRCWD3B5"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Custom parameters to ensure account selection prompt
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Analytics is optional and supported only in compatible browser environments.
export const analyticsPromise = isSupported().then((supported) =>
  supported ? getAnalytics(app) : null
);

export default app;
