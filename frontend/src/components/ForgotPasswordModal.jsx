import React, { useState, useEffect } from 'react';
import {
  X,
  Mail,
  KeyRound,
  Lock,
  ArrowRight,
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const ForgotPasswordModal = ({ isOpen, onClose, initialEmail = '', onSuccess }) => {
  const { sendFirebasePasswordReset, sendPasswordResetOtp, verifyPasswordResetOtp, resetPasswordWithOtp } = useAuth();
  const [resetSentViaFirebase, setResetSentViaFirebase] = useState(false);

  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password, 4: Done
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(600); // 10 minutes

  useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail);
    }
  }, [initialEmail]);

  // Countdown timer for OTP
  useEffect(() => {
    let timer;
    if (step === 2 && countdown > 0) {
      timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  if (!isOpen) return null;

  const formatCountdown = () => {
    const mins = Math.floor(countdown / 60);
    const secs = countdown % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Step 1: Send OTP to email
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setSubmitting(true);
    const result = await sendPasswordResetOtp(email.trim().toLowerCase());
    setSubmitting(false);

    if (result.success) {
      setStep(2);
      setCountdown(600);
    }
  };

  // Direct Firebase Password Reset Email
  const handleFirebaseReset = async () => {
    if (!email.trim() || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    setSubmitting(true);
    const result = await sendFirebasePasswordReset(email.trim().toLowerCase());
    setSubmitting(false);
    if (result.success) {
      setResetSentViaFirebase(true);
    }
  };

  // Step 2: Verify 6-digit OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp.trim() || otp.trim().length !== 6) {
      toast.error('Please enter the 6-digit verification code');
      return;
    }

    setSubmitting(true);
    const result = await verifyPasswordResetOtp(email.trim().toLowerCase(), otp.trim());
    setSubmitting(false);

    if (result.success) {
      setStep(3);
    }
  };

  // Step 3: Set New Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setSubmitting(true);
    const result = await resetPasswordWithOtp(email.trim().toLowerCase(), otp.trim(), newPassword);
    setSubmitting(false);

    if (result.success) {
      setStep(4);
      if (onSuccess) onSuccess();
    }
  };

  // Resend OTP
  const handleResend = async () => {
    setSubmitting(true);
    const result = await sendPasswordResetOtp(email.trim().toLowerCase());
    setSubmitting(false);
    if (result.success) {
      setCountdown(600);
      setOtp('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden relative">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-navy via-navy to-[#0c2e56] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-skyblue flex items-center justify-center text-white shadow-md">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white">Reset Password</h3>
              <p className="text-[11px] text-slate-300">
                {step === 1 && 'Step 1: Enter your registered email'}
                {step === 2 && 'Step 2: Enter 6-digit email OTP'}
                {step === 3 && 'Step 3: Create a new password'}
                {step === 4 && 'Complete: Password updated!'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-300 hover:text-white rounded-xl hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="w-full bg-slate-100 h-1.5 flex">
          <div
            className="bg-skyblue h-full transition-all duration-300"
            style={{ width: `${(step / 4) * 100}%` }}
          ></div>
        </div>

        {/* Step 1: Request OTP or Firebase Reset */}
        {step === 1 && (
          <div className="p-6 space-y-4">
            {resetSentViaFirebase ? (
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-center space-y-3">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <h4 className="text-sm font-bold text-emerald-900">Reset Email Dispatched</h4>
                <p className="text-xs text-emerald-700">
                  Firebase has sent a secure password reset link to <strong className="font-mono">{email}</strong>. Please check your inbox (and spam folder) to set your new password.
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Enter your registered email address. You can receive an instant Firebase password reset link or a 6-digit verification code.
                </p>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Your Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      autoFocus
                      required
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-skyblue focus:ring-2 focus:ring-skyblue/20"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleFirebaseReset}
                  disabled={submitting || !email}
                  className="w-full py-3 bg-navy hover:bg-skyblue text-white text-xs font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Sending Reset Link...</span>
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 text-skyblue" />
                      <span>Send Firebase Reset Link</span>
                    </>
                  )}
                </button>

                <div className="relative my-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-2 bg-white text-slate-400 font-semibold text-[10px] uppercase">
                      Or verify with OTP
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting || !email}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <span>Send 6-Digit OTP</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                </button>
              </form>
            )}
          </div>
        )}

        {/* Step 2: Verify OTP */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="p-6 space-y-4">
            <div className="p-3 bg-sky-50 rounded-2xl border border-sky-200 flex items-start gap-2.5 text-xs text-sky-900">
              <Mail className="w-4 h-4 text-skyblue shrink-0 mt-0.5" />
              <div>
                <span>A 6-digit OTP code has been dispatched to:</span>
                <span className="font-bold block text-navy font-mono">{email}</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Enter 6-Digit OTP
                </label>
                <span className="text-[11px] font-mono font-bold text-amber-600">
                  Expires in: {formatCountdown()}
                </span>
              </div>
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="• • • • • •"
                autoFocus
                className="w-full text-center tracking-[12px] text-2xl font-black font-mono py-3 rounded-xl border border-slate-300 focus:outline-none focus:border-skyblue focus:ring-2 focus:ring-skyblue/20 text-navy"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || otp.length !== 6}
              className="w-full py-3 bg-navy hover:bg-skyblue text-white text-xs font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Verifying Code...</span>
                </>
              ) : (
                <>
                  <span>Verify Code</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-slate-500 hover:text-navy cursor-pointer font-semibold"
              >
                Change Email
              </button>
              <button
                type="button"
                disabled={submitting || countdown > 540}
                onClick={handleResend}
                className="text-skyblue font-bold hover:underline cursor-pointer disabled:opacity-40"
              >
                Resend OTP
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Enter New Password */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} className="p-6 space-y-4">
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              Identity verified! Create your new secure password below:
            </p>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  autoFocus
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-skyblue"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-skyblue"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || !newPassword || !confirmPassword}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Updating Password...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Confirm &amp; Reset Password</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Step 4: Success Confirmed */}
        {step === 4 && (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-lg animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <h4 className="text-lg font-black text-navy">Password Reset Complete!</h4>
            <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
              Your Skynexa account password has been updated successfully. You can now sign in using your new credentials.
            </p>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 bg-navy hover:bg-skyblue text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer"
            >
              Sign In Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
