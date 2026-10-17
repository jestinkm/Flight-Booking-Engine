import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Plane, Mail, Lock, ArrowRight, ShieldCheck, Sparkles, CheckCircle2, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import GoogleAuthButton from '../components/GoogleAuthButton';
import ForgotPasswordModal from '../components/ForgotPasswordModal';

const Login = () => {
  const { login, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);

  // Default redirect target is /user/home as requested
  const from = location.state?.from?.pathname || '/user/home';

  // Automatically redirect if already authenticated
  useEffect(() => {
    if (!authLoading && user) {
      navigate('/user/home', { replace: true });
    }
  }, [user, authLoading, navigate]);

  const validate = () => {
    const errs = {};
    if (!identifier.trim()) {
      errs.identifier = 'Email or username is required';
    }
    if (!password) {
      errs.password = 'Password is required';
    } else if (password.length < 6) {
      errs.password = 'Password must be at least 6 characters';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return; // Prevent repeated clicks
    if (!validate()) return;

    setSubmitting(true);
    const result = await login(identifier, password);
    setSubmitting(false);

    if (result.success) {
      navigate(from, { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-sky-50/40 to-indigo-50/30 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Subtle Gradient Blobs */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 -z-10 w-[600px] h-[350px] bg-linear-to-tr from-sky-200/40 via-blue-100/30 to-indigo-100/20 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 -z-10 w-80 h-80 bg-skyblue/10 blur-3xl rounded-full pointer-events-none" />

      {/* Header & Logo */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2.5 group mb-4">
          <div className="w-12 h-12 rounded-2xl bg-navy flex items-center justify-center text-white shadow-xl shadow-navy/20 group-hover:scale-105 transition-transform duration-300">
            <Plane className="w-6 h-6 text-skyblue rotate-45 transform" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-1">
              <span className="text-2xl font-black text-navy tracking-tight">SKYNEXA</span>
              <span className="w-2 h-2 rounded-full bg-skyblue"></span>
            </div>
            <span className="text-[10px] tracking-widest text-slate-400 font-bold uppercase block -mt-1">
              Airlines
            </span>
          </div>
        </Link>

        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200/80 shadow-2xs text-[11px] font-bold text-slate-600 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-skyblue" />
          <span>SaaS Passenger Portal</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-navy tracking-tight">
          Welcome back
        </h2>
        <p className="mt-1.5 text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
          Sign in to manage your flight itineraries, boarding passes, and rewards.
        </p>
      </div>

      {/* Centered Login Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white/95 backdrop-blur-md py-8 px-6 sm:px-10 rounded-3xl border border-slate-200/90 shadow-2xl shadow-navy/5 space-y-6 transition-all duration-300 hover:shadow-navy/10">
          {/* 1. GOOGLE ONE-CLICK AUTHENTICATION (Primary SaaS Flow) */}
          <div className="space-y-3">
            <GoogleAuthButton redirectTo={from} label="Continue with Google" />

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200/80"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-white text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  Or sign in with email
                </span>
              </div>
            </div>
          </div>

          {/* 2. REGULAR EMAIL / PASSWORD FORM */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Email or Username
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={identifier}
                  disabled={submitting}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="name@example.com or username"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 transition ${
                    errors.identifier
                      ? 'border-rose-500 focus:ring-rose-200'
                      : 'border-slate-200 focus:border-skyblue focus:ring-skyblue/20'
                  }`}
                />
              </div>
              {errors.identifier && (
                <p className="text-xs font-semibold text-rose-500 mt-1">{errors.identifier}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setForgotModalOpen(true)}
                  className="text-[11px] font-bold text-skyblue hover:underline cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  value={password}
                  disabled={submitting}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 transition ${
                    errors.password
                      ? 'border-rose-500 focus:ring-rose-200'
                      : 'border-slate-200 focus:border-skyblue focus:ring-skyblue/20'
                  }`}
                />
              </div>
              {errors.password && (
                <p className="text-xs font-semibold text-rose-500 mt-1">{errors.password}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-navy hover:bg-skyblue text-white font-extrabold rounded-xl shadow-md transition flex items-center justify-center gap-2 text-xs sm:text-sm disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Quick Demo Credentials Autofill */}
            <button
              type="button"
              onClick={() => {
                setIdentifier('demo@skynexa.com');
                setPassword('Customer@123');
                setErrors({});
              }}
              className="w-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-navy text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200"
            >
              <span>⚡ Fill Demo Customer Credentials</span>
            </button>
          </form>

          {/* Footer Registration Link */}
          <div className="pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Don't have an account yet?{' '}
              <Link to="/register" className="font-bold text-skyblue hover:underline">
                Create an account
              </Link>
            </p>
          </div>

          {/* Admin Portal Link */}
          <div className="pt-1 text-center">
            <Link
              to="/admin-login"
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-navy font-semibold transition"
            >
              <ShieldCheck className="w-3.5 h-3.5" /> Airline Staff &amp; Admin Console
            </Link>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={forgotModalOpen}
        onClose={() => setForgotModalOpen(false)}
        initialEmail={identifier.includes('@') ? identifier : ''}
      />
    </div>
  );
};

export default Login;
