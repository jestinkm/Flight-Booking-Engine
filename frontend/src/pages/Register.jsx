import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plane, Mail, Lock, User, Phone, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import GoogleAuthButton from '../components/GoogleAuthButton';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validate = () => {
    const errs = {};
    if (!formData.firstName.trim()) errs.firstName = 'First name is required';
    if (!formData.lastName.trim()) errs.lastName = 'Last name is required';
    if (!formData.username.trim()) errs.username = 'Username is required';
    if (!formData.email.trim()) {
      errs.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errs.email = 'Invalid email address';
    }
    if (!formData.phone.trim()) errs.phone = 'Phone number is required';
    if (!formData.password) {
      errs.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errs.password = 'Password must be at least 6 characters';
    }
    if (formData.password !== formData.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please resolve the form errors');
      return;
    }

    setSubmitting(true);
    const { confirmPassword, ...registerPayload } = formData;
    const result = await register(registerPayload);
    setSubmitting(false);

    if (result.success) {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/40 to-indigo-50/30 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Animated Gradient Blobs */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 -z-10 w-[600px] h-[350px] bg-gradient-to-tr from-sky-200/40 via-blue-100/30 to-indigo-100/20 blur-3xl rounded-full pointer-events-none animate-floatSlow" />
      <div className="absolute -bottom-20 -right-20 -z-10 w-80 h-80 bg-skyblue/15 blur-3xl rounded-full pointer-events-none animate-pulseGlow" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center animate-fadeInDown">
        <Link to="/" className="inline-flex items-center gap-2.5 group mb-4">
          <div className="w-12 h-12 rounded-2xl bg-navy flex items-center justify-center text-white shadow-xl shadow-navy/20 group-hover:scale-110 group-hover:rotate-6 group-hover:shadow-skyblue/30 transition-all duration-300">
            <Plane className="w-6 h-6 text-skyblue rotate-45 group-hover:rotate-90 transition-transform duration-500" />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-2xl font-black text-navy tracking-tight group-hover:text-skyblue transition-colors duration-300">SKYNEXA</span>
            <span className="w-2 h-2 rounded-full bg-skyblue animate-pulse"></span>
          </div>
        </Link>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-navy">
          Create Passenger Account
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-slate-500">
          Join Skynexa for quick check-outs, member fare privileges, and itinerary tracking.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg px-4 animate-fadeInUp">
        <div className="bg-white/95 backdrop-blur-md py-8 px-6 sm:px-10 rounded-3xl border border-slate-200/90 shadow-2xl shadow-navy/5 space-y-6 transition-all duration-300 hover:shadow-navy/10 hover:border-sky-200">
          {/* Google Sign-Up Button */}
          <div>
            <GoogleAuthButton redirectTo="/" label="Sign up with Google" />
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-white text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  Or register with email
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* First & Last Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  First Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="John"
                    className="w-full pl-10 pr-3 py-2 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-skyblue"
                  />
                </div>
                {errors.firstName && <p className="text-[11px] text-rose-500 font-bold mt-1">{errors.firstName}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Last Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Doe"
                    className="w-full pl-10 pr-3 py-2 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-skyblue"
                  />
                </div>
                {errors.lastName && <p className="text-[11px] text-rose-500 font-bold mt-1">{errors.lastName}</p>}
              </div>
            </div>

            {/* Username & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Username <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="johndoe"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-skyblue"
                />
                {errors.username && <p className="text-[11px] text-rose-500 font-bold mt-1">{errors.username}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Phone Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+1 555-0192"
                    className="w-full pl-10 pr-3 py-2 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-skyblue"
                  />
                </div>
                {errors.phone && <p className="text-[11px] text-rose-500 font-bold mt-1">{errors.phone}</p>}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="john.doe@example.com"
                  className="w-full pl-10 pr-3 py-2 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-skyblue"
                />
              </div>
              {errors.email && <p className="text-[11px] text-rose-500 font-bold mt-1">{errors.email}</p>}
            </div>

            {/* Password & Confirm */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-skyblue"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-navy cursor-pointer transition p-0.5 focus:outline-none"
                    title={showPassword ? 'Hide password' : 'Show password'}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-[11px] text-rose-500 font-bold mt-1">{errors.password}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Confirm Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-skyblue"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-navy cursor-pointer transition p-0.5 focus:outline-none"
                    title={showConfirmPassword ? 'Hide password' : 'Show password'}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-[11px] text-rose-500 font-bold mt-1">{errors.confirmPassword}</p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="group w-full mt-4 py-3.5 bg-navy hover:bg-skyblue text-white font-extrabold rounded-xl shadow-md hover:shadow-xl hover:shadow-sky-400/25 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer"
            >
              <span>{submitting ? 'Registering Account...' : 'Complete Registration'}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform duration-200" />
            </button>
          </form>

          <div className="pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Already have an account?{' '}
              <Link to="/login" className="font-bold text-skyblue hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
