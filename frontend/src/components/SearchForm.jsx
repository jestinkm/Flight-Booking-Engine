import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plane, Calendar, Users, ArrowRightLeft, Search } from 'lucide-react';
import api from '../lib/axios';

const DEFAULT_AIRPORTS = [
  { code: 'DEL', city: 'New Delhi', name: 'Indira Gandhi Intl', country: 'India' },
  { code: 'BOM', city: 'Mumbai', name: 'Chhatrapati Shivaji Maharaj Intl', country: 'India' },
  { code: 'BLR', city: 'Bengaluru', name: 'Kempegowda Intl', country: 'India' },
  { code: 'MAA', city: 'Chennai', name: 'Chennai Intl', country: 'India' },
  { code: 'HYD', city: 'Hyderabad', name: 'Rajiv Gandhi Intl', country: 'India' },
  { code: 'CCU', city: 'Kolkata', name: 'Netaji Subhash Chandra Bose Intl', country: 'India' },
  { code: 'COK', city: 'Kochi', name: 'Cochin Intl', country: 'India' },
  { code: 'GOI', city: 'Goa (Dabolim)', name: 'Dabolim Airport', country: 'India' },
  { code: 'GOX', city: 'Goa (Mopa)', name: 'Manohar Intl Airport', country: 'India' },
  { code: 'AMD', city: 'Ahmedabad', name: 'Sardar Vallabhbhai Patel Intl', country: 'India' },
  { code: 'PNQ', city: 'Pune', name: 'Pune Airport', country: 'India' },
  { code: 'JAI', city: 'Jaipur', name: 'Jaipur Intl Airport', country: 'India' },
  { code: 'LKO', city: 'Lucknow', name: 'Chaudhary Charan Singh Intl', country: 'India' },
  { code: 'TRV', city: 'Thiruvananthapuram', name: 'Trivandrum Intl Airport', country: 'India' },
  { code: 'GAU', city: 'Guwahati', name: 'Lokpriya Gopinath Bordoloi Intl', country: 'India' },
  { code: 'IXB', city: 'Bagdogra', name: 'Bagdogra Airport', country: 'India' },
  { code: 'IXC', city: 'Chandigarh', name: 'Shaheed Bhagat Singh Intl', country: 'India' },
  { code: 'VNS', city: 'Varanasi', name: 'Lal Bahadur Shastri Intl', country: 'India' },
  { code: 'BBI', city: 'Bhubaneswar', name: 'Biju Patnaik Intl', country: 'India' },
  { code: 'PAT', city: 'Patna', name: 'Jay Prakash Narayan Airport', country: 'India' },
  { code: 'SXR', city: 'Srinagar', name: 'Sheikh ul-Alam Intl Airport', country: 'India' },
  { code: 'IXZ', city: 'Port Blair', name: 'Veer Savarkar Intl Airport', country: 'India' },
  { code: 'DXB', city: 'Dubai', name: 'Dubai Intl Airport', country: 'United Arab Emirates' },
  { code: 'SIN', city: 'Singapore', name: 'Singapore Changi Airport', country: 'Singapore' },
  { code: 'LHR', city: 'London', name: 'London Heathrow Airport', country: 'United Kingdom' },
  { code: 'JFK', city: 'New York', name: 'John F. Kennedy Intl Airport', country: 'United States' },
  { code: 'BKK', city: 'Bangkok', name: 'Suvarnabhumi Airport', country: 'Thailand' },
  { code: 'DOH', city: 'Doha', name: 'Hamad Intl Airport', country: 'Qatar' },
  { code: 'KUL', city: 'Kuala Lumpur', name: 'Kuala Lumpur Intl Airport', country: 'Malaysia' },
  { code: 'CDG', city: 'Paris', name: 'Charles de Gaulle Airport', country: 'France' }
];

