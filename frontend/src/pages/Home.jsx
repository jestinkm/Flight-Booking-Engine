import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plane,
  Zap,
  ShieldCheck,
  Tag,
  Globe,
  Award,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Compass,
  Clock,
  Radio,
  Wifi,
  Coffee,
  Armchair,
  Layers,
  ChevronRight,
  Gauge,
  Navigation,
  Percent,
  Users,
  Check,
  Search
} from 'lucide-react';
import api from '../lib/axios';
import SearchForm from '../components/SearchForm';
import HeroFlightAnimation from '../components/HeroFlightAnimation';

const LIVE_DEPARTURES_BOARD = [
  { flight: 'SK-101', route: 'Chennai (MAA) → Bengaluru (BLR)', time: '08:30 AM', status: 'ON TIME', gate: 'Gate 4B', statusColor: 'text-emerald-400 bg-emerald-500/20' },
  { flight: 'SK-204', route: 'New Delhi (DEL) → Mumbai (BOM)', time: '11:15 AM', status: 'BOARDING', gate: 'Gate 2A', statusColor: 'text-amber-400 bg-amber-500/20' },
  { flight: 'SK-309', route: 'Bengaluru (BLR) → New Delhi (DEL)', time: '03:45 PM', status: 'ON TIME', gate: 'Gate 7C', statusColor: 'text-emerald-400 bg-emerald-500/20' },
  { flight: 'SK-412', route: 'Mumbai (BOM) → Goa (GOI)', time: '06:00 PM', status: 'GATE OPEN', gate: 'Gate 1D', statusColor: 'text-sky-400 bg-sky-500/20' },
  { flight: 'SK-501', route: 'Hyderabad (HYD) → Kochi (COK)', time: '12:00 PM', status: 'ON TIME', gate: 'Gate 3A', statusColor: 'text-emerald-400 bg-emerald-500/20' }
];

const CORRIDOR_EXPLORER_DATA = {
  MAA: {
    name: 'Chennai International (MAA)',
    destinations: [
      { to: 'Bengaluru (BLR)', code: 'BLR', time: '1h 05m', dist: '290 km', fare: 3500, aircraft: 'Airbus A320neo (3-3)', departures: '6 departures daily' },
      { to: 'New Delhi (DEL)', code: 'DEL', time: '2h 45m', dist: '1,760 km', fare: 5500, aircraft: 'Airbus A321XLR (3-3)', departures: '5 departures daily' },
      { to: 'Mumbai (BOM)', code: 'BOM', time: '1h 55m', dist: '1,030 km', fare: 4200, aircraft: 'Boeing 787 (3-3)', departures: '4 departures daily' }
    ]
  },
  BLR: {
    name: 'Bengaluru Kempegowda (BLR)',
    destinations: [
      { to: 'Chennai (MAA)', code: 'MAA', time: '1h 05m', dist: '290 km', fare: 3500, aircraft: 'Airbus A320neo (3-3)', departures: '6 departures daily' },
      { to: 'New Delhi (DEL)', code: 'DEL', time: '2h 45m', dist: '1,740 km', fare: 4800, aircraft: 'Airbus A321XLR (3-3)', departures: '8 departures daily' },
      { to: 'Goa (GOI)', code: 'GOI', time: '1h 10m', dist: '480 km', fare: 2800, aircraft: 'Embraer E190 (2-2)', departures: '3 departures daily' }
    ]
  },
  DEL: {
    name: 'Delhi Indira Gandhi (DEL)',
    destinations: [
      { to: 'Mumbai (BOM)', code: 'BOM', time: '2h 10m', dist: '1,150 km', fare: 5800, aircraft: 'Boeing 787 Dreamliner', departures: '12 departures daily' },
      { to: 'Bengaluru (BLR)', code: 'BLR', time: '2h 45m', dist: '1,740 km', fare: 4800, aircraft: 'Airbus A321XLR (3-3)', departures: '8 departures daily' },
      { to: 'Chennai (MAA)', code: 'MAA', time: '2h 45m', dist: '1,760 km', fare: 5500, aircraft: 'Airbus A320neo (3-3)', departures: '5 departures daily' }
    ]
  },
  BOM: {
    name: 'Mumbai Chhatrapati Shivaji (BOM)',
    destinations: [
      { to: 'New Delhi (DEL)', code: 'DEL', time: '2h 10m', dist: '1,150 km', fare: 5800, aircraft: 'Boeing 787 Dreamliner', departures: '12 departures daily' },
      { to: 'Goa (GOI)', code: 'GOI', time: '1h 15m', dist: '440 km', fare: 2999, aircraft: 'ATR 72-600 / E190', departures: '7 departures daily' },
      { to: 'Chennai (MAA)', code: 'MAA', time: '1h 55m', dist: '1,030 km', fare: 4200, aircraft: 'Airbus A320neo (3-3)', departures: '4 departures daily' }
    ]
  }
};

