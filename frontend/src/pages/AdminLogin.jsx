import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, ArrowRight, Plane, Shield, Calendar, Tag, CheckCircle2, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const DEFAULT_ADMIN_ACCOUNTS = [
  {
    role: 'SUPER_ADMIN',
    title: 'Super Admin',
    email: 'superadmin@skynexa.com',
    password: 'SuperAdmin@2026',
    description: 'Full Control: Routes, Layouts, Staff & Audit',
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    hoverBorder: 'hover:border-indigo-400',
    activeBg: 'bg-indigo-600/20 border-indigo-500',
    icon: Shield
  },
  {
    role: 'SCHEDULE_ADMIN',
    title: 'Schedule Admin',
    email: 'scheduleadmin@skynexa.com',
    password: 'ScheduleAdmin@2026',
    description: 'Timetables, Weekly Departures & ₹ Base Fares',
    badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
    hoverBorder: 'hover:border-sky-400',
    activeBg: 'bg-sky-600/20 border-sky-500',
    icon: Calendar
  },
  {
    role: 'MARKETING_ADMIN',
    title: 'Marketing Admin',
    email: 'marketingadmin@skynexa.com',
    password: 'MarketingAdmin@2026',
    description: 'Promotions, SKY500 Offers & Analytics',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    hoverBorder: 'hover:border-emerald-400',
    activeBg: 'bg-emerald-600/20 border-emerald-500',
    icon: Tag
  }
];

const AdminLogin = () => {
  const { adminLogin } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('superadmin@skynexa.com');
  const [password, setPassword] = useState('SuperAdmin@2026');
  const [selectedRole, setSelectedRole] = useState('SUPER_ADMIN');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const executeLogin = async (loginEmail, loginPassword) => {
    setError('');
    setSubmitting(true);
    const result = await adminLogin(loginEmail, loginPassword);
    setSubmitting(false);

    if (result.success) {
      const role = result.user?.role;
      if (role === 'SUPER_ADMIN') {
        navigate('/admin/super');
      } else if (role === 'SCHEDULE_ADMIN') {
        navigate('/admin/schedule');
      } else if (role === 'MARKETING_ADMIN') {
        navigate('/admin/marketing');
      } else {
        navigate('/admin/super');
      }
    } else {
      setError(result.error || 'Failed to authenticate administrator');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide email and password');
      return;
    }
    await executeLogin(email, password);
  };

  const handleSelectDefaultAdmin = (adm, autoSubmit = false) => {
    setEmail(adm.email);
    setPassword(adm.password);
    setSelectedRole(adm.role);
    setError('');

    if (autoSubmit) {
      executeLogin(adm.email, adm.password);
    }
  };

  return (
    <div className="min-h-screen bg-navy text-white flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background glow styling */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-skyblue/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-skyblue/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center relative z-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 mb-4 shadow-xl">
          <ShieldCheck className="w-8 h-8 text-skyblue" />
        </div>
        <h2 className="text-3xl font-black tracking-tight">Skynexa Staff Portal</h2>
        <p className="mt-2 text-xs text-slate-400">
          Super Admin, Schedule Admin, and Marketing Operations
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl relative z-10">
        <div className="bg-navy-800/90 backdrop-blur-xl border border-white/10 py-8 px-6 sm:px-10 rounded-3xl shadow-2xl space-y-6">

          {/* Quick Default Admin Account Selection Cards */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" /> Default Admin Logins (Click to Fill & Sign In)
              </span>
              <span className="text-[10px] text-slate-400 font-mono">1-Click Ready</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {DEFAULT_ADMIN_ACCOUNTS.map((adm) => {
                const Icon = adm.icon;
                const isSelected = selectedRole === adm.role;
                return (
                  <div
                    key={adm.role}
                    onClick={() => handleSelectDefaultAdmin(adm, false)}
                    className={`relative p-3 rounded-2xl border transition-all cursor-pointer text-left flex flex-col justify-between ${
                      isSelected
                        ? adm.activeBg
                        : 'bg-navy-900/60 border-white/10 hover:border-white/30'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${adm.badgeColor}`}>
                          {adm.title}
                        </span>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-skyblue" />}
                      </div>
                      <p className="text-[11px] font-mono text-slate-200 font-bold truncate">{adm.email}</p>
                      <p className="text-[10px] text-slate-400 leading-tight mt-1 line-clamp-2">{adm.description}</p>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectDefaultAdmin(adm, true);
                      }}
                      className="mt-3 w-full py-1.5 px-2 bg-white/10 hover:bg-skyblue text-white rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Zap className="w-3 h-3 text-amber-300" />
                      <span>Instant Sign In</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-navy-800 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                Or Sign In with Selected Credentials
              </span>
            </div>
          </div>

          {error && (
            <div className="p-3.5 bg-rose-500/20 border border-rose-500/40 rounded-xl text-xs font-semibold text-rose-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                Admin Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setSelectedRole('');
                  }}
                  placeholder="admin@skynexa.com"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-navy-900 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-skyblue font-medium font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                Security Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-navy-900 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-skyblue font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-4 py-3.5 bg-skyblue hover:bg-skyblue/90 text-white font-extrabold rounded-xl shadow-lg transition flex items-center justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer"
            >
              <span>{submitting ? 'Authenticating Staff...' : `Sign In as ${selectedRole ? selectedRole.replace('_', ' ') : 'Admin'}`}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Credentials quick cheat table */}
          <div className="p-3 bg-navy-900/60 rounded-xl border border-white/5 text-[11px] text-slate-400 space-y-1">
            <div className="flex justify-between items-center text-slate-300 font-bold">
              <span>Default Credentials Reference:</span>
              <span className="text-[10px] text-emerald-400">● Live in Atlas</span>
            </div>
            <div className="grid grid-cols-3 gap-1 pt-1 text-[10px] font-mono">
              <div>Super: <span className="text-slate-300">SuperAdmin@2026</span></div>
              <div>Schedule: <span className="text-slate-300">ScheduleAdmin@2026</span></div>
              <div>Marketing: <span className="text-slate-300">MarketingAdmin@2026</span></div>
            </div>
          </div>

          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white transition"
            >
              <Plane className="w-3.5 h-3.5 rotate-45 text-skyblue" />
              Public Search Engine
            </Link>
            <Link
              to="/login"
              className="text-slate-400 hover:text-skyblue transition font-bold"
            >
              Customer Portal →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;

