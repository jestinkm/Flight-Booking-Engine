import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import toast from 'react-hot-toast';

const GoogleAuthButton = ({ redirectTo = '/', label = 'Continue with Google' }) => {
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      // 1. Sign in with genuine Firebase Google Provider
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const idToken = await user.getIdToken();

      // 2. Sync user with application backend & generate session
      const authResult = await loginWithGoogle({
        email: user.email,
        name: user.displayName,
        firstName: user.displayName ? user.displayName.split(' ')[0] : 'Traveler',
        lastName: user.displayName && user.displayName.split(' ').length > 1 ? user.displayName.split(' ').slice(1).join(' ') : '',
        picture: user.photoURL,
        googleId: user.uid,
        credential: idToken
      });

      if (authResult.success) {
        navigate(redirectTo, { replace: true });
      }
    } catch (error) {
      console.error('Firebase Google Sign-In error:', error);
      if (error.code === 'auth/popup-closed-by-user') {
        toast('Google sign-in popup was closed.', { icon: 'ℹ️' });
      } else if (error.code === 'auth/cancelled-popup-request') {
        // Ignored
      } else if (error.code === 'auth/popup-blocked') {
        toast.error('Google sign-in popup was blocked by browser. Please enable popups.');
      } else {
        toast.error(error.message || 'Failed to authenticate with Google.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleGoogleSignIn}
      disabled={loading}
      className="w-full py-3 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700 font-bold text-xs sm:text-sm transition flex items-center justify-center gap-3 shadow-2xs hover:shadow-sm cursor-pointer group disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {/* Google Multicolored SVG Logo */}
      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        />
      </svg>
      <span className="text-slate-700 group-hover:text-navy">
        {loading ? 'Connecting to Google...' : label}
      </span>
    </button>
  );
};

export default GoogleAuthButton;