const RADAR_CORRIDORS = [
  { origin: 'MAA', dest: 'BLR', originCity: 'Chennai', destCity: 'Bengaluru', alt: '28,000 FT', speed: '790 KM/H', time: '1h 05m', fare: 3500 },
  { origin: 'DEL', dest: 'BOM', originCity: 'New Delhi', destCity: 'Mumbai', alt: '34,000 FT', speed: '840 KM/H', time: '2h 10m', fare: 5800 },
  { origin: 'BLR', dest: 'DEL', originCity: 'Bengaluru', destCity: 'New Delhi', alt: '36,000 FT', speed: '860 KM/H', time: '2h 45m', fare: 4800 },
  { origin: 'BOM', dest: 'GOI', originCity: 'Mumbai', destCity: 'Goa', alt: '24,000 FT', speed: '720 KM/H', time: '1h 15m', fare: 2999 }
];

const POPULAR_ROUTES = [
  {
    origin: 'MAA',
    dest: 'BLR',
    originCity: 'Chennai',
    destCity: 'Bengaluru',
    price: 3500,
    duration: '1h 05m',
    image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=600&q=80',
    frequency: '6 Daily Flights'
  },
  {
    origin: 'DEL',
    dest: 'BOM',
    originCity: 'New Delhi',
    destCity: 'Mumbai',
    price: 5800,
    duration: '2h 10m',
    image: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=600&q=80',
    frequency: '12 Daily Flights'
  },
  {
    origin: 'BLR',
    dest: 'DEL',
    originCity: 'Bengaluru',
    destCity: 'New Delhi',
    price: 4800,
    duration: '2h 45m',
    image: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=600&q=80',
    frequency: '8 Daily Flights'
  },
  {
    origin: 'MAA',
    dest: 'DEL',
    originCity: 'Chennai',
    destCity: 'New Delhi',
    price: 5500,
    duration: '2h 45m',
    image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=600&q=80',
    frequency: '5 Daily Flights'
  },
  {
    origin: 'BOM',
    dest: 'GOI',
    originCity: 'Mumbai',
    destCity: 'Goa',
    price: 2999,
    duration: '1h 15m',
    image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=600&q=80',
    frequency: '7 Daily Flights'
  },
  {
    origin: 'HYD',
    dest: 'COK',
    originCity: 'Hyderabad',
    destCity: 'Kochi',
    price: 3200,
    duration: '1h 40m',
    image: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=600&q=80',
    frequency: '4 Daily Flights'
  }
];

const FEATURES = [
  {
    icon: Zap,
    title: 'Instant Smart Seat Allocation',
    desc: 'Reserve flights in under 60 seconds with our smart algorithm keeping families together (Window → Aisle → Middle).'
  },
  {
    icon: ShieldCheck,
    title: 'DGCA & IATA Safety Certified',
    desc: 'All scheduled departures adhere strictly to aviation safety standards with verified A320 & Embraer modern aircraft fleet.'
  },
  {
    icon: Tag,
    title: 'Direct INR Pricing (No Hidden Fees)',
    desc: 'All fares listed in Indian Rupees (₹) with zero payment surcharge, transparent cancellation terms, and verified seat maps.'
  }
];

