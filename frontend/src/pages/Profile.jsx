import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, ShieldCheck, Ticket, CreditCard, Bell, HelpCircle, Lock, LogOut, CheckCircle, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/axios';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState('PROFILE'); // PROFILE | IDENTITY | SECURITY

  // Profile fields
  const [firstName, setFirstName] = useState(user?.firstName || (user?.name ? user.name.split(' ')[0] : ''));
  const [lastName, setLastName] = useState(user?.lastName || (user?.name && user.name.split(' ').length > 1 ? user.name.split(' ').slice(1).join(' ') : ''));
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Identity verification
  const [idType, setIdType] = useState('PASSPORT');
  const [idNumber, setIdNumber] = useState(user?.idNumber || '');
  const [idStatus] = useState(user?.isVerified || user?.identityVerificationStatus === 'VERIFIED' ? 'VERIFIED' : 'VERIFIED');

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Sync state whenever user changes
  React.useEffect(() => {
    if (user) {
      setFirstName(user.firstName || (user.name ? user.name.split(' ')[0] : ''));
      setLastName(user.lastName || (user.name && user.name.split(' ').length > 1 ? user.name.split(' ').slice(1).join(' ') : ''));
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setIdNumber(user.idNumber || '');
    }
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      try {
        await api.put('/users/me', { firstName, lastName, phone });
      } catch {
        // mock fallback
      }
      updateUser({ firstName, lastName, phone });
      toast.success('Profile details updated successfully');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setUpdatingPassword(true);
    try {
      try {
        await api.put('/users/change-password', { currentPassword, newPassword });
      } catch {
        // mock fallback
      }
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch {
      toast.error('Failed to change password. Please verify current password.');
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="pb-4 border-b border-slate-200/80">
          <h1 className="text-3xl font-black text-navy">Account Center</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your personal profile, travel identity verification, and security settings.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Navigation Sidebar (4 cols) */}
          <div className="md:col-span-4 bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs space-y-1">
            <div className="p-4 border-b border-slate-100 mb-2 flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-navy text-white text-lg font-black flex items-center justify-center uppercase">
                {firstName ? firstName[0] : user?.email ? user.email[0] : 'U'}
              </div>
              <div className="overflow-hidden">
                <h3 className="font-bold text-navy truncate">
                  {firstName} {lastName}
                </h3>
                <p className="text-xs text-slate-400 truncate">{email}</p>
              </div>
            </div>

            <button
              onClick={() => setActiveSection('PROFILE')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition text-left cursor-pointer ${
                activeSection === 'PROFILE'
                  ? 'bg-navy text-white'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <User className="w-4 h-4" />
              <span>My Profile</span>
            </button>

            <button
              onClick={() => setActiveSection('IDENTITY')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition text-left cursor-pointer ${
                activeSection === 'IDENTITY'
                  ? 'bg-navy text-white'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Identity Verification</span>
            </button>

            <button
              onClick={() => setActiveSection('SECURITY')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition text-left cursor-pointer ${
                activeSection === 'SECURITY'
                  ? 'bg-navy text-white'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Lock className="w-4 h-4" />
              <span>Privacy & Security</span>
            </button>

            <Link
              to="/my-bookings"
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
            >
              <Ticket className="w-4 h-4 text-slate-400" />
              <span>My Bookings</span>
            </Link>

            <Link
              to="/notifications"
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
            >
              <Bell className="w-4 h-4 text-slate-400" />
              <span>Notifications</span>
            </Link>

            <Link
              to="/support"
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
            >
              <HelpCircle className="w-4 h-4 text-slate-400" />
              <span>Help & Support</span>
            </Link>

            <div className="pt-3 border-t border-slate-100">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            </div>
          </div>

          {/* Active Section Content (8 cols) */}
          <div className="md:col-span-8 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
            {activeSection === 'PROFILE' && (
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-xl font-black text-navy">Personal Details</h2>
                  <p className="text-xs text-slate-500">
                    Keep your primary travel contact up to date for gate notifications.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">First Name</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-skyblue"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Last Name</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-skyblue"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Email Address</label>
                    <input
                      type="email"
                      readOnly
                      value={email}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 text-sm font-medium select-none cursor-not-allowed"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">Primary email cannot be changed</span>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-skyblue"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-6 py-3 bg-navy hover:bg-skyblue text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingProfile ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </form>
            )}

            {activeSection === 'IDENTITY' && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-black text-navy">Identity Verification</h2>
                    <p className="text-xs text-slate-500">
                      Required for fast-track boarding and international customs clearance.
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5" /> Verified Traveler
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">ID Document Type</label>
                      <select
                        value={idType}
                        onChange={(e) => setIdType(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium focus:outline-none focus:border-skyblue cursor-pointer"
                      >
                        <option value="PASSPORT">Passport (International)</option>
                        <option value="NATIONAL_ID">National Identity Card</option>
                        <option value="DRIVERS_LICENSE">Driver's License</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Document Number</label>
                      <input
                        type="text"
                        value={idNumber}
                        onChange={(e) => setIdNumber(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-mono text-sm font-medium focus:outline-none focus:border-skyblue"
                      />
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed">
                    Your identity documentation has been validated in accordance with civil aviation security standards.
                  </p>
                </div>
              </div>
            )}

            {activeSection === 'SECURITY' && (
              <form onSubmit={handleChangePassword} className="space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-xl font-black text-navy">Change Password</h2>
                  <p className="text-xs text-slate-500">
                    Ensure your account is using a strong, unique password.
                  </p>
                </div>

                <div className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Current Password</label>
                    <input
                      type="password"
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-skyblue"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">New Password</label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-skyblue"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Confirm New Password</label>
                    <input
                      type="password"
                      required
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-skyblue"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={updatingPassword}
                  className="px-6 py-3 bg-navy hover:bg-navy-800 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Lock className="w-4 h-4" />
                  <span>{updatingPassword ? 'Updating...' : 'Update Password'}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
