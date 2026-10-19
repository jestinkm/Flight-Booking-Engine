import React, { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Plane, Bell, User, Menu, X, LogOut, Ticket, Settings, ShieldCheck, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const { unreadCount } = useNotifications();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    setUserDropdownOpen(false);
    navigate('/login', { replace: true });
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Search Flights', path: '/search' },
    { name: 'My Bookings', path: '/my-bookings', authRequired: true },
    { name: 'Offers', path: '/offers' },
    { name: 'Help & Support', path: '/support' }
  ];

  const getAdminPath = () => {
    if (!user) return '/admin-login';
    if (user.role === 'SUPER_ADMIN') return '/admin/super';
    if (user.role === 'SCHEDULE_ADMIN') return '/admin/schedule';
    if (user.role === 'MARKETING_ADMIN') return '/admin/marketing';
    return '/admin/super';
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-xs transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-navy flex items-center justify-center text-white shadow-md shadow-navy/20 group-hover:scale-110 group-hover:rotate-6 group-hover:shadow-skyblue/30 transition-all duration-300">
              <Plane className="w-5 h-5 text-skyblue rotate-45 transform group-hover:rotate-90 transition-transform duration-500" />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="text-2xl font-extrabold tracking-tight text-navy group-hover:text-skyblue transition-colors duration-300">SKYNEXA</span>
                <span className="w-2 h-2 rounded-full bg-skyblue animate-pulse"></span>
              </div>
              <span className="text-[10px] tracking-widest text-slate-400 font-semibold uppercase block -mt-1">
                Airlines
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link) => {
              if (link.authRequired && !user) return null;
              return (
                <NavLink
                  key={link.name}
                  to={link.path}
                  className={({ isActive }) =>
                    `px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors ${
                      isActive
                        ? 'text-skyblue bg-skyblue-light'
                        : 'text-slate-600 hover:text-navy hover:bg-slate-50'
                    }`
                  }
                >
                  {link.name}
                </NavLink>
              );
            })}
          </nav>

          {/* Right Action Menu */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                {/* Notification Bell */}
                <Link
                  to="/notifications"
                  className="relative p-2.5 text-slate-500 hover:text-navy hover:bg-slate-100 rounded-full transition"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>

                {/* User Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2.5 p-1.5 pl-3 pr-2 rounded-full border border-slate-200 hover:border-slate-300 transition bg-slate-50 hover:bg-slate-100"
                  >
                    <div className="w-7 h-7 rounded-full bg-navy text-white text-xs font-bold flex items-center justify-center uppercase">
                      {user.firstName ? user.firstName[0] : user.name ? user.name[0] : 'U'}
                    </div>
                    <span className="text-sm font-semibold text-navy max-w-[120px] truncate">
                      {user.firstName || user.name || user.email?.split('@')[0]}
                    </span>
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </button>

                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 animate-scaleUp transform origin-top-right">
                      <div className="px-4 py-2.5 border-b border-slate-100">
                        <p className="text-xs text-slate-400 font-medium">Signed in as</p>
                        <p className="text-sm font-bold text-navy truncate">{user.email}</p>
                        {user.role && user.role !== 'CUSTOMER' && (
                          <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold rounded-md bg-navy text-skyblue">
                            {user.role}
                          </span>
                        )}
                      </div>

                      <div className="py-1">
                        <Link
                          to="/user/home"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-navy font-semibold transition-colors duration-150"
                        >
                          <Plane className="w-4 h-4 text-skyblue" />
                          Dashboard
                        </Link>
                        <Link
                          to="/profile"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-navy transition-colors duration-150"
                        >
                          <User className="w-4 h-4 text-slate-400" />
                          My Profile
                        </Link>
                        <Link
                          to="/my-bookings"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-navy transition-colors duration-150"
                        >
                          <Ticket className="w-4 h-4 text-slate-400" />
                          My Bookings
                        </Link>
                        {isAdmin && (
                          <Link
                            to={getAdminPath()}
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-sm text-skyblue font-medium hover:bg-skyblue/5 transition-colors duration-150"
                          >
                            <ShieldCheck className="w-4 h-4" />
                            Admin Console
                          </Link>
                        )}
                      </div>

                      <div className="border-t border-slate-100 pt-1">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-colors duration-150"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-semibold text-navy hover:text-skyblue transition active:scale-95"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-navy hover:bg-navy-800 rounded-xl shadow-sm transition hover:shadow-lg hover:-translate-y-0.5 active:scale-95 duration-200"
                >
                  Create Account
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden gap-2">
            {user && (
              <Link
                to="/notifications"
                className="relative p-2 text-slate-600 rounded-lg"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </Link>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-600 hover:text-navy hover:bg-slate-100 transition"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 pt-3 pb-6 shadow-xl animate-fadeIn">
          <div className="space-y-1">
            {navLinks.map((link) => {
              if (link.authRequired && !user) return null;
              return (
                <NavLink
                  key={link.name}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `block px-3 py-2.5 rounded-xl text-base font-medium transition ${
                      isActive
                        ? 'text-skyblue bg-skyblue-light'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`
                  }
                >
                  {link.name}
                </NavLink>
              );
            })}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100">
            {user ? (
              <div className="space-y-2">
                <div className="px-3 py-2 bg-slate-50 rounded-xl">
                  <p className="text-xs text-slate-400">Signed in as</p>
                  <p className="text-sm font-bold text-navy truncate">{user.email}</p>
                </div>
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-50"
                >
                  <User className="w-4 h-4" />
                  My Profile
                </Link>
                {isAdmin && (
                  <Link
                    to={getAdminPath()}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-skyblue font-medium hover:bg-skyblue/5"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Admin Console
                  </Link>
                )}
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-rose-600 hover:bg-rose-50"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 text-sm font-semibold text-navy bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 text-sm font-semibold text-white bg-navy hover:bg-navy-800 rounded-xl transition"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
