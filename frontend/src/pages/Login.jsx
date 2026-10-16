import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Plane, Mail, Lock, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import GoogleAuthButton from '../components/GoogleAuthButton';
import ForgotPasswordModal from '../components/ForgotPasswordModal';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);

  const from = location.state?.from?.pathname || '/';

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
    if (!validate()) return;

    setSubmitting(true);
    const result = await login(identifier, password);
    setSubmitting(false);

    if (result.success) {
      navigate(from, { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2.5 group mb-6">
          <div className="w-12 h-12 rounded-2xl bg-navy flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition">
            <Plane className="w-6 h-6 text-skyblue rotate-45" />
          </div>
          <span className="text-2xl font-black text-navy tracking-tight">SKYNEXA</span>
        </Link>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-navy">
          Welcome back
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-slate-500">
          Sign in to access your flight bookings, boarding passes, and rewards.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-3xl border border-slate-200/80 shadow-xl space-y-6">
          {/* 1. GOOGLE ONE-CLICK AUTHENTICATION */}
          <div>
            <GoogleAuthButton redirectTo={from} label="Continue with Google" />
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-white text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
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
                <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="email@example.com or username"
                  className={`w-full pl-11 pr-4 py-2.5 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 ${
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
                <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full pl-11 pr-4 py-2.5 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 ${
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
              className="w-full py-3.5 bg-navy hover:bg-skyblue text-white font-extrabold rounded-xl shadow-md transition flex items-center justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer"
            >
              <span>{submitting ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                setIdentifier('demo@skynexa.com');
                setPassword('Customer@123');
                setErrors({});
              }}
              className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200"
            >
              <span>⚡ Fill Demo Customer Credentials</span>
            </button>
          </form>

          <div className="pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Don't have an account yet?{' '}
              <Link to="/register" className="font-bold text-skyblue hover:underline">
                Register here
              </Link>
            </p>
          </div>

          <div className="pt-2 text-center">
            <Link
              to="/admin-login"
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-navy font-semibold transition"
            >
              <ShieldCheck className="w-3.5 h-3.5" /> Airline Staff &amp; Admin Login
            </Link>
          </div>
        </div>
      </div>

      {/* Forgot Password with Email OTP Verification Modal */}
      <ForgotPasswordModal
        isOpen={forgotModalOpen}
        onClose={() => setForgotModalOpen(false)}
        initialEmail={identifier.includes('@') ? identifier : ''}
      />
    </div>
  );
};

export default Login;
