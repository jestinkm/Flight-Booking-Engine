import React from 'react';
import { Link } from 'react-router-dom';
import { Plane, ShieldCheck, Mail, Phone, MapPin, Heart } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-navy text-slate-300 pt-16 pb-8 border-t border-navy-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-navy-800">
          {/* Brand info */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-skyblue flex items-center justify-center text-white shadow-md">
                <Plane className="w-5 h-5 text-white rotate-45 transform" />
              </div>
              <span className="text-2xl font-extrabold tracking-tight text-white">SKYNEXA</span>
            </Link>
            <p className="text-slate-400 text-sm max-w-sm leading-relaxed">
              Smarter Flights. Simpler Journeys. Skynexa provides state-of-the-art flight booking, seamless seat selection, and transparent fares across premium global destinations.
            </p>
            <div className="flex items-center gap-4 text-xs text-slate-400 pt-2">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-skyblue" /> IATA Accredited
              </span>
              <span>•</span>
              <span>24/7 Priority Support</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white text-sm font-semibold tracking-wider uppercase mb-4">Explore</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/search" className="hover:text-skyblue transition">Search Flights</Link>
              </li>
              <li>
                <Link to="/offers" className="hover:text-skyblue transition">Special Offers & Deals</Link>
              </li>
              <li>
                <Link to="/my-bookings" className="hover:text-skyblue transition">Manage Bookings</Link>
              </li>
              <li>
                <Link to="/support" className="hover:text-skyblue transition">Help & FAQs</Link>
              </li>
            </ul>
          </div>

          {/* Top Destinations */}
          <div>
            <h4 className="text-white text-sm font-semibold tracking-wider uppercase mb-4">Popular Indian Routes</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/search?origin=MAA&destination=BLR" className="hover:text-skyblue transition">Chennai to Bengaluru</Link>
              </li>
              <li>
                <Link to="/search?origin=DEL&destination=BOM" className="hover:text-skyblue transition">Delhi to Mumbai</Link>
              </li>
              <li>
                <Link to="/search?origin=BLR&destination=DEL" className="hover:text-skyblue transition">Bengaluru to Delhi</Link>
              </li>
              <li>
                <Link to="/search?origin=BOM&destination=GOI" className="hover:text-skyblue transition">Mumbai to Goa</Link>
              </li>
              <li>
                <Link to="/search?origin=HYD&destination=COK" className="hover:text-skyblue transition">Hyderabad to Kochi</Link>
              </li>
            </ul>
          </div>

          {/* Contact & Admin */}
          <div>
            <h4 className="text-white text-sm font-semibold tracking-wider uppercase mb-4">Connect</h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-skyblue" /> support@skynexa.in
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-skyblue" /> +91 (044) 2256-SKYN
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-skyblue" /> Chennai International Airport, Chennai 600027
              </li>
              <li className="pt-3">
                <Link
                  to="/admin-login"
                  className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg bg-navy-800 hover:bg-navy-700 transition"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-skyblue" />
                  Staff Portal
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© {new Date().getFullYear()} Skynexa Aviation Technologies Inc. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-slate-300 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-slate-300 cursor-pointer">Terms of Service</span>
            <span className="hover:text-slate-300 cursor-pointer">Cookie Settings</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