const Home = () => {
  const navigate = useNavigate();
  const [selectedHub, setSelectedHub] = useState('MAA');
  const [selectedCabin, setSelectedCabin] = useState('3-3');
  const [activeRadarIndex, setActiveRadarIndex] = useState(0);

  // Dynamic Fare & Group Savings Simulator State
  const [simPassengers, setSimPassengers] = useState(2);
  const [simBaseFare, setSimBaseFare] = useState(3500);

  // Auto-cycle radar telemetry every 4 seconds for interactive liveliness
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveRadarIndex((prev) => (prev + 1) % RADAR_CORRIDORS.length);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  const [recentSearches, setRecentSearches] = useState([]);

  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const res = await api.get('/flights/recent-searches');
        const list = res.data?.searches || res.data?.data?.searches || [];
        setRecentSearches(Array.isArray(list) ? list : []);
      } catch (err) {
        // silent
      }
    };
    fetchRecent();
  }, []);

  const activeRadar = RADAR_CORRIDORS[activeRadarIndex];

  // Calculated estimates for group calculator
  const grossFare = simPassengers * simBaseFare;
  const discountEstimate = grossFare >= 3000 ? 500 : 0;
  const netEstimatedFare = grossFare - discountEstimate;

  return (
    <div className="min-h-screen bg-slate-50 text-navy">
      {/* 1. TOP LIVE AIRPORT FLIGHT STATUS TICKER WITH INFINITE MARQUEE */}
      <div className="bg-[#051120] text-slate-200 py-2.5 px-4 border-b border-navy-800 text-xs overflow-hidden">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 shrink-0 z-10 bg-[#051120] pr-3 shadow-md">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-mono font-bold text-sky-400 uppercase tracking-widest text-[10px]">
              Live Airport Radar
            </span>
          </div>

          <div className="overflow-hidden flex-1 relative">
            <div className="animate-marquee font-mono text-[11px] gap-8">
              {[...LIVE_DEPARTURES_BOARD, ...LIVE_DEPARTURES_BOARD].map((item, idx) => (
                <div key={idx} className="flex items-center gap-2.5 shrink-0">
                  <span className="font-bold text-white">{item.flight}</span>
                  <span className="text-slate-400">{item.route}</span>
                  <span className="text-slate-300 font-semibold">{item.time}</span>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${item.statusColor}`}>
                    {item.status}
                  </span>
                  <span className="text-slate-500 text-[10px]">{item.gate}</span>
                  <span className="text-slate-700">|</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 2. HERO SECTION WITH LUXURY COLOR PALETTE & LIVE TELEMETRY RADAR */}
      <section className="relative bg-gradient-to-br from-[#030914] via-[#071527] to-[#0c2e56] text-white pt-16 pb-36 sm:pb-44 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Live Flying Airplane & Moving Clouds Layer */}
        <HeroFlightAnimation />

        {/* Ambient atmospheric glows */}
        <div className="absolute top-0 right-0 -mr-24 -mt-24 w-[500px] h-[500px] bg-skyblue/25 rounded-full blur-3xl pointer-events-none animate-pulseGlow"></div>
        <div className="absolute bottom-0 left-0 -ml-24 -mb-24 w-[450px] h-[450px] bg-sky-500/15 rounded-full blur-3xl pointer-events-none"></div>

        {/* Dynamic Flight Tracer SVG Canvas */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-full max-w-6xl h-44 opacity-25 pointer-events-none overflow-hidden">
          <svg className="w-full h-full" viewBox="0 0 1200 200" fill="none">
            <path
              d="M 50 160 Q 300 20, 600 110 T 1150 30"
              stroke="#38bdf8"
              strokeWidth="2.5"
              strokeDasharray="10 10"
              className="animate-flightTracer"
            />
          </svg>
        </div>

        <div className="max-w-7xl mx-auto relative z-10 text-center">
          {/* Animated Header Badge */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-skyblue-light text-xs font-bold uppercase tracking-wider mb-6 shadow-xl shadow-black/20 animate-fadeInDown hover:scale-105 transition-transform duration-300">
            <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-skyblue to-sky-300 flex items-center justify-center text-navy shadow-sm animate-floatSlow">
              <Plane className="w-3 h-3 rotate-45 transform" />
            </div>
            <span>Skynexa Flight Booking Engine • India Corridors in ₹ INR</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight max-w-4xl mx-auto leading-tight animate-fadeInUp">
            Smarter Flights.{' '}
            <span className="bg-gradient-to-r from-sky-400 via-sky-300 to-white bg-clip-text text-transparent drop-shadow-md">
              Simpler Journeys.
            </span>
          </h1>

          <p className="mt-5 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed animate-fadeInUp delay-100">
            Experience premium non-stop domestic travel across India. Automatic adjacent family seating, interactive aircraft seat selection, and zero-surcharge fares in Indian Rupees (₹).
          </p>

          {/* INTERACTIVE RADAR TELEMETRY HUD STRIP */}
          <div className="mt-8 max-w-3xl mx-auto bg-black/40 backdrop-blur-xl border border-white/15 hover:border-sky-400/40 rounded-2xl p-4 shadow-2xl transition-all duration-300 animate-fadeInUp delay-200">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-9 h-9 rounded-xl bg-skyblue/20 border border-skyblue/40 flex items-center justify-center text-sky-300 shadow-inner">
                    <Navigation className="w-4 h-4 animate-radarSpin text-sky-300" />
                  </div>
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping"></span>
                </div>
                <div className="text-left font-mono">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-bold">{activeRadar.origin} ✈ {activeRadar.dest}</span>
                    <span className="text-emerald-400 text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/30 animate-pulseSubtle">
                      AIRBORNE
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {activeRadar.originCity} to {activeRadar.destCity} • {activeRadar.time}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 font-mono text-[11px] text-slate-300">
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase">Altitude</span>
                  <span className="font-bold text-sky-300">{activeRadar.alt}</span>
                </div>
                <div className="h-6 w-px bg-white/10"></div>
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase">Speed</span>
                  <span className="font-bold text-white">{activeRadar.speed}</span>
                </div>
                <div className="h-6 w-px bg-white/10"></div>
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase">From</span>
                  <span className="font-bold text-emerald-400">₹{activeRadar.fare}</span>
                </div>
              </div>

              <Link
                to={`/search?origin=${activeRadar.origin}&destination=${activeRadar.dest}`}
                className="px-3.5 py-1.5 rounded-xl bg-skyblue hover:bg-white hover:text-navy text-white font-bold text-xs transition-all duration-200 flex items-center gap-1 shadow-md hover:shadow-lg active:scale-95 group"
              >
                <span>Book Flight</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            {/* Radar Quick Corridor Selector */}
            <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-center gap-2 overflow-x-auto no-scrollbar">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                Switch Live Radar:
              </span>
              {RADAR_CORRIDORS.map((corridor, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveRadarIndex(idx)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-mono transition-all duration-200 cursor-pointer active:scale-95 ${
                    activeRadarIndex === idx
                      ? 'bg-skyblue text-white font-bold shadow-xs scale-105'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {corridor.origin} → {corridor.dest}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3. SEARCH WIDGET (FLOATING GLASS CONTAINER) */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 -mt-24 sm:-mt-28 relative z-20 animate-fadeInUp delay-100">
        <div className="bg-white rounded-3xl shadow-2xl hover:shadow-sky-950/10 border border-slate-200/90 p-6 sm:p-8 backdrop-blur-lg transition-shadow duration-300">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-widest text-navy">
                Search Indian Commercial Flights
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs text-slate-500 font-medium">Automatic Family Group Seating</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 hover:scale-105 transition-transform duration-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              Live Scheduled Flights
            </div>
          </div>
          <SearchForm />

          {/* Recently Searched Flights (Stored in MongoDB Atlas) */}
          {recentSearches.length > 0 && (
            <div className="mt-5 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-black text-navy flex items-center gap-1.5 uppercase tracking-wider">
                  <Clock className="w-3.5 h-3.5 text-skyblue" /> Recently Searched Flights
                </span>
                <span className="text-[11px] text-slate-400">Stored in MongoDB Atlas</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {recentSearches.slice(0, 3).map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="p-3 bg-slate-50 hover:bg-white rounded-2xl border border-slate-100 hover:border-sky-300 card-hover transition-all duration-300 flex items-center justify-between gap-3 group"
                  >
                    <div>
                      <div className="font-mono font-black text-navy text-xs flex items-center gap-1 group-hover:text-skyblue transition-colors">
                        {item.origin} <span className="text-skyblue text-[10px]">➔</span> {item.destination}
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {item.date || 'Flexible Date'} • {(item.adults || 1) + (item.children || 0)} Pax
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        const params = new URLSearchParams({
                          origin: item.origin,
                          destination: item.destination,
                          date: item.date || new Date().toISOString().split('T')[0],
                          adults: (item.adults || 1).toString(),
                          children: (item.children || 0).toString()
                        });
                        navigate(`/search?${params.toString()}`);
                      }}
                      className="px-2.5 py-1.5 bg-navy hover:bg-skyblue text-white text-[11px] font-bold rounded-xl transition-all duration-200 flex items-center gap-1 cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
                    >
                      <Search className="w-3 h-3" />
                      <span>Search Again</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 4. INTERACTIVE GROUP FARE & SEAT SAVINGS CALCULATOR */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-16">
        <div className="bg-gradient-to-r from-sky-50 via-white to-sky-50 rounded-3xl p-6 sm:p-8 border border-sky-100 shadow-lg card-hover hover:border-sky-300 transition-all duration-300">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-left">
              <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase text-skyblue tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-spin-slow" />
                Live Group Fare &amp; Seating Estimator
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-navy">
                Calculate Family Savings &amp; Guaranteed Adjacent Seats
              </h3>
              <p className="text-xs text-slate-500 max-w-lg">
                Drag the passenger slider to see how our allocation engine seats families together side-by-side, plus auto-applied coupon discounts!
              </p>
            </div>

            {/* Interactive Passenger Slider & Fare Metrics */}
            <div className="w-full md:w-auto bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-6 card-hover hover:border-sky-200 transition-all duration-300">
              <div className="space-y-2 w-full sm:w-48 text-left">
                <div className="flex justify-between text-xs font-bold text-navy">
                  <span>Passengers:</span>
                  <span className="text-skyblue">{simPassengers} Travelers</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="6"
                  value={simPassengers}
                  onChange={(e) => setSimPassengers(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-skyblue transition-all"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>1 Solo</span>
                  <span>3 Family</span>
                  <span>6 Group</span>
                </div>
              </div>

              <div className="h-10 w-px bg-slate-100 hidden sm:block"></div>

              <div className="text-left space-y-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Estimated Total</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-emerald-700 font-mono">
                    ₹{netEstimatedFare.toLocaleString('en-IN')}
                  </span>
                  {discountEstimate > 0 && (
                    <span className="text-xs text-slate-400 line-through font-mono">
                      ₹{grossFare.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                  <Check className="w-3 h-3" />
                  <span>
                    {simPassengers > 1
                      ? `${simPassengers} Adjacent Seats Reserved Together`
                      : 'Priority Window/Aisle Seat'}
                  </span>
                </div>
              </div>

              <Link
                to={`/search?origin=MAA&destination=BLR&adults=${simPassengers}`}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-navy hover:bg-skyblue text-white text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1 shadow-md hover:shadow-lg hover:scale-105 active:scale-95 shrink-0 cursor-pointer group"
              >
                <span>Find Flights</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 5. INTERACTIVE INDIAN CORRIDOR EXPLORER WIDGET */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16">
        <div className="bg-gradient-to-r from-navy via-[#0c2a50] to-navy rounded-3xl p-6 sm:p-10 text-white shadow-xl space-y-8 border border-navy-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
            <div>
              <div className="inline-flex items-center gap-2 text-sky-400 text-xs font-bold uppercase tracking-wider mb-1">
                <Compass className="w-4 h-4" /> Interactive Route Planner
              </div>
              <h2 className="text-2xl sm:text-3xl font-black">Explore Non-Stop Flights by Departure City</h2>
            </div>
            <p className="text-xs text-slate-300 font-medium max-w-sm">
              Click any airport hub below to inspect flight durations, aircraft layouts, and direct ₹ fares.
            </p>
          </div>

          {/* City Selection Tabs */}
          <div className="flex flex-wrap gap-2.5">
            {Object.keys(CORRIDOR_EXPLORER_DATA).map((code) => {
              const active = selectedHub === code;
              return (
                <button
                  key={code}
                  onClick={() => setSelectedHub(code)}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200 flex items-center gap-2 cursor-pointer hover:scale-105 active:scale-95 ${
                    active
                      ? 'bg-skyblue text-white shadow-lg shadow-skyblue/30 ring-2 ring-white/30 scale-105'
                      : 'bg-white/10 text-slate-300 hover:bg-white/15 hover:text-white'
                  }`}
                >
                  <Plane className="w-3.5 h-3.5" />
                  <span>{CORRIDOR_EXPLORER_DATA[code].name}</span>
                </button>
              );
            })}
          </div>

          {/* Interactive Destinations Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {CORRIDOR_EXPLORER_DATA[selectedHub].destinations.map((dest, idx) => (
              <div
                key={idx}
                className="bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10 hover:border-skyblue/60 hover:bg-white/10 card-hover transition-all duration-300 flex flex-col justify-between group shadow-lg"
              >
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <span className="font-mono text-xs font-bold text-sky-300 uppercase">
                      {selectedHub} ✈ {dest.code}
                    </span>
                    <span className="text-[10px] text-slate-300 bg-white/10 px-2 py-0.5 rounded-full">
                      {dest.departures}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-white mt-2 group-hover:text-skyblue transition-colors">
                    {dest.to}
                  </h3>
                  <div className="mt-3 space-y-1.5 text-xs text-slate-300">
                    <p className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-sky-400 group-hover:rotate-12 transition-transform" /> {dest.time} flight time ({dest.dist})
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Armchair className="w-3.5 h-3.5 text-sky-400" /> {dest.aircraft}
                    </p>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Starting Fare</span>
                    <span className="text-xl font-black text-emerald-400 font-mono">
                      ₹{dest.fare.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <Link
                    to={`/search?origin=${selectedHub}&destination=${dest.code}`}
                    className="px-3.5 py-2 rounded-xl bg-skyblue hover:bg-white hover:text-navy text-white text-xs font-bold transition-all duration-200 flex items-center gap-1 shadow-md hover:scale-105 active:scale-95 group"
                  >
                    <span>Search</span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. POPULAR INDIAN ROUTES SHOWCASE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10">
          <div>
            <div className="flex items-center gap-2 text-skyblue text-xs font-bold uppercase tracking-wider mb-2">
              <Globe className="w-4 h-4 animate-spin-slow" /> Indian Domestic Corridors
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-navy">Popular Indian Flights</h2>
          </div>
          <p className="text-sm text-slate-500 mt-2 sm:mt-0 font-medium">
            Daily scheduled departures with guaranteed lowest base fares in ₹ INR
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {POPULAR_ROUTES.map((route, idx) => (
            <Link
              key={idx}
              to={`/search?origin=${route.origin}&destination=${route.dest}`}
              className="group bg-white rounded-3xl overflow-hidden border border-slate-200/80 hover:border-skyblue card-hover shadow-xs transition-all duration-300 flex flex-col justify-between"
            >
              <div className="h-44 overflow-hidden relative">
                <img
                  src={route.image}
                  alt={route.destCity}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                />
                <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black text-navy shadow-sm group-hover:scale-105 transition-transform">
                  {route.frequency}
                </div>
                <div className="absolute bottom-3 left-3 bg-navy/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-white font-mono text-xs font-bold">
                  {route.origin} ✈ {route.dest}
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Non-Stop</span>
                    <h3 className="text-lg font-black text-navy group-hover:text-skyblue transition-colors">
                      {route.originCity} to {route.destCity}
                    </h3>
                  </div>
                  <div className="w-10 h-10 rounded-2xl bg-sky-50 text-skyblue flex items-center justify-center group-hover:bg-navy group-hover:text-white transition-all duration-300 shadow-2xs group-hover:scale-110">
                    <Plane className="w-5 h-5 group-hover:rotate-45 transition-transform duration-300" />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <Clock className="w-3.5 h-3.5 text-skyblue" /> {route.duration}
                  </span>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">From</span>
                    <span className="text-xl font-black text-emerald-700 font-mono group-hover:scale-105 inline-block transition-transform">
                      ₹{route.price.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 7. INTERACTIVE CABIN EXPERIENCE & LAYOUT VIEWER */}
      <section className="bg-slate-100/70 py-20 border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold text-skyblue uppercase tracking-wider">Fleet In-Flight Comfort</span>
            <h3 className="text-3xl sm:text-4xl font-black text-navy">Engineered for Passenger Comfort</h3>
            <p className="text-slate-500 text-sm">
              Explore our modern aircraft cabin configurations with automatic family &amp; adjacent group seat allocation.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Options */}
            <div className="lg:col-span-5 space-y-6">
              <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl">
                <button
                  onClick={() => setSelectedCabin('3-3')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer active:scale-95 ${
                    selectedCabin === '3-3' ? 'bg-navy text-white shadow-md scale-[1.02]' : 'text-slate-600 hover:text-navy'
                  }`}
                >
                  Airbus A320 (3-3 Layout)
                </button>
                <button
                  onClick={() => setSelectedCabin('2-2')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer active:scale-95 ${
                    selectedCabin === '2-2' ? 'bg-navy text-white shadow-md scale-[1.02]' : 'text-slate-600 hover:text-navy'
                  }`}
                >
                  Embraer E190 (2-2 Layout)
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3.5 p-2 rounded-2xl hover:bg-slate-50 transition-colors">
                  <div className="p-2.5 rounded-xl bg-sky-50 text-skyblue shrink-0 mt-0.5 shadow-2xs">
                    <Armchair className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-navy text-sm">Ergonomic Leather Seating</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {selectedCabin === '3-3'
                        ? '31-inch seat pitch with 6-way adjustable headrest and extra legroom row options.'
                        : 'No middle seats! Every passenger enjoys guaranteed Window or Aisle seating.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-2 rounded-2xl hover:bg-slate-50 transition-colors">
                  <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 shrink-0 mt-0.5 shadow-2xs">
                    <Wifi className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-navy text-sm">In-Flight Wi-Fi &amp; USB Power</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Fast in-seat high-speed USB-C charging ports and complimentary entertainment portal.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-2 rounded-2xl hover:bg-slate-50 transition-colors">
                  <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 shrink-0 mt-0.5 shadow-2xs">
                    <Coffee className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-navy text-sm">Complimentary Refreshments</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Freshly brewed Indian filter coffee, tea, and packaged snacks on all corridors.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Cabin Layout Graphic Mockup */}
            <div className="lg:col-span-7 bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <span className="text-xs font-bold text-navy font-mono">
                  {selectedCabin === '3-3' ? 'A320 Configuration (Rows 1-30)' : 'E190 Configuration (Rows 1-20)'}
                </span>
                <span className="text-[11px] font-bold text-skyblue">
                  {selectedCabin === '3-3' ? '180 Total Seats' : '80 Total Seats'}
                </span>
              </div>

              {/* Sample Seat Rows Mini Visualization */}
              <div className="space-y-2 py-2">
                {[1, 2, 3, 4].map((row) => (
                  <div key={row} className="flex items-center justify-center gap-2 text-xs font-mono">
                    <span className="w-6 text-slate-400 font-bold text-[11px]">{row}</span>
                    {selectedCabin === '3-3' ? (
                      <>
                        <div className="flex gap-1">
                          <span className="w-7 h-7 rounded bg-emerald-100 border border-emerald-300 text-emerald-800 flex items-center justify-center font-bold hover:scale-125 transition-transform duration-150 cursor-pointer shadow-2xs">A</span>
                          <span className="w-7 h-7 rounded bg-slate-200 border border-slate-300 text-slate-600 flex items-center justify-center font-bold hover:scale-110 transition-transform duration-150 cursor-not-allowed">B</span>
                          <span className="w-7 h-7 rounded bg-emerald-100 border border-emerald-300 text-emerald-800 flex items-center justify-center font-bold hover:scale-125 transition-transform duration-150 cursor-pointer shadow-2xs">C</span>
                        </div>
                        <div className="w-5 text-center text-slate-300 text-[10px]">||</div>
                        <div className="flex gap-1">
                          <span className="w-7 h-7 rounded bg-emerald-100 border border-emerald-300 text-emerald-800 flex items-center justify-center font-bold hover:scale-125 transition-transform duration-150 cursor-pointer shadow-2xs">D</span>
                          <span className="w-7 h-7 rounded bg-slate-200 border border-slate-300 text-slate-600 flex items-center justify-center font-bold hover:scale-110 transition-transform duration-150 cursor-not-allowed">E</span>
                          <span className="w-7 h-7 rounded bg-emerald-100 border border-emerald-300 text-emerald-800 flex items-center justify-center font-bold hover:scale-125 transition-transform duration-150 cursor-pointer shadow-2xs">F</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex gap-1">
                          <span className="w-8 h-7 rounded bg-emerald-100 border border-emerald-300 text-emerald-800 flex items-center justify-center font-bold hover:scale-125 transition-transform duration-150 cursor-pointer shadow-2xs">A</span>
                          <span className="w-8 h-7 rounded bg-emerald-100 border border-emerald-300 text-emerald-800 flex items-center justify-center font-bold hover:scale-125 transition-transform duration-150 cursor-pointer shadow-2xs">B</span>
                        </div>
                        <div className="w-8 text-center text-slate-300 text-[10px]">||</div>
                        <div className="flex gap-1">
                          <span className="w-8 h-7 rounded bg-emerald-100 border border-emerald-300 text-emerald-800 flex items-center justify-center font-bold hover:scale-125 transition-transform duration-150 cursor-pointer shadow-2xs">C</span>
                          <span className="w-8 h-7 rounded bg-emerald-100 border border-emerald-300 text-emerald-800 flex items-center justify-center font-bold hover:scale-125 transition-transform duration-150 cursor-pointer shadow-2xs">D</span>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-center gap-4 text-[10px] text-slate-500 pt-2 border-t border-slate-200">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300"></span> Available Seat
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-slate-200 border border-slate-300"></span> Occupied Seat
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. WHY FLY SKYNEXA (FEATURES) */}
      <section className="bg-white py-20 border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-2">
            <h2 className="text-xs font-bold text-skyblue uppercase tracking-wider">The Skynexa Difference</h2>
            <h3 className="text-3xl sm:text-4xl font-black text-navy">Air Travel Reimagined for India</h3>
            <p className="text-slate-500 text-sm">
              We leverage cloud-native schedule synchronisation and automatic seat adjacency to give you seamless booking.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {FEATURES.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div
                  key={idx}
                  className="bg-slate-50/70 rounded-3xl p-8 border border-slate-200/70 hover:border-skyblue/50 hover:bg-white card-hover transition-all duration-300 group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-navy text-white flex items-center justify-center mb-6 shadow-lg shadow-navy/10 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                    <Icon className="w-7 h-7 text-skyblue group-hover:text-white transition-colors" />
                  </div>
                  <h4 className="text-xl font-bold text-navy mb-3 group-hover:text-skyblue transition-colors">{feat.title}</h4>
                  <p className="text-slate-600 text-sm leading-relaxed">{feat.desc}</p>
                </div>
              );
            })}
          </div>

          {/* Quick Metrics Bar */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 bg-gradient-to-r from-navy via-navy to-[#0b274c] rounded-3xl p-8 text-white text-center shadow-2xl">
            <div className="card-hover p-2 rounded-2xl transition-all duration-300">
              <p className="text-3xl sm:text-4xl font-black text-skyblue">99.8%</p>
              <p className="text-xs text-slate-300 mt-1 uppercase font-semibold">On-Time Departures</p>
            </div>
            <div className="card-hover p-2 rounded-2xl transition-all duration-300">
              <p className="text-3xl sm:text-4xl font-black text-white">14+</p>
              <p className="text-xs text-slate-300 mt-1 uppercase font-semibold">Active Corridors</p>
            </div>
            <div className="card-hover p-2 rounded-2xl transition-all duration-300">
              <p className="text-3xl sm:text-4xl font-black text-sky-400">₹3,500</p>
              <p className="text-xs text-slate-300 mt-1 uppercase font-semibold">Starting Fare</p>
            </div>
            <div className="card-hover p-2 rounded-2xl transition-all duration-300">
              <p className="text-3xl sm:text-4xl font-black text-white">4.9 / 5</p>
              <p className="text-xs text-slate-300 mt-1 uppercase font-semibold">Customer Rating</p>
            </div>
          </div>
        </div>
      </section>

      {/* 9. PROMOTIONAL DISCOUNT BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-gradient-to-r from-navy via-navy-800 to-navy rounded-3xl p-8 sm:p-12 text-white flex flex-col lg:flex-row items-center justify-between gap-8 relative overflow-hidden shadow-2xl border border-navy-800 card-hover">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-skyblue/15 rounded-full blur-3xl pointer-events-none animate-pulseGlow"></div>
          <div className="relative z-10 space-y-3 max-w-xl">
            <span className="px-3.5 py-1 bg-skyblue/20 text-skyblue rounded-full text-xs font-bold uppercase border border-skyblue/30 inline-block animate-pulseSubtle">
              Exclusive Domestic Offers
            </span>
            <h3 className="text-2xl sm:text-4xl font-black">
              Save Flat ₹500 on Indian Flights
            </h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              Use promo code <span className="font-mono font-bold text-white bg-white/20 px-2.5 py-0.5 rounded border border-white/20 hover:scale-105 inline-block transition-transform">SKY500</span> at checkout for an instant flat discount on your booking.
            </p>
          </div>
          <div className="relative z-10 shrink-0">
            <Link
              to="/offers"
              className="inline-flex items-center gap-2 px-8 py-4 bg-skyblue hover:bg-white hover:text-navy text-white font-bold rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 text-sm cursor-pointer group"
            >
              <span>Explore All Offers</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform duration-200" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
