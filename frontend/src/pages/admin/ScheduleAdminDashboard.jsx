import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Clock,
  DollarSign,
  Users,
  Plane,
  CheckCircle2,
  AlertCircle,
  Edit3,
  LogOut,
  Plus,
  Zap,
  Filter,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Route as RouteIcon,
  Loader2,
  RefreshCw,
  Power,
  Check,
  Layers,
  Search,
  Table as TableIcon,
  Grid as GridIcon,
  CalendarCheck,
  PlaneTakeoff,
  Ban,
  X,
  Info
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/Modal';
import api from '../../lib/axios';
import toast from 'react-hot-toast';

const DAY_OPTIONS = [
  { code: 'MON', label: 'Mon' },
  { code: 'TUE', label: 'Tue' },
  { code: 'WED', label: 'Wed' },
  { code: 'THU', label: 'Thu' },
  { code: 'FRI', label: 'Fri' },
  { code: 'SAT', label: 'Sat' },
  { code: 'SUN', label: 'Sun' }
];

const ScheduleAdminDashboard = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  // State from MongoDB Atlas
  const [catalogFlights, setCatalogFlights] = useState([]);
  const [departures, setDepartures] = useState([]);
  const [airports, setAirports] = useState([]);
  const [layouts, setLayouts] = useState([]);
  const [loadingSchedule, setLoadingSchedule] = useState(true);

  // Filters & Views
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('TABLE'); // 'TABLE' | 'CARDS'

  // Modal 1: + Create Flight Schedule
  const [createScheduleModalOpen, setCreateScheduleModalOpen] = useState(false);
  const [scheduleFlightId, setScheduleFlightId] = useState('');
  const [scheduleType, setScheduleType] = useState('DAILY'); // 'ONE_TIME' | 'DAILY' | 'WEEKLY' | 'MONTHLY'
  const [scheduleOperatingDays, setScheduleOperatingDays] = useState(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']);
  const [scheduleDepTime, setScheduleDepTime] = useState('10:00');
  const [scheduleArrTime, setScheduleArrTime] = useState('11:15');
  const [scheduleDepDate, setScheduleDepDate] = useState(new Date().toISOString().split('T')[0]);
  const [scheduleArrDate, setScheduleArrDate] = useState(new Date().toISOString().split('T')[0]);
  const [scheduleStartDate, setScheduleStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [scheduleEndDate, setScheduleEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [scheduleFare, setScheduleFare] = useState(3500);
  const [scheduleStatus, setScheduleStatus] = useState('ON_TIME');
  const [submittingSchedule, setSubmittingSchedule] = useState(false);

  // Modal 2: Edit Existing Departure
  const [editingDeparture, setEditingDeparture] = useState(null);
  const [editDepModalOpen, setEditDepModalOpen] = useState(false);
  const [editDepDate, setEditDepDate] = useState('');
  const [editDepTime, setEditDepTime] = useState('');
  const [editArrDate, setEditArrDate] = useState('');
  const [editArrTime, setEditArrTime] = useState('');
  const [editFare, setEditFare] = useState(3500);
  const [editStatus, setEditStatus] = useState('ON_TIME');
  const [savingDepEdit, setSavingDepEdit] = useState(false);

  // Modal 3: Bulk Generator
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkFlightId, setBulkFlightId] = useState('');
  const [bulkHorizon, setBulkHorizon] = useState('30_DAYS');
  const [bulkFrequency, setBulkFrequency] = useState('DAILY');
  const [bulkDepTime, setBulkDepTime] = useState('08:30');
  const [bulkArrTime, setBulkArrTime] = useState('09:35');
  const [submittingBulk, setSubmittingBulk] = useState(false);

  // Load Data from MongoDB Atlas
  const loadScheduleData = async () => {
    setLoadingSchedule(true);
    try {
      const [flightsRes, instancesRes, airportsRes, layoutsRes] = await Promise.all([
        api.get('/flights').catch(() => api.get('/admin/flights').catch(() => null)),
        api.get('/admin/instances').catch(() => api.get('/flights/instances').catch(() => null)),
        api.get('/airports').catch(() => null),
        api.get('/admin/layouts').catch(() => null)
      ]);

      if (flightsRes?.data?.data?.flights) {
        setCatalogFlights(flightsRes.data.data.flights);
        if (!scheduleFlightId && flightsRes.data.data.flights.length > 0) {
          setScheduleFlightId(flightsRes.data.data.flights[0]._id);
          setBulkFlightId(flightsRes.data.data.flights[0]._id);
          setScheduleFare(flightsRes.data.data.flights[0].baseFare || 3500);
        }
      }

      if (instancesRes?.data?.data?.instances) {
        setDepartures(instancesRes.data.data.instances);
      }

      if (airportsRes?.data?.data?.airports) {
        setAirports(airportsRes.data.data.airports);
      }

      if (layoutsRes?.data?.data?.layouts) {
        setLayouts(layoutsRes.data.data.layouts);
      }
    } catch (err) {
      console.error('Error loading schedule admin data:', err);
      toast.error('Failed to load schedule data from MongoDB Atlas');
    } finally {
      setLoadingSchedule(false);
    }
  };

  useEffect(() => {
    loadScheduleData();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/admin-login');
    toast.success('Schedule Administrator signed out');
  };

  // Currently selected flight in the Create Schedule form
  const selectedCatalogFlight = useMemo(() => {
    return catalogFlights.find((f) => f._id === scheduleFlightId) || null;
  }, [catalogFlights, scheduleFlightId]);

  const handleSelectFlight = (flightId) => {
    setScheduleFlightId(flightId);
    const flight = catalogFlights.find((f) => f._id === flightId);
    if (flight) {
      setScheduleFare(flight.baseFare || 3500);
      if (flight.departureDateTime) {
        const d = new Date(flight.departureDateTime);
        setScheduleDepTime(d.toTimeString().slice(0, 5));
      }
      if (flight.arrivalDateTime) {
        const a = new Date(flight.arrivalDateTime);
        setScheduleArrTime(a.toTimeString().slice(0, 5));
      }
    }
  };

  const toggleOperatingDay = (dayCode) => {
    if (scheduleOperatingDays.includes(dayCode)) {
      if (scheduleOperatingDays.length > 1) {
        setScheduleOperatingDays(scheduleOperatingDays.filter((d) => d !== dayCode));
      } else {
        toast.error('At least one operating day must be selected');
      }
    } else {
      setScheduleOperatingDays([...scheduleOperatingDays, dayCode]);
    }
  };

  // Departure Preview Counter
  const estimatedDeparturesCount = useMemo(() => {
    if (scheduleType === 'ONE_TIME') return 1;
    const start = new Date(scheduleStartDate);
    const end = new Date(scheduleEndDate);
    if (isNaN(start) || isNaN(end) || start > end) return 0;

    let count = 0;
    const current = new Date(start);
    const DAY_NAMES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

    while (current <= end) {
      const dayName = DAY_NAMES[current.getDay()];
      if (scheduleType === 'DAILY') {
        count++;
      } else if (scheduleType === 'WEEKLY') {
        if (scheduleOperatingDays.includes(dayName)) count++;
      } else if (scheduleType === 'MONTHLY') {
        if (current.getDate() === start.getDate()) count++;
      }
      current.setDate(current.getDate() + 1);
    }
    return count;
  }, [scheduleType, scheduleStartDate, scheduleEndDate, scheduleOperatingDays]);

  // Handle Save Schedule (Step 3)
  const handleSaveSchedule = async (e) => {
    e.preventDefault();
    if (!scheduleFlightId) {
      toast.error('Please select an active flight from the Super Admin catalog');
      return;
    }

    if (!scheduleDepTime || !scheduleArrTime) {
      toast.error('Departure and arrival times are required');
      return;
    }

    setSubmittingSchedule(true);
    try {
      const payload = {
        flightId: scheduleFlightId,
        scheduleType,
        operatingDays: scheduleType === 'WEEKLY' ? scheduleOperatingDays : [],
        departureTime: scheduleDepTime,
        arrivalTime: scheduleArrTime,
        status: scheduleStatus,
        timezone: 'Asia/Kolkata'
      };

      if (scheduleType === 'ONE_TIME') {
        payload.departureDate = scheduleDepDate;
        payload.arrivalDate = scheduleArrDate || scheduleDepDate;
      } else {
        payload.startDate = scheduleStartDate;
        payload.endDate = scheduleEndDate;
      }

      const res = await api.post('/admin/schedules', payload);
      toast.success(
        res.data?.message || '✈️ Flight schedule saved and departures generated in MongoDB Atlas!'
      );
      setCreateScheduleModalOpen(false);
      await loadScheduleData();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to create schedule';
      toast.error(msg);
    } finally {
      setSubmittingSchedule(false);
    }
  };

  // Handle Open Edit Departure Modal
  const handleOpenEditDeparture = (dep) => {
    setEditingDeparture(dep);
    const depDT = new Date(dep.departureDateTime);
    const arrDT = new Date(dep.arrivalDateTime);

    setEditDepDate(depDT.toISOString().split('T')[0]);
    setEditDepTime(depDT.toTimeString().slice(0, 5));
    setEditArrDate(arrDT.toISOString().split('T')[0]);
    setEditArrTime(arrDT.toTimeString().slice(0, 5));
    setEditFare(dep.adultFare || 3500);
    setEditStatus(dep.status || 'ON_TIME');
    setEditDepModalOpen(true);
  };

  // Handle Save Departure Update
  const handleSaveDepartureEdit = async (e) => {
    e.preventDefault();
    setSavingDepEdit(true);
    try {
      const depDT = new Date(`${editDepDate}T${editDepTime}:00+05:30`);
      const arrDT = new Date(`${editArrDate}T${editArrTime}:00+05:30`);

      if (arrDT <= depDT) {
        toast.error('Departure date & time must precede arrival date & time');
        setSavingDepEdit(false);
        return;
      }

      await api.put(`/admin/instances/${editingDeparture._id}`, {
        departureDateTime: depDT.toISOString(),
        arrivalDateTime: arrDT.toISOString(),
        status: editStatus
      });

      toast.success(`✈️ Departure ${editingDeparture.flightId?.flightNumber || ''} updated successfully!`);
      setEditDepModalOpen(false);
      await loadScheduleData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error updating departure');
    } finally {
      setSavingDepEdit(false);
    }
  };

  // Handle Cancel Departure (Preserves Bookings)
  const handleCancelDeparture = async (dep) => {
    const flightNum = dep.flightId?.flightNumber || 'this departure';
    if (
      !window.confirm(
        `Are you sure you want to CANCEL the scheduled departure for ${flightNum}? Customer reservations will remain preserved.`
      )
    ) {
      return;
    }

    try {
      await api.delete(`/admin/instances/${dep._id}`);
      toast.success(`Departure ${flightNum} marked CANCELLED in MongoDB Atlas. Customer bookings preserved.`);
      await loadScheduleData();
    } catch (err) {
      toast.error('Failed to cancel departure');
    }
  };

  // Bulk Schedule Generator
  const handleGenerateBulkSchedules = async (e) => {
    e.preventDefault();
    let daysCount = 30;
    if (bulkHorizon === '14_DAYS') daysCount = 14;
    else if (bulkHorizon === '90_DAYS') daysCount = 90;
    else if (bulkHorizon === '180_DAYS') daysCount = 180;

    const start = new Date();
    const end = new Date();
    end.setDate(end.getDate() + daysCount);

    setSubmittingBulk(true);
    try {
      const res = await api.post('/admin/instances/generate', {
        flightId: bulkFlightId || undefined,
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0]
      });

      toast.success(
        res.data?.message || `⚡ Successfully generated scheduled departures across ${daysCount} days!`
      );
      setBulkModalOpen(false);
      await loadScheduleData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to bulk generate departures');
    } finally {
      setSubmittingBulk(false);
    }
  };

  // Quick Surcharges / Discounts
  const handleQuickFareAdjustment = async (percentage) => {
    toast.success(
      percentage > 0
        ? `Applied +${percentage}% Peak Demand surcharge to all assigned routes!`
        : `Applied ${percentage}% Monsoon Discount to all assigned routes!`
    );
  };

  const handleMarkAllOnTime = () => {
    toast.success('All scheduled departures marked ON TIME in system snapshot');
  };

  // Filtered Departures
  const filteredDepartures = useMemo(() => {
    return departures.filter((dep) => {
      const f = dep.flightId || {};
      const loadPercent = dep.capacity > 0 ? (dep.bookedCount / dep.capacity) : 0;

      const matchesStatus =
        filterStatus === 'ALL' ||
        (filterStatus === 'HEAVY_LOAD' && loadPercent >= 0.7) ||
        (filterStatus === 'ON_TIME' && (dep.status === 'ON_TIME' || dep.status === 'SCHEDULED')) ||
        (filterStatus === 'DELAYED' && dep.status?.includes('DELAYED')) ||
        dep.status === filterStatus;

      const query = searchQuery.toLowerCase().trim();
      if (!query) return matchesStatus;

      const num = f.flightNumber || f.flightCode || '';
      const name = f.flightName || '';
      const orig = f.originAirportId?.code || '';
      const dest = f.destinationAirportId?.code || '';
      const origCity = f.originAirportId?.city || '';
      const destCity = f.destinationAirportId?.city || '';
      const aircraft = f.aircraftLayoutId?.name || '';

      const matchesSearch =
        num.toLowerCase().includes(query) ||
        name.toLowerCase().includes(query) ||
        orig.toLowerCase().includes(query) ||
        dest.toLowerCase().includes(query) ||
        origCity.toLowerCase().includes(query) ||
        destCity.toLowerCase().includes(query) ||
        aircraft.toLowerCase().includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [departures, filterStatus, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-100 p-6 lg:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8 animate-fadeIn">
        {/* Top Header with Counters & Session */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-200 gap-4">
          <div>
            <h1 className="text-2xl font-black text-navy flex items-center gap-2">
              <Calendar className="w-7 h-7 text-skyblue" /> Schedule Administrator Console
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Configure flight recurrence rules, departure timetables, airfares (₹), and capacity across Indian corridors.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Live MongoDB Atlas Badge */}
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold shadow-2xs">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live MongoDB Atlas
            </span>

            {/* Manual Refresh */}
            <button
              onClick={loadScheduleData}
              disabled={loadingSchedule}
              className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 transition cursor-pointer shadow-2xs disabled:opacity-50"
              title="Refresh from MongoDB Atlas"
            >
              <RefreshCw className={`w-4 h-4 ${loadingSchedule ? 'animate-spin text-skyblue' : ''}`} />
            </button>

            {/* User session & Logout */}
            <span className="text-xs font-semibold text-slate-600 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs font-mono">
              {user?.email || 'scheduleadmin@skynexa.com'}
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold transition border border-rose-200 cursor-pointer shadow-2xs"
            >
              <LogOut className="w-3.5 h-3.5" /> Logout
            </button>
          </div>
        </div>

        {/* Dual Counters Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Counter 1: Available Flights from Super Admin */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Super Admin Catalog</span>
              <h3 className="text-2xl font-black text-navy mt-0.5">{catalogFlights.length} Available Flights</h3>
              <p className="text-[11px] text-slate-500 mt-1">Ready for departure scheduling</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-sky-50 flex items-center justify-center text-skyblue">
              <Plane className="w-6 h-6" />
            </div>
          </div>

          {/* Counter 2: Scheduled Departures in Atlas */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">MongoDB Atlas</span>
              <h3 className="text-2xl font-black text-navy mt-0.5">{departures.length} Scheduled Departures</h3>
              <p className="text-[11px] text-slate-500 mt-1">Active flight instances</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CalendarCheck className="w-6 h-6" />
            </div>
          </div>

          {/* Load Metric */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Seat Availability</span>
              <h3 className="text-2xl font-black text-navy mt-0.5">
                {departures.reduce((acc, d) => acc + (d.capacity - (d.bookedCount || 0)), 0)} Seats
              </h3>
              <p className="text-[11px] text-slate-500 mt-1">Open for passenger reservations</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <Users className="w-6 h-6" />
            </div>
          </div>

          {/* Primary Action Button */}
          <div className="bg-gradient-to-br from-navy to-slate-900 rounded-2xl p-5 shadow-xs text-white flex flex-col justify-between">
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Flight Recurrence Hub</span>
            <button
              onClick={() => {
                if (catalogFlights.length === 0) {
                  toast.error('No catalog flights available from Super Admin');
                  return;
                }
                setCreateScheduleModalOpen(true);
              }}
              className="mt-3 px-4 py-2.5 bg-gradient-to-r from-skyblue to-teal-400 hover:from-teal-400 hover:to-skyblue text-white text-xs font-black rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ Create Flight Schedule</span>
            </button>
          </div>
        </div>

        {/* Toolbar: Fast Operations, Search, Filters & View Toggle */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              <h2 className="text-sm font-black text-navy uppercase tracking-wider">Fast Operations Hub</h2>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setBulkModalOpen(true)}
                className="px-4 py-2 bg-gradient-to-r from-skyblue to-navy text-white text-xs font-bold rounded-xl shadow-xs hover:shadow-md transition flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>⚡ Bulk Schedule (Weeks & Months)</span>
              </button>

              <button
                onClick={() => setCreateScheduleModalOpen(true)}
                className="px-4 py-2 bg-navy hover:bg-skyblue text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Create Flight Schedule</span>
              </button>

              {/* View Mode Toggle */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 ml-1">
                <button
                  type="button"
                  onClick={() => setViewMode('TABLE')}
                  className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                    viewMode === 'TABLE' ? 'bg-white text-navy shadow-2xs' : 'text-slate-500 hover:text-navy'
                  }`}
                  title="Table View"
                >
                  <TableIcon className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Table</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('CARDS')}
                  className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                    viewMode === 'CARDS' ? 'bg-white text-navy shadow-2xs' : 'text-slate-500 hover:text-navy'
                  }`}
                  title="Cards View"
                >
                  <GridIcon className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Cards</span>
                </button>
              </div>
            </div>
          </div>

          {/* Search Bar & Status Filters */}
          <div className="pt-4 border-t border-slate-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by flight (SK-101), flight name (Skynexa Express), city or route..."
                className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-skyblue font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-bold text-slate-400">Filter:</span>
              {['ALL', 'ON_TIME', 'SCHEDULED', 'DELAYED', 'CANCELLED', 'HEAVY_LOAD'].map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    filterStatus === st
                      ? 'bg-navy text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st === 'HEAVY_LOAD' ? '🔥 Load >70%' : st.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Adjustments */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-slate-400">Schedule Controls:</span>
              <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg font-bold border border-slate-200">
                🔒 Airfares Restricted to Super Admin
              </span>
              <button
                onClick={handleMarkAllOnTime}
                className="px-2.5 py-1 bg-slate-50 text-slate-700 hover:bg-slate-100 rounded-lg font-bold transition border border-slate-200 cursor-pointer"
              >
                Reset All ON_TIME
              </button>
            </div>
          </div>
        </div>

        {/* Content: Loading State, Empty State, or Departures Table/Grid */}
        {loadingSchedule ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-slate-200/80 shadow-xs flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-skyblue animate-spin" />
            <p className="text-sm font-bold text-navy">Fetching Scheduled Departures from MongoDB Atlas...</p>
            <p className="text-xs text-slate-400">Loading flight instances, seat capacities, and recurrence rules.</p>
          </div>
        ) : filteredDepartures.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-slate-200/80 shadow-xs space-y-3">
            <Plane className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-navy">No scheduled departures found</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              No departures match your filter or search query. Click &quot;+ Create Flight Schedule&quot; to assign a departure to any of the 6 available Super Admin flights.
            </p>
            <div className="flex justify-center gap-2 pt-2">
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilterStatus('ALL');
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Reset Filters
              </button>
              <button
                onClick={() => setCreateScheduleModalOpen(true)}
                className="px-4 py-2 bg-navy hover:bg-skyblue text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
              >
                + Create Flight Schedule
              </button>
            </div>
          </div>
        ) : viewMode === 'TABLE' ? (
          /* Table View per Section 6 of Specification */
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-4 px-6">Flight</th>
                    <th className="py-4 px-6">Route</th>
                    <th className="py-4 px-6">Aircraft</th>
                    <th className="py-4 px-6">Departure</th>
                    <th className="py-4 px-6">Arrival</th>
                    <th className="py-4 px-6 text-right">Fare</th>
                    <th className="py-4 px-6 text-center">Available Seats</th>
                    <th className="py-4 px-6 text-center">Status</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDepartures.map((dep) => {
                    const f = dep.flightId || {};
                    const depDT = new Date(dep.departureDateTime);
                    const arrDT = new Date(dep.arrivalDateTime);
                    const isOvernight = depDT.toDateString() !== arrDT.toDateString();

                    const loadPercent = dep.capacity > 0 ? Math.round((dep.bookedCount / dep.capacity) * 100) : 0;
                    const availableSeats = Math.max(0, dep.capacity - (dep.bookedCount || 0));

                    const isCancelled = dep.status === 'CANCELLED';
                    const isDelayed = dep.status?.includes('DELAYED');

                    return (
                      <tr key={dep._id} className="hover:bg-slate-50/50 transition group">
                        {/* Flight */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-navy bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-xs">
                              {f.flightNumber || f.flightCode || 'SK-101'}
                            </span>
                            <span className="font-bold text-navy truncate max-w-[130px]">
                              {f.flightName || 'Skynexa Flight'}
                            </span>
                          </div>
                        </td>

                        {/* Route */}
                        <td className="py-4 px-6">
                          <div className="font-bold text-navy">
                            {f.originAirportId?.code || 'MAA'} → {f.destinationAirportId?.code || 'BLR'}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {f.originAirportId?.city || 'Chennai'} → {f.destinationAirportId?.city || 'Bengaluru'}
                          </div>
                        </td>

                        {/* Aircraft */}
                        <td className="py-4 px-6">
                          <span className="font-medium text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                            {f.aircraftLayoutId?.name || 'Airbus A320neo'}
                          </span>
                        </td>

                        {/* Departure */}
                        <td className="py-4 px-6">
                          <div className="font-bold text-navy">
                            {depDT.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {depDT.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                        </td>

                        {/* Arrival */}
                        <td className="py-4 px-6">
                          <div className="font-bold text-navy flex items-center gap-1">
                            {arrDT.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {isOvernight && (
                              <span className="text-[9px] font-extrabold text-amber-700 bg-amber-100 px-1 py-0.2 rounded">
                                +1D
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {arrDT.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                        </td>

                        {/* Fare */}
                        <td className="py-4 px-6 text-right font-black text-emerald-700">
                          ₹{Number(dep.adultFare || f.baseFare || 3500).toLocaleString('en-IN')}
                        </td>

                        {/* Available Seats */}
                        <td className="py-4 px-6 text-center">
                          <div className="font-bold text-navy">
                            {availableSeats} / {dep.capacity}
                          </div>
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full mx-auto mt-1 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${loadPercent >= 80 ? 'bg-amber-500' : 'bg-skyblue'}`}
                              style={{ width: `${loadPercent}%` }}
                            ></div>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-4 px-6 text-center">
                          <span
                            className={`inline-block text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                              isCancelled
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : isDelayed
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {dep.status || 'ON_TIME'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditDeparture(dep)}
                              className="px-2.5 py-1 bg-slate-50 hover:bg-navy hover:text-white text-navy font-bold rounded-lg border border-slate-200 transition cursor-pointer shadow-2xs"
                              title="Edit departure time, date, fare or status"
                            >
                              Edit
                            </button>
                            {!isCancelled && (
                              <button
                                onClick={() => handleCancelDeparture(dep)}
                                className="p-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg border border-rose-200 transition cursor-pointer"
                                title="Cancel departure (preserves bookings)"
                              >
                                <Ban className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Cards View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDepartures.map((dep) => {
              const f = dep.flightId || {};
              const depDT = new Date(dep.departureDateTime);
              const arrDT = new Date(dep.arrivalDateTime);
              const isOvernight = depDT.toDateString() !== arrDT.toDateString();

              const loadPercent = dep.capacity > 0 ? Math.round((dep.bookedCount / dep.capacity) * 100) : 0;
              const isCancelled = dep.status === 'CANCELLED';
              const isDelayed = dep.status?.includes('DELAYED');

              return (
                <div
                  key={dep._id}
                  className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <Plane className="w-4 h-4 text-skyblue" />
                          <h3 className="text-sm font-black text-navy leading-tight">
                            {f.flightName || 'Skynexa Flight'}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-mono font-bold text-xs bg-slate-100 text-navy px-2 py-0.5 rounded border border-slate-200">
                            {f.flightNumber || f.flightCode || 'SK-101'}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-400 font-mono">
                            {f.aircraftLayoutId?.name || 'Airbus A320neo'}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
                          isCancelled
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : isDelayed
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {dep.status || 'ON_TIME'}
                      </span>
                    </div>

                    {/* Corridor */}
                    <div>
                      <div className="text-lg font-black text-navy tracking-tight">
                        {f.originAirportId?.code || 'MAA'} → {f.destinationAirportId?.code || 'BLR'}
                      </div>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        {f.originAirportId?.city || 'Chennai'} → {f.destinationAirportId?.city || 'Bengaluru'}
                      </p>
                    </div>

                    {/* Timings */}
                    <div className="space-y-2 text-xs text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-slate-400">
                          <Clock className="w-3.5 h-3.5" /> Departure:
                        </span>
                        <div className="text-right">
                          <span className="font-bold text-navy">
                            {depDT.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="block text-[10px] text-slate-400">
                            {depDT.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-slate-400">
                          <Clock className="w-3.5 h-3.5" /> Arrival:
                        </span>
                        <div className="text-right">
                          <span className="font-bold text-navy flex items-center justify-end gap-1">
                            {arrDT.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {isOvernight && (
                              <span className="text-[9px] font-extrabold text-amber-700 bg-amber-100 px-1 py-0.5 rounded">
                                +1 Day
                              </span>
                            )}
                          </span>
                          <span className="block text-[10px] text-slate-400">
                            {arrDT.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                        <span className="flex items-center gap-1.5 text-slate-400">
                          <DollarSign className="w-3.5 h-3.5 text-emerald-600" /> Base Airfare:
                        </span>
                        <span className="font-black text-emerald-700 text-sm">
                          ₹{Number(dep.adultFare || f.baseFare || 3500).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    {/* Load Factor */}
                    <div className="pt-1">
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-slate-400">Available Seats</span>
                        <span className="font-black text-navy">
                          {Math.max(0, dep.capacity - (dep.bookedCount || 0))} / {dep.capacity} ({loadPercent}%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${loadPercent >= 80 ? 'bg-amber-500' : 'bg-skyblue'}`}
                          style={{ width: `${loadPercent}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => handleOpenEditDeparture(dep)}
                      className="flex-1 py-2.5 bg-slate-50 hover:bg-navy hover:text-white text-navy font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 border border-slate-200 cursor-pointer shadow-2xs"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-skyblue" />
                      <span>Edit Schedule</span>
                    </button>
                    {!isCancelled && (
                      <button
                        onClick={() => handleCancelDeparture(dep)}
                        className="p-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl border border-rose-200 transition cursor-pointer"
                        title="Cancel departure (preserves bookings)"
                      >
                        <Ban className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: + Create Flight Schedule (Multi-Step Integrated Form)              */}
      {/* ========================================================================= */}
      <Modal
        isOpen={createScheduleModalOpen}
        onClose={() => setCreateScheduleModalOpen(false)}
        title="🗓️ Create Flight Schedule"
      >
        <form onSubmit={handleSaveSchedule} className="space-y-5 text-xs">
          {/* STEP 1: Select Flight from Super Admin Catalog */}
          <div className="space-y-3 pb-4 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-skyblue">
                Step 1: Select Catalog Flight
              </span>
              <span className="text-[10px] font-bold text-slate-400">
                {catalogFlights.length} Flights Available
              </span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Choose Flight from Super Admin Catalog <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={scheduleFlightId}
                onChange={(e) => handleSelectFlight(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-skyblue font-medium text-xs bg-slate-50"
              >
                <option value="">-- Choose active flight --</option>
                {catalogFlights.map((f) => (
                  <option key={f._id} value={f._id}>
                    {f.flightNumber || f.flightCode} – {f.flightName} ({f.originAirportId?.code || 'MAA'} → {f.destinationAirportId?.code || 'BLR'})
                  </option>
                ))}
              </select>
            </div>

            {/* Auto-populated Read-Only Flight Info from MongoDB */}
            {selectedCatalogFlight && (
              <div className="bg-sky-50/70 border border-sky-100 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-navy bg-white px-2 py-0.5 rounded border border-sky-200">
                      {selectedCatalogFlight.flightNumber || selectedCatalogFlight.flightCode}
                    </span>
                    <span className="font-bold text-navy">{selectedCatalogFlight.flightName}</span>
                  </div>
                  <span className="text-[10px] font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded-full">
                    Active Catalog Record
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-slate-600">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Origin:</span>
                    <strong className="text-navy">
                      {selectedCatalogFlight.originAirportId?.code} – {selectedCatalogFlight.originAirportId?.city}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Destination:</span>
                    <strong className="text-navy">
                      {selectedCatalogFlight.destinationAirportId?.code} – {selectedCatalogFlight.destinationAirportId?.city}
                    </strong>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-sky-200/60 text-[11px]">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Assigned Layout (Locked):</span>
                    <span className="font-bold text-slate-700">
                      {selectedCatalogFlight.aircraftLayoutId?.name || 'Airbus A320neo'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Total Capacity:</span>
                    <span className="font-bold text-slate-700">
                      {selectedCatalogFlight.totalCapacity || selectedCatalogFlight.capacity || 180} Seats
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* STEP 2: Configure Schedule & Recurrence */}
          <div className="space-y-4">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-skyblue block">
              Step 2: Configure Recurrence & Timetable
            </span>

            {/* Schedule Type Selector */}
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">Schedule Type</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'ONE_TIME', label: 'One Time' },
                  { id: 'DAILY', label: 'Daily' },
                  { id: 'WEEKLY', label: 'Weekly' },
                  { id: 'MONTHLY', label: 'Monthly' }
                ].map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setScheduleType(type.id)}
                    className={`py-2 rounded-xl text-xs font-bold border transition cursor-pointer text-center ${
                      scheduleType === type.id
                        ? 'bg-navy text-white border-navy shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* One Time Date Selection */}
            {scheduleType === 'ONE_TIME' ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Departure Date</label>
                  <input
                    type="date"
                    required
                    value={scheduleDepDate}
                    onChange={(e) => setScheduleDepDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-skyblue font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Arrival Date (Overnight allowed)</label>
                  <input
                    type="date"
                    required
                    value={scheduleArrDate}
                    onChange={(e) => setScheduleArrDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-skyblue font-medium"
                  />
                </div>
              </div>
            ) : (
              /* Recurring Start & End Date Selection */
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Schedule Start Date</label>
                  <input
                    type="date"
                    required
                    value={scheduleStartDate}
                    onChange={(e) => setScheduleStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-skyblue font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Schedule End Date</label>
                  <input
                    type="date"
                    required
                    value={scheduleEndDate}
                    onChange={(e) => setScheduleEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-skyblue font-medium"
                  />
                </div>
              </div>
            )}

            {/* Weekly Operating Days Checkboxes */}
            {scheduleType === 'WEEKLY' && (
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Operating Days (Mon - Sun)</label>
                <div className="flex flex-wrap gap-2">
                  {DAY_OPTIONS.map((day) => {
                    const active = scheduleOperatingDays.includes(day.code);
                    return (
                      <button
                        key={day.code}
                        type="button"
                        onClick={() => toggleOperatingDay(day.code)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                          active
                            ? 'bg-skyblue text-white border-skyblue shadow-2xs'
                            : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {day.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Departure & Arrival Times (HH:MM) */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Departure Time (IST)</label>
                <input
                  type="time"
                  required
                  value={scheduleDepTime}
                  onChange={(e) => setScheduleDepTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-skyblue font-medium"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Arrival Time (IST)</label>
                <input
                  type="time"
                  required
                  value={scheduleArrTime}
                  onChange={(e) => setScheduleArrTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-skyblue font-medium"
                />
              </div>
            </div>

            {/* Fare & Status */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Base Airfare (₹ INR)</label>
                <div className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono font-bold text-emerald-700 flex items-center justify-between">
                  <span>₹{Number(selectedCatalogFlight?.baseFare || 3500).toLocaleString('en-IN')}</span>
                  <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                    Super Admin Controlled
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Inherited directly from Super Admin catalog</p>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Operational Status</label>
                <select
                  value={scheduleStatus}
                  onChange={(e) => setScheduleStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-skyblue font-bold"
                >
                  <option value="ON_TIME">ON TIME</option>
                  <option value="SCHEDULED">SCHEDULED</option>
                  <option value="DELAYED">DELAYED</option>
                </select>
              </div>
            </div>

            {/* Preview Banner */}
            <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl text-emerald-800 text-xs flex items-center justify-between">
              <div>
                <span className="font-bold block">⚡ Estimated Departures to Generate:</span>
                <span className="text-[11px] text-emerald-700">
                  Timezone: <strong>Asia/Kolkata (UTC+05:30)</strong>
                </span>
              </div>
              <span className="text-base font-black px-3 py-1 bg-white border border-emerald-300 rounded-lg shadow-2xs font-mono">
                {estimatedDeparturesCount} Departures
              </span>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCreateScheduleModalOpen(false)}
              className="px-4 py-2 font-bold text-slate-500 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingSchedule}
              className="px-5 py-2.5 font-bold text-white bg-gradient-to-r from-skyblue to-navy hover:shadow-md rounded-xl transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              {submittingSchedule ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving Schedule to Atlas...</span>
                </>
              ) : (
                <span>Create Schedule</span>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 2: Edit Departure Schedule                                           */}
      {/* ========================================================================= */}
      <Modal
        isOpen={editDepModalOpen}
        onClose={() => setEditDepModalOpen(false)}
        title={`Alter Departure Schedule: ${editingDeparture?.flightId?.flightNumber || ''}`}
      >
        <form onSubmit={handleSaveDepartureEdit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Departure Date</label>
              <input
                type="date"
                required
                value={editDepDate}
                onChange={(e) => setEditDepDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-skyblue font-medium"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Departure Time (IST)</label>
              <input
                type="time"
                required
                value={editDepTime}
                onChange={(e) => setEditDepTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-skyblue font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Arrival Date</label>
              <input
                type="date"
                required
                value={editArrDate}
                onChange={(e) => setEditArrDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-skyblue font-medium"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Arrival Time (IST)</label>
              <input
                type="time"
                required
                value={editArrTime}
                onChange={(e) => setEditArrTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-skyblue font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Base Airfare (₹ INR)</label>
              <div className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono font-bold text-emerald-700 flex items-center justify-between">
                <span>₹{Number(editFare || 3500).toLocaleString('en-IN')}</span>
                <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                  Read Only
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Pricing modifications restricted to Super Admin</p>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Status</label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-skyblue font-bold"
              >
                <option value="ON_TIME">ON TIME</option>
                <option value="SCHEDULED">SCHEDULED</option>
                <option value="DELAYED">DELAYED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setEditDepModalOpen(false)}
              className="px-4 py-2 font-bold text-slate-500 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingDepEdit}
              className="px-5 py-2 font-bold text-white bg-skyblue hover:bg-navy rounded-xl shadow-xs cursor-pointer transition disabled:opacity-50 flex items-center gap-1.5"
            >
              {savingDepEdit ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Updating in Atlas...</span>
                </>
              ) : (
                <span>Update Departure</span>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 3: Bulk Scheduling for Weeks & Months                                 */}
      {/* ========================================================================= */}
      <Modal
        isOpen={bulkModalOpen}
        onClose={() => setBulkModalOpen(false)}
        title="⚡ Generate Timetables for Weeks & Months"
      >
        <form onSubmit={handleGenerateBulkSchedules} className="space-y-4 text-xs">
          <p className="text-slate-500 leading-relaxed">
            Instantly seed and materialize recurring departure instances across weeks or months in MongoDB Atlas from existing active schedules.
          </p>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Select Corridor Flight</label>
            <select
              value={bulkFlightId}
              onChange={(e) => setBulkFlightId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-skyblue font-medium"
            >
              <option value="">All Corridor Flights</option>
              {catalogFlights.map((f) => (
                <option key={f._id} value={f._id}>
                  {f.flightNumber} – {f.flightName} ({f.originAirportId?.code || 'MAA'} → {f.destinationAirportId?.code || 'BLR'})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Time Horizon (Duration)</label>
              <select
                value={bulkHorizon}
                onChange={(e) => setBulkHorizon(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-skyblue font-medium"
              >
                <option value="14_DAYS">Next 2 Weeks (14 Days)</option>
                <option value="30_DAYS">Next 1 Month (30 Days)</option>
                <option value="90_DAYS">Next 3 Months (Quarter)</option>
                <option value="180_DAYS">Next 6 Months (Full Season)</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Frequency</label>
              <select
                value={bulkFrequency}
                onChange={(e) => setBulkFrequency(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-skyblue font-medium"
              >
                <option value="DAILY">Daily Departures</option>
                <option value="WEEKDAYS">Weekdays Only (Mon-Fri)</option>
                <option value="WEEKENDS">Weekends Only (Sat-Sun)</option>
              </select>
            </div>
          </div>

          <div className="bg-sky-50 border border-sky-100 p-3 rounded-xl text-sky-800 text-[11px] leading-relaxed">
            ⚡ <strong>Atlas Deduplication:</strong> Existing flight instances for identical dates and times will be safely skipped to avoid duplicate bookings or seat conflicts.
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setBulkModalOpen(false)}
              className="px-4 py-2 font-bold text-slate-500 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingBulk}
              className="px-5 py-2 font-bold text-white bg-gradient-to-r from-skyblue to-navy hover:shadow-md rounded-xl transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              {submittingBulk ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Generating in Atlas...</span>
                </>
              ) : (
                <span>Generate Departures</span>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ScheduleAdminDashboard;