const SearchForm = ({ initialValues = {}, className = '', compact = false }) => {
  const navigate = useNavigate();
  const passengerDropdownRef = useRef(null);
  const [airports, setAirports] = useState(DEFAULT_AIRPORTS);

  const todayStr = new Date().toISOString().split('T')[0];

  const [origin, setOrigin] = useState(initialValues.origin || 'DEL');
  const [destination, setDestination] = useState(initialValues.destination || 'BOM');
  const [departureDate, setDepartureDate] = useState(initialValues.date || todayStr);

  // Defaults: Adults: 1, Children: 0, Total: 1 Traveler
  const [adults, setAdults] = useState(() => {
    const val = Number(initialValues.adults);
    return !isNaN(val) && val >= 1 ? val : 1;
  });
  const [children, setChildren] = useState(() => {
    const val = Number(initialValues.children);
    return !isNaN(val) && val >= 0 ? val : 0;
  });
  const [passengerDropdownOpen, setPassengerDropdownOpen] = useState(false);
  const [error, setError] = useState('');

  // Keep state in sync with external initialValues updates (e.g. URL query param changes)
  useEffect(() => {
    if (initialValues.origin) setOrigin(initialValues.origin);
    if (initialValues.destination) setDestination(initialValues.destination);
    if (initialValues.date) setDepartureDate(initialValues.date);
    if (initialValues.adults !== undefined) {
      const parsedAdults = Number(initialValues.adults);
      if (!isNaN(parsedAdults) && parsedAdults >= 1) {
        setAdults(parsedAdults);
      }
    }
    if (initialValues.children !== undefined) {
      const parsedChildren = Number(initialValues.children);
      if (!isNaN(parsedChildren) && parsedChildren >= 0) {
        setChildren(parsedChildren);
      }
    }
  }, [initialValues.origin, initialValues.destination, initialValues.date, initialValues.adults, initialValues.children]);

  // Click outside listener for the passenger selector dropdown (desktop and mobile)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (passengerDropdownRef.current && !passengerDropdownRef.current.contains(event.target)) {
        setPassengerDropdownOpen(false);
      }
    };

    if (passengerDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [passengerDropdownOpen]);

  // Fetch airports catalog
  useEffect(() => {
    const fetchAirports = async () => {
      try {
        const res = await api.get('/airports');
        const data = res.data?.airports || res.data?.data?.airports || (Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : null);
        if (data && data.length > 0) {
          setAirports(data);
        }
      } catch {
        // Fallback to default airports
      }
    };
    fetchAirports();
  }, []);

  const totalPassengers = adults + children;

  // Passenger adjustment handlers with strict bounds
  // Min adults: 1, Min children: 0, Max total: 9, No negative values
  const handleAdultsChange = (delta) => {
    setAdults((prevAdults) => {
      const next = prevAdults + delta;
      if (next < 1) return 1;
      if (next + children > 9) return prevAdults;
      return next;
    });
  };

  const handleChildrenChange = (delta) => {
    setChildren((prevChildren) => {
      const next = prevChildren + delta;
      if (next < 0) return 0;
      if (adults + next > 9) return prevChildren;
      return next;
    });
  };

  const handleSwap = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!origin) {
      setError('Please select an origin airport');
      return;
    }
    if (!destination) {
      setError('Please select a destination airport');
      return;
    }
    if (origin === destination) {
      setError('Origin and destination cannot be the same');
      return;
    }
    if (!departureDate) {
      setError('Please select a travel date');
      return;
    }

    setError('');
    const params = new URLSearchParams({
      origin,
      destination,
      date: departureDate,
      adults: adults.toString(),
      children: children.toString()
    });

    navigate(`/search?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`}>
      {error && (
        <div className="mb-4 p-3 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between">
          <span>{error}</span>
          <button type="button" onClick={() => setError('')} className="text-rose-500 hover:text-rose-700">✕</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
        {/* Origin */}
        <div className="md:col-span-3 bg-white p-3 rounded-2xl border border-slate-200 hover:border-skyblue focus-within:border-skyblue focus-within:ring-2 focus-within:ring-skyblue/20 transition shadow-xs">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            From
          </label>
          <div className="flex items-center gap-2">
            <Plane className="w-4 h-4 text-skyblue shrink-0" />
            <select
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              className="w-full bg-transparent font-semibold text-navy text-sm focus:outline-none cursor-pointer"
            >
              {airports.map((airport) => (
                <option key={airport.code || airport.iataCode} value={airport.code || airport.iataCode}>
                  {airport.city} ({airport.code || airport.iataCode})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Swap Button */}
        <div className="hidden md:flex md:col-span-1 justify-center -mx-2 z-10">
          <button
            type="button"
            onClick={handleSwap}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-skyblue hover:text-white text-navy flex items-center justify-center border border-slate-200 transition-all duration-300 hover:rotate-180 hover:scale-110 active:scale-90 shadow-xs cursor-pointer"
            title="Swap locations"
          >
            <ArrowRightLeft className="w-4 h-4 transition-transform duration-300" />
          </button>
        </div>

        {/* Destination */}
        <div className="md:col-span-3 bg-white p-3 rounded-2xl border border-slate-200 hover:border-skyblue focus-within:border-skyblue focus-within:ring-2 focus-within:ring-skyblue/20 transition shadow-xs">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            To
          </label>
          <div className="flex items-center gap-2">
            <Plane className="w-4 h-4 text-skyblue rotate-90 shrink-0" />
            <select
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full bg-transparent font-semibold text-navy text-sm focus:outline-none cursor-pointer"
            >
              {airports.map((airport) => (
                <option key={airport.code || airport.iataCode} value={airport.code || airport.iataCode}>
                  {airport.city} ({airport.code || airport.iataCode})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Date */}
        <div className="md:col-span-2 bg-white p-3 rounded-2xl border border-slate-200 hover:border-skyblue focus-within:border-skyblue focus-within:ring-2 focus-within:ring-skyblue/20 transition shadow-xs">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Departure
          </label>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-skyblue shrink-0" />
            <input
              type="date"
              value={departureDate}
              min={todayStr}
              onChange={(e) => setDepartureDate(e.target.value)}
              className="w-full bg-transparent font-semibold text-navy text-sm focus:outline-none cursor-pointer"
            >
            </input>
          </div>
        </div>

        {/* Passengers Dropdown Selector */}
        <div className="md:col-span-3 relative" ref={passengerDropdownRef}>
          <div
            role="button"
            tabIndex={0}
            onClick={() => setPassengerDropdownOpen((prev) => !prev)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setPassengerDropdownOpen((prev) => !prev);
              }
            }}
            className={`bg-white p-3 rounded-2xl border cursor-pointer transition shadow-xs select-none ${
              passengerDropdownOpen ? 'border-skyblue ring-2 ring-skyblue/20' : 'border-slate-200 hover:border-skyblue'
            }`}
          >
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 cursor-pointer">
              Passengers
            </label>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-skyblue shrink-0" />
              <span className="text-sm font-semibold text-navy">
                {totalPassengers} Traveler{totalPassengers > 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {passengerDropdownOpen && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute top-full right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 z-50 animate-scaleUp transform origin-top-right select-none"
            >
              {/* Adults (+/-) */}
              <div className="flex items-center justify-between py-2.5 border-b border-slate-100">
                <div>
                  <p className="text-sm font-bold text-navy">Adults</p>
                  <p className="text-xs text-slate-400">Age 12+</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label="Decrease Adults"
                    onClick={() => handleAdultsChange(-1)}
                    disabled={adults <= 1}
                    className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold text-navy flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed active:scale-90 transition-all cursor-pointer touch-manipulation"
                  >
                    -
                  </button>
                  <span className="w-6 text-center font-bold text-navy text-sm">{adults}</span>
                  <button
                    type="button"
                    aria-label="Increase Adults"
                    onClick={() => handleAdultsChange(1)}
                    disabled={totalPassengers >= 9}
                    className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold text-navy flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed active:scale-90 transition-all cursor-pointer touch-manipulation"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Children (+/-) */}
              <div className="flex items-center justify-between py-2.5 border-b border-slate-100">
                <div>
                  <p className="text-sm font-bold text-navy">Children</p>
                  <p className="text-xs text-slate-400">Age 2 - 11</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label="Decrease Children"
                    onClick={() => handleChildrenChange(-1)}
                    disabled={children <= 0}
                    className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold text-navy flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed active:scale-90 transition-all cursor-pointer touch-manipulation"
                  >
                    -
                  </button>
                  <span className="w-6 text-center font-bold text-navy text-sm">{children}</span>
                  <button
                    type="button"
                    aria-label="Increase Children"
                    onClick={() => handleChildrenChange(1)}
                    disabled={totalPassengers >= 9}
                    className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold text-navy flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed active:scale-90 transition-all cursor-pointer touch-manipulation"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Max Passengers Limit Notice */}
              {totalPassengers >= 9 && (
                <p className="text-[11px] font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg mt-2.5 text-center border border-amber-200/60">
                  Maximum 9 travelers per booking reached
                </p>
              )}

              {/* Done Button */}
              <button
                type="button"
                onClick={() => setPassengerDropdownOpen(false)}
                className="mt-3.5 w-full py-2.5 text-xs font-bold text-white bg-navy hover:bg-skyblue rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="submit"
          className="group w-full md:w-auto px-8 py-3.5 bg-skyblue hover:bg-navy text-white font-bold rounded-xl shadow-md hover:shadow-xl hover:shadow-sky-400/25 hover:-translate-y-0.5 active:scale-95 transition-all duration-300 flex items-center justify-center gap-2.5 text-sm cursor-pointer"
        >
          <Search className="w-4 h-4 group-hover:scale-125 group-hover:rotate-12 transition-transform duration-300" />
          <span>Search Flights</span>
        </button>
      </div>
    </form>
  );
};

export default SearchForm;
