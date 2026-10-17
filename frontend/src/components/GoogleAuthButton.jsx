import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { signInWithPopup, signInWithRedirect } from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured, saveFirebaseApiKey } from '../firebase';
import { KeyRound, X, ExternalLink, ArrowRight, ShieldCheck, Copy, Check, Globe } from 'lucide-react';
import toast from 'react-hot-toast';

const GoogleAuthButton = ({ redirectTo = '/', label = 'Continue with Google' }) => {
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showDomainModal, setShowDomainModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [popupBlocked, setPopupBlocked] = useState(false);
  const [copiedDomain, setCopiedDomain] = useState(false);
  const [inputKey, setInputKey] = useState('');

  const currentDomain = window.location.hostname;

  const handleCopyDomain = () => {
    navigator.clipboard.writeText(currentDomain);
    setCopiedDomain(true);
    toast.success(`Copied "${currentDomain}" to clipboard!`);
    setTimeout(() => setCopiedDomain(false), 2000);
  };

  // 1. Direct Redirect Sign-In (100% immune to popup blockers)
  const handleGoogleRedirectSignIn = async () => {
    setLoading(true);
    try {
      sessionStorage.setItem('auth_redirect_to', redirectTo);
      toast.loading('Redirecting to Google Sign-In...', { duration: 3000 });
      await signInWithRedirect(auth, googleProvider);
    } catch (error) {
      console.warn('Google Redirect Error:', error.code, error.message);
      if (error.code === 'auth/unauthorized-domain' || (error.message && error.message.includes('unauthorized-domain'))) {
        setShowDomainModal(true);
      } else {
        toast.error(error.message || 'Failed to redirect to Google.');
      }
      setLoading(false);
    }
  };

  // 2. Standard Popup Sign-In with instant redirect fallback
  const handleGoogleSignIn = () => {
    sessionStorage.setItem('auth_redirect_to', redirectTo);

    // Call signInWithPopup immediately and synchronously inside the click handler
    signInWithPopup(auth, googleProvider)
      .then(async (result) => {
        setLoading(true);
        const user = result.user;
        const idToken = await user.getIdToken();
        const extractedEmail = user.email || user.providerData?.[0]?.email || `google_${user.uid.replace(/[^a-zA-Z0-9]/g, '').slice(0, 15)}@gmail.com`;
        const extractedName = user.displayName || user.providerData?.[0]?.displayName || extractedEmail.split('@')[0];

        const authResult = await loginWithGoogle({
          email: extractedEmail,
          name: extractedName,
          firstName: extractedName.split(' ')[0] || 'Traveler',
          lastName: extractedName.split(' ').length > 1 ? extractedName.split(' ').slice(1).join(' ') : '',
          picture: user.photoURL || user.providerData?.[0]?.photoURL || '',
          googleId: user.uid,
          credential: idToken
        });

        if (authResult.success) {
          setShowConfigModal(false);
          setShowDomainModal(false);
          navigate(redirectTo, { replace: true });
        }
      })
      .catch(async (error) => {
        console.warn('Firebase Google Sign-In status:', error.code, error.message);
        if (error.code === 'auth/popup-blocked') {
          setPopupBlocked(true);
          toast('Browser blocked popup. Switching to redirect login...', { icon: '🔄' });
          // Automatically initiate redirect login so user is not stuck!
          try {
            await signInWithRedirect(auth, googleProvider);
          } catch (redirectErr) {
            console.error('Redirect fallback error:', redirectErr);
          }
        } else if (error.code === 'auth/unauthorized-domain' || (error.message && error.message.includes('unauthorized-domain'))) {
          setShowDomainModal(true);
        } else if (error.code === 'auth/popup-closed-by-user') {
          toast('Google sign-in popup was closed.', { icon: 'ℹ️' });
        } else if (
          error.code === 'auth/api-key-not-valid' ||
          error.code === 'auth/invalid-api-key' ||
          (error.message && error.message.includes('api-key-not-valid'))
        ) {
          setShowConfigModal(true);
        } else {
          toast.error(error.message || 'Failed to authenticate with Google.');
        }
      })
      .finally(() => {
        setLoading(false);
      });
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
    window.location.reload();
  };

  return (
    <div className="space-y-2">
      {/* Primary Google Auth Button */}
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
          {loading ? 'Connecting...' : label}
        </span>
      </button>

      {/* Modal 1: Domain Authorization Required Modal */}
      {showDomainModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden relative">
            <div className="p-6 bg-navy text-white relative">
              <button
                onClick={() => setShowDomainModal(false)}
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Authorize Domain in Firebase</h3>
                  <p className="text-xs text-slate-300">Firebase blocked domain: {currentDomain}</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Google OAuth requires all website domains to be added to Firebase's <strong>Authorized domains</strong> list.
              </p>

              {/* Current Domain Box with One-Click Copy */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Domain to Add:</p>
                  <p className="text-sm font-mono font-bold text-navy">{currentDomain}</p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyDomain}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  {copiedDomain ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                  <span>{copiedDomain ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>

              {/* Step by Step Instructions */}
              <div className="p-3 bg-sky-50 rounded-2xl border border-sky-100 text-xs text-slate-600 space-y-2 font-medium">
                <p className="font-bold text-navy flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-skyblue" />
                  Add in 3 clicks (under 30 seconds):
                </p>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-600 pl-1 text-[11px]">
                  <li>
                    Open{' '}
                    <a
                      href="https://console.firebase.google.com/project/login-a5f6f/authentication/settings"
                      target="_blank"
                      rel="noreferrer"
                      className="text-skyblue font-bold hover:underline inline-flex items-center gap-0.5"
                    >
                      Firebase Authentication Settings <ExternalLink className="w-3 h-3 inline" />
                    </a>
                  </li>
                  <li>Click <strong>Authorized domains</strong> &rarr; <strong>Add domain</strong></li>
                  <li>Paste <code>{currentDomain}</code> and click <strong>Add</strong></li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: API Key Configuration */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden relative">
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
                  <h3 className="text-base font-bold text-white">Firebase Configuration</h3>
                  <p className="text-xs text-slate-400">Project: login-a5f6f</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                To enable Google OAuth popup, please enter your Firebase <strong>Web API Key</strong>.
              </p>

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
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleAuthButton;
