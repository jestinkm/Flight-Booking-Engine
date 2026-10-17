import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/axios';
import {
  User,
  Mail,
  Plane,
  Ticket,
  LogOut,
  ShieldCheck,
  Search,
  Calendar,
  Sparkles,
  ArrowRight,
  Clock,
  CheckCircle2,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';

const UserHome = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [recentBookings, setRecentBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);

  // Fetch user's bookings from MongoDB
  useEffect(() => {
    const fetchUserBookings = async () => {
      try {
        const response = await api.get('/bookings/my-bookings');
        const bookingsList = response.data?.bookings || response.data?.data?.bookings || [];
        setRecentBookings(bookingsList.slice(0, 3));
      } catch (err) {
        // Fallback gracefully
        setRecentBookings([]);
      } finally {
        setLoadingBookings(false);
      }
    };

    fetchUserBookings();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const displayName = user?.firstName
    ? `${user.firstName} ${user.lastName || ''}`.trim()
    : user?.name || user?.email?.split('@')[0] || 'Traveler';

  const avatarUrl = user?.avatar || user?.picture || user?.photoURL;

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Top Header / Welcome Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-navy via-navy to-slate-900 text-white p-6 sm:p-10 shadow-xl border border-slate-800">
          {/* Subtle Background Glows */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 bg-skyblue/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 -mb-20 w-60 h-60 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            {/* User Profile Card */}
            <div className="flex items-center gap-5">
              <div className="relative">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover ring-4 ring-skyblue/30 shadow-lg bg-slate-800"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-tr from-skyblue to-navy flex items-center justify-center text-white text-2xl sm:text-3xl font-black ring-4 ring-skyblue/30 shadow-lg uppercase">
                    {displayName.charAt(0)}
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1 rounded-full ring-2 ring-navy" title="Verified Google Account">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-skyblue/20 border border-skyblue/30 text-sky-300 text-[11px] font-bold">
                  <Sparkles className="w-3 h-3 text-skyblue" />
                  <span>Verified Google Passenger</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Welcome back, {displayName}!
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 font-mono flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-skyblue" />
                  <span>{user?.email}</span>
                </p>
              </div>
            </div>

            {/* Quick Actions / Logout Button */}
            <div className="flex items-center gap-3">
              <Link
                to="/search"
                className="px-5 py-2.5 bg-skyblue hover:bg-sky-400 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition flex items-center gap-2 group cursor-pointer"
              >
                <Plane className="w-4 h-4 group-hover:rotate-45 transition-transform" />
                <span>Book a Flight</span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="px-4 py-2.5 bg-white/10 hover:bg-rose-500/20 hover:text-rose-300 text-slate-200 text-xs sm:text-sm font-bold rounded-xl border border-white/10 transition flex items-center gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>

        {/* Dashboard Grid Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Account Status */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Account Credentials</h3>
              <span className="p-2 bg-sky-50 text-skyblue rounded-xl">
                <ShieldCheck className="w-4 h-4" />
              </span>
            </div>
            <div>
              <p className="text-xs text-slate-500">Authentication Provider</p>
              <p className="text-sm font-bold text-navy flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Google Firebase OAuth
              </p>
            </div>
            <div className="pt-2 border-t border-slate-100">
              <p className="text-[11px] text-slate-400 font-mono truncate">
                UID: {user?.googleId || user?._id || 'firebase_authenticated'}
              </p>
            </div>
          </div>

          {/* Card 2: Frequent Flyer / Rewards */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Membership Tier</h3>
              <span className="p-2 bg-amber-50 text-amber-500 rounded-xl">
                <Sparkles className="w-4 h-4" />
              </span>
            </div>
            <div>
              <p className="text-xs text-slate-500">Loyalty Status</p>
              <p className="text-sm font-bold text-navy flex items-center gap-1.5 mt-0.5">
                Skynexa Gold Voyager
              </p>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Available Miles:</span>
              <span className="font-extrabold text-navy font-mono">14,250 pts</span>
            </div>
          </div>

          {/* Card 3: Quick Bookings Status */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Itineraries</h3>
              <span className="p-2 bg-indigo-50 text-indigo-500 rounded-xl">
                <Ticket className="w-4 h-4" />
              </span>
            </div>
            <div>
              <p className="text-xs text-slate-500">Confirmed Trips</p>
              <p className="text-sm font-bold text-navy mt-0.5">
                {recentBookings.length} Active Booking{recentBookings.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="pt-2 border-t border-slate-100">
              <Link to="/my-bookings" className="text-xs font-bold text-skyblue hover:underline flex items-center gap-1">
                <span>View all bookings</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Portal Shortcuts */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-navy">Flight Services &amp; Portal Actions</h2>
            <span className="text-xs text-slate-400 font-medium">Quick Access</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              to="/search"
              className="p-5 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-sm transition group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-skyblue flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Search className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-navy group-hover:text-skyblue transition">Search Flights</h4>
              <p className="text-xs text-slate-500 mt-1">Real-time domestic &amp; international flight schedules.</p>
            </Link>

            <Link
              to="/my-bookings"
              className="p-5 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-sm transition group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Ticket className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-navy group-hover:text-indigo-600 transition">My Bookings</h4>
              <p className="text-xs text-slate-500 mt-1">Download tickets, view seat layouts &amp; cancel seats.</p>
            </Link>

            <Link
              to="/profile"
              className="p-5 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-sm transition group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <User className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-navy group-hover:text-emerald-600 transition">Travel Profile</h4>
              <p className="text-xs text-slate-500 mt-1">Passenger ID documents, passport &amp; contact info.</p>
            </Link>

            <Link
              to="/offers"
              className="p-5 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-sm transition group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-navy group-hover:text-amber-600 transition">Member Offers</h4>
              <p className="text-xs text-slate-500 mt-1">Exclusive promo fares and family discount packages.</p>
            </Link>
          </div>
        </div>

        {/* Recent Flights Table Snapshot */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-extrabold text-navy">Recent Flight Bookings</h3>
              <p className="text-xs text-slate-500 mt-0.5">Your upcoming and completed itineraries</p>
            </div>
            <Link
              to="/my-bookings"
              className="text-xs font-bold text-skyblue hover:underline flex items-center gap-1"
            >
              <span>Manage all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loadingBookings ? (
            <div className="py-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <Clock className="w-4 h-4 animate-spin text-skyblue" />
              <span>Loading itinerary details...</span>
            </div>
          ) : recentBookings.length > 0 ? (
            <div className="space-y-3">
              {recentBookings.map((b) => (
                <div
                  key={b._id}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-sky-300 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-navy text-white flex items-center justify-center text-xs font-black">
                      {b.flight?.flightNumber || 'SK'}
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-navy">
                        {b.flight?.origin?.code || 'DEL'} &rarr; {b.flight?.destination?.code || 'BOM'}
                      </p>
                      <p className="text-[11px] text-slate-500 font-mono">
                        PNR: {b.bookingReference || b._id?.slice(-8).toUpperCase()} • {b.passengers?.length || 1} Passenger(s)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 justify-between sm:justify-end">
                    <span className="px-2.5 py-1 text-[10px] font-extrabold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                      {b.status || 'CONFIRMED'}
                    </span>
                    <Link
                      to={`/my-bookings`}
                      className="px-3 py-1.5 bg-white text-navy text-xs font-bold rounded-xl border border-slate-200 hover:bg-slate-100 transition shadow-2xs"
                    >
                      View Ticket
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Ticket className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-navy">No bookings found yet</p>
                <p className="text-xs text-slate-400 mt-0.5">Search and book flights across 30+ destinations.</p>
              </div>
              <Link
                to="/search"
                className="inline-flex items-center gap-2 px-4 py-2 bg-navy text-white text-xs font-bold rounded-xl hover:bg-skyblue transition shadow-xs"
              >
                <Plane className="w-3.5 h-3.5" />
                <span>Search Flights</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserHome;
