import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { X, Check, User, ArrowRight, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

const GoogleAuthButton = ({ redirectTo = '/', label = 'Continue with Google' }) => {
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const handleSelectAccount = async (account) => {
    setSubmitting(true);
    const result = await loginWithGoogle(account);
    setSubmitting(false);

    if (result.success) {
      setModalOpen(false);
      navigate(redirectTo, { replace: true });
    }
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!customEmail.trim() || !customEmail.includes('@')) {
      toast.error('Please enter a valid Google email address');
      return;
    }
    const name = customName.trim() || customEmail.split('@')[0];
    handleSelectAccount({
      email: customEmail.trim().toLowerCase(),
      name,
      picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0284c7&color=fff`
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className="w-full py-3 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700 font-bold text-xs sm:text-sm transition flex items-center justify-center gap-3 shadow-2xs hover:shadow-sm cursor-pointer group"
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
        <span className="text-slate-700 group-hover:text-navy">{label}</span>
      </button>

      {/* Google Account Selector Dialog */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl border border-slate-200 overflow-hidden relative">
            {/* Modal Header */}
            <div className="p-6 text-center border-b border-slate-100 relative">
              <button
                onClick={() => setModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-navy rounded-full hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex justify-center mb-2">
                <svg className="w-8 h-8" viewBox="0 0 24 24">
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
              </div>

              <h3 className="text-base font-extrabold text-navy">Sign in with Google</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Choose an account to continue to Skynexa Airlines
              </p>
            </div>

            {/* Account List */}
            <div className="p-4 space-y-2">
              {/* Option 1: Quick Jestin Kumar Google account */}
              <button
                type="button"
                disabled={submitting}
                onClick={() =>
                  handleSelectAccount({
                    email: 'kmjestin25@gmail.com',
                    name: 'Jestin Kumar',
                    firstName: 'Jestin',
                    lastName: 'Kumar',
                    picture: 'https://ui-avatars.com/api/?name=Jestin+Kumar&background=0B1F3A&color=2496ED'
                  })
                }
                className="w-full p-3 rounded-2xl hover:bg-slate-50 border border-slate-100 hover:border-sky-200 transition text-left flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-navy text-sky-300 font-bold flex items-center justify-center text-sm shadow-xs">
                    JK
                  </div>
                  <div>
                    <p className="text-xs font-bold text-navy group-hover:text-skyblue transition">
                      Jestin Kumar
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono">kmjestin25@gmail.com</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Verified
                </span>
              </button>

              {/* Option 2: Custom Google account */}
              {!showCustomInput ? (
                <button
                  type="button"
                  onClick={() => setShowCustomInput(true)}
                  className="w-full p-3 rounded-2xl hover:bg-slate-50 border border-dashed border-slate-200 text-left flex items-center gap-3 transition cursor-pointer text-slate-600 hover:text-navy"
                >
                  <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold">Use another Google account</p>
                    <p className="text-[11px] text-slate-400">Sign in with any @gmail.com address</p>
                  </div>
                </button>
              ) : (
                <form onSubmit={handleCustomSubmit} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5 animate-fadeIn">
                  <input
                    type="email"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    placeholder="name@gmail.com"
                    autoFocus
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs focus:outline-none focus:border-skyblue"
                  />
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Full Name (optional)"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs focus:outline-none focus:border-skyblue"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowCustomInput(false)}
                      className="flex-1 py-1.5 text-xs text-slate-500 hover:text-navy font-bold rounded-lg cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={submitting || !customEmail}
                      className="flex-1 py-1.5 bg-navy hover:bg-skyblue text-white text-xs font-bold rounded-lg transition disabled:opacity-50 cursor-pointer shadow-xs"
                    >
                      {submitting ? 'Signing in...' : 'Sign In'}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 text-[10px] text-slate-400 text-center border-t border-slate-100">
              By continuing, Google shares your name and email address with Skynexa Airlines.
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GoogleAuthButton;
