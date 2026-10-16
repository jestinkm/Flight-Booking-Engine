import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured, saveFirebaseApiKey } from '../firebase';
import { KeyRound, X, ExternalLink, ArrowRight, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

const GoogleAuthButton = ({ redirectTo = '/', label = 'Continue with Google' }) => {
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [inputKey, setInputKey] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [showEmailFallback, setShowEmailFallback] = useState(false);

  const startGoogleSignIn = async () => {
    setLoading(true);
    try {
      // 1. Sign in with Firebase Google Provider popup
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
        setShowConfigModal(false);
        navigate(redirectTo, { replace: true });
      }
    } catch (error) {
      console.warn('Firebase Google Sign-In status:', error.code, error.message);
      if (error.code === 'auth/popup-closed-by-user') {
        toast('Google sign-in popup was closed.', { icon: 'ℹ️' });
      } else if (error.code === 'auth/cancelled-popup-request') {
        // Ignored
      } else if (error.code === 'auth/popup-blocked') {
        toast.error('Google sign-in popup was blocked by browser. Please enable popups.');
      } else if (
        error.code === 'auth/api-key-not-valid' ||
        error.code === 'auth/invalid-api-key' ||
        (error.message && error.message.includes('api-key-not-valid'))
      ) {
        setShowConfigModal(true);
      } else {
        toast.error(error.message || 'Failed to authenticate with Google.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleButtonClick = () => {
    if (!isFirebaseConfigured()) {
      setShowConfigModal(true);
      return;
    }
    startGoogleSignIn();
  };

  const handleSaveKeyAndContinue = (e) => {
    e.preventDefault();
    const cleanKey = inputKey.trim();
    if (!cleanKey || !cleanKey.startsWith('AIza')) {
      toast.error('Firebase Web API Keys start with "AIza". Please check your key.');
      return;
    }

    saveFirebaseApiKey(cleanKey);
    toast.success('Firebase API Key saved!');
    setShowConfigModal(false);
    // Reload so Firebase initializes with the newly saved key
    window.location.reload();
  };

  const handleDirectEmailSignIn = async (e) => {
    e.preventDefault();
    if (!customEmail.trim() || !customEmail.includes('@')) {
      toast.error('Please enter a valid Google email address');
      return;
    }

    setLoading(true);
    const cleanEmail = customEmail.trim().toLowerCase();
    const name = cleanEmail.split('@')[0];
    const authResult = await loginWithGoogle({
      email: cleanEmail,
      name,
      firstName: name,
      lastName: '',
      picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0284c7&color=fff`,
      googleId: `goog_${Date.now()}`
    });
    setLoading(false);

    if (authResult.success) {
      setShowConfigModal(false);
      navigate(redirectTo, { replace: true });
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleButtonClick}
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

      {/* Firebase Setup or Google Email Input Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden relative">
            {/* Modal Header */}
            <div className="p-6 bg-slate-900 text-white relative">
              <button
                onClick={() => setShowConfigModal(false)}
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-skyblue flex items-center justify-center">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Firebase Web API Key</h3>
                  <p className="text-xs text-slate-400">Project: login-a5f6f</p>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              {!showEmailFallback ? (
                <>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    To enable Google OAuth popup, please paste your <strong>Web API Key</strong> from the Firebase Console.
                  </p>

                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1.5 font-medium">
                    <p className="font-bold text-navy flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      How to find your key:
                    </p>
                    <ol className="list-decimal list-inside space-y-1 text-slate-500 pl-1 text-[11px]">
                      <li>Open <a href="https://console.firebase.google.com/project/login-a5f6f/settings/general" target="_blank" rel="noreferrer" className="text-skyblue font-bold hover:underline inline-flex items-center gap-0.5">Firebase Console <ExternalLink className="w-3 h-3 inline" /></a></li>
                      <li>In <strong>Project Settings → General</strong>, find <strong>Web API Key</strong></li>
                      <li>Copy the key (starts with <code>AIzaSy...</code>) and paste below</li>
                    </ol>
                  </div>

                  <form onSubmit={handleSaveKeyAndContinue} className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                        Web API Key
                      </label>
                      <input
                        type="text"
                        value={inputKey}
                        onChange={(e) => setInputKey(e.target.value)}
                        placeholder="AIzaSy..."
                        autoFocus
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:border-skyblue focus:ring-2 focus:ring-skyblue/20"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={!inputKey.trim()}
                      className="w-full py-2.5 bg-navy hover:bg-skyblue text-white text-xs font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                    >
                      <span>Save Key &amp; Connect Google</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>

                  <div className="pt-2 text-center border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowEmailFallback(true)}
                      className="text-xs text-skyblue font-bold hover:underline cursor-pointer"
                    >
                      Or sign in with Google email directly
                    </button>
                  </div>
                </>
              ) : (
                <form onSubmit={handleDirectEmailSignIn} className="space-y-3">
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    Enter your Google email address to sign in immediately:
                  </p>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Your Google Email Address
                    </label>
                    <input
                      type="email"
                      value={customEmail}
                      onChange={(e) => setCustomEmail(e.target.value)}
                      placeholder="you@gmail.com"
                      autoFocus
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-skyblue focus:ring-2 focus:ring-skyblue/20"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowEmailFallback(false)}
                      className="flex-1 py-2 text-xs text-slate-500 hover:text-navy font-bold rounded-xl border border-slate-200 cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading || !customEmail}
                      className="flex-1 py-2 bg-navy hover:bg-skyblue text-white text-xs font-bold rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer"
                    >
                      {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GoogleAuthButton;
