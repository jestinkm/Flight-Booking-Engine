import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Ticket,
  Armchair,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  RefreshCw,
  Plane,
  Eye,
  AlertTriangle,
  Users,
  Calendar,
  Layers,
  ChevronRight,
  ShieldCheck,
  Download,
  X
} from 'lucide-react';
import api from '../lib/axios';
import toast from 'react-hot-toast';

export default function SmartBookingSheet({ initialFlightInstanceId = null }) {
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState({
    totalBookings: 0,
    confirmedBookings: 0,
    cancelledBookings: 0,
    pendingBookings: 0,
    totalSeats: 1800,
    availableSeats: 1420,
    reservedSeats: 12,
    confirmedSeats: 368
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(Date.now());

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedRoute, setSelectedRoute] = useState('ALL');

  // Manifest Modal State
  const [selectedManifestInstance, setSelectedManifestInstance] = useState(null);
  const [manifestData, setManifestData] = useState(null);
  const [loadingManifest, setLoadingManifest] = useState(false);

  // Fetch live bookings sheet data
  const fetchBookingSheet = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const params = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (initialFlightInstanceId) params.flightInstanceId = initialFlightInstanceId;

      const res = await api.get('/admin/bookings', { params });
      const data = res.data?.data;
      if (data) {
        setBookings(data.bookings || []);
        if (data.stats) {
          setStats((prev) => ({
            ...prev,
            ...data.stats
          }));
        }
        setLastUpdated(Date.now());
        if (isManual) {
          toast.success('Live booking sheet refreshed');
        }
      }
    } catch (err) {
      console.warn('[BookingSheet] Sync notice:', err.message);
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  }, [statusFilter, searchTerm, initialFlightInstanceId]);

  useEffect(() => {
    fetchBookingSheet(false);
  }, [fetchBookingSheet]);

  // Real-time polling every 8 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchBookingSheet(false);
    }, 8000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchBookingSheet]);

  // Open Flight Seat Sheet Manifest Modal
  const handleOpenManifest = async (instanceId) => {
    if (!instanceId) return;
    setSelectedManifestInstance(instanceId);
    setLoadingManifest(true);
    try {
      const res = await api.get(`/admin/bookings/flight-sheet/${instanceId}`);
      if (res.data?.success) {
        setManifestData(res.data.data);
      }
    } catch (err) {
      toast.error('Could not load live flight seat manifest');
      setSelectedManifestInstance(null);
    } finally {
      setLoadingManifest(false);
    }
  };

  // Extract unique routes for filter
  const routesList = useMemo(() => {
    const set = new Set();
    bookings.forEach((b) => {
      const fl = b.flightInstanceId?.flightId;
      if (fl?.originAirportId?.code && fl?.destinationAirportId?.code) {
        set.add(`${fl.originAirportId.code} → ${fl.destinationAirportId.code}`);
      }
    });
    return Array.from(set);
  }, [bookings]);

  // Filter bookings locally by route if selected
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      if (selectedRoute === 'ALL') return true;
      const fl = b.flightInstanceId?.flightId;
      const r = `${fl?.originAirportId?.code || 'DEL'} → ${fl?.destinationAirportId?.code || 'BOM'}`;
      return r === selectedRoute;
    });
  }, [bookings, selectedRoute]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Confirmed
          </span>
        );
      case 'PARTIALLY_CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <AlertTriangle className="w-3 h-3 text-amber-600" /> Partially Cancelled
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-600" /> Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
            <Clock className="w-3 h-3 text-sky-600 animate-spin" /> Pending
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Real-time Live Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-navy text-white flex items-center justify-center shadow-xs">
              <Ticket className="w-4 h-4 text-skyblue" />
            </div>
            <h2 className="text-xl font-black text-navy">Smart Flight Booking Sheet</h2>
            <span className="relative flex h-2.5 w-2.5 ml-1">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${autoRefresh ? 'bg-emerald-400 opacity-75' : 'bg-slate-300'}`}></span>
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${autoRefresh ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time synchronization across simultaneous customer bookings, seat holds, and cancellations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          {/* Auto Refresh Toggle */}
          <button
            type="button"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
              autoRefresh
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
            <span>{autoRefresh ? 'Live Auto-Sync (8s)' : 'Auto-Sync Off'}</span>
          </button>

          {/* Manual Refresh Button */}
          <button
            type="button"
            onClick={() => fetchBookingSheet(true)}
            disabled={refreshing}
            className="px-3.5 py-1.5 rounded-xl bg-navy text-white hover:bg-skyblue text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Syncing...' : 'Refresh Sheet'}</span>
          </button>
        </div>
      </div>

      {/* Real-time Metric Cards (Total, Available, Reserved, Confirmed, Cancelled) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Seats</span>
            <Armchair className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-navy">{stats.totalSeats.toLocaleString()}</div>
          <span className="text-[10px] text-slate-400">Configured aircraft fleet</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-white to-emerald-50/30 shadow-xs">
          <div className="flex items-center justify-between text-emerald-600 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Available Seats</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
          <div className="text-2xl font-black text-emerald-700">{stats.availableSeats.toLocaleString()}</div>
          <span className="text-[10px] text-emerald-600 font-medium">Ready for real-time booking</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-200/80 bg-gradient-to-br from-white to-amber-50/30 shadow-xs">
          <div className="flex items-center justify-between text-amber-600 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Reserved Seats</span>
            <Clock className="w-4 h-4 text-amber-500 animate-pulse" />
          </div>
          <div className="text-2xl font-black text-amber-700">{stats.reservedSeats.toLocaleString()}</div>
          <span className="text-[10px] text-amber-700 font-medium">Temporarily held in checkout</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-sky-200/80 bg-gradient-to-br from-white to-sky-50/30 shadow-xs">
          <div className="flex items-center justify-between text-skyblue mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Confirmed Bookings</span>
            <CheckCircle2 className="w-4 h-4 text-skyblue" />
          </div>
          <div className="text-2xl font-black text-navy">{stats.confirmedBookings.toLocaleString()}</div>
          <span className="text-[10px] text-slate-500">Official tickets issued</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-rose-200/80 bg-gradient-to-br from-white to-rose-50/30 shadow-xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-rose-600 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Cancelled</span>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-700">{stats.cancelledBookings.toLocaleString()}</div>
          <span className="text-[10px] text-rose-600 font-medium">Seats released back</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by PNR, passenger name, contact email, or flight number..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-skyblue transition"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-navy"
            >
              ✕
            </button>
          )}
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {['ALL', 'CONFIRMED', 'PENDING', 'CANCELLED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                statusFilter === st
                  ? 'bg-navy text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'ALL' ? 'All Statuses' : st}
            </button>
          ))}
        </div>

        {/* Route Filter Dropdown */}
        {routesList.length > 0 && (
          <div className="shrink-0">
            <select
              value={selectedRoute}
              onChange={(e) => setSelectedRoute(e.target.value)}
              className="w-full md:w-auto px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-skyblue text-navy cursor-pointer"
            >
              <option value="ALL">All Flight Routes</option>
              {routesList.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Main Booking Sheet Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin text-skyblue mx-auto" />
            <p className="font-semibold text-navy">Loading live flight booking records...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 space-y-2">
            <Ticket className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-bold text-navy text-sm">No Booking Records Found</p>
            <p>Try adjusting your search criteria or status filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-400 font-extrabold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="p-4">PNR / Ref</th>
                  <th className="p-4">Passenger Manifest</th>
                  <th className="p-4">Flight &amp; Route</th>
                  <th className="p-4">Travel Date</th>
                  <th className="p-4">Seat Numbers</th>
                  <th className="p-4">Booking Status</th>
                  <th className="p-4 text-right">Fare Paid</th>
                  <th className="p-4 text-center">Seat Sheet</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredBookings.map((b) => {
                  const flightInstance = b.flightInstanceId || {};
                  const flight = flightInstance.flightId || {};
                  const passengers = b.passengers || [];
                  const seats = b.seatNumbers || [];
                  const originCode = flight.originAirportId?.code || 'DEL';
                  const destCode = flight.destinationAirportId?.code || 'BOM';
                  const flightNum = flight.flightNumber || flight.flightCode || 'SK-101';
                  const depDate = flightInstance.departureDateTime
                    ? new Date(flightInstance.departureDateTime).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })
                    : 'N/A';

                  return (
                    <tr key={b._id || b.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* PNR Reference */}
                      <td className="p-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-extrabold text-navy bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                            {b.bookingReference}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-1">
                          {b.createdAt ? new Date(b.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </td>

                      {/* Passenger Name & Details */}
                      <td className="p-4">
                        {passengers.length > 0 ? (
                          <div className="space-y-1">
                            <p className="font-bold text-navy">
                              {passengers[0].firstName} {passengers[0].lastName}
                              {passengers.length > 1 && (
                                <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[9px] font-extrabold bg-sky-100 text-sky-800">
                                  +{passengers.length - 1} more
                                </span>
                              )}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              Contact: {b.contactEmail || b.userId?.email || 'N/A'}
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p className="font-bold text-navy">{b.userId?.name || b.userId?.username || 'Customer'}</p>
                            <p className="text-[10px] text-slate-400">{b.userId?.email || b.contactEmail || 'N/A'}</p>
                          </div>
                        )}
                      </td>

                      {/* Flight & Corridor */}
                      <td className="p-4">
                        <div className="flex items-center gap-1.5 font-bold text-navy">
                          <Plane className="w-3.5 h-3.5 text-skyblue" />
                          <span>{flightNum}</span>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-slate-500">
                          {originCode} → {destCode}
                        </span>
                      </td>

                      {/* Travel Date */}
                      <td className="p-4">
                        <span className="font-bold text-navy">{depDate}</span>
                        <span className="text-[10px] text-slate-400 block">
                          {flightInstance.departureDateTime
                            ? new Date(flightInstance.departureDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : ''}
                        </span>
                      </td>

                      {/* Seat Numbers */}
                      <td className="p-4">
                        {seats.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {seats.map((seat) => (
                              <span
                                key={seat}
                                className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-navy text-white shadow-2xs"
                              >
                                {seat}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Auto Assigned</span>
                        )}
                      </td>

                      {/* Booking Status */}
                      <td className="p-4">{getStatusBadge(b.status)}</td>

                      {/* Fare Paid */}
                      <td className="p-4 text-right">
                        <span className="font-mono font-extrabold text-navy">
                          ₹{Number(b.totalAmount || 0).toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] text-slate-400 block capitalize">
                          {b.paymentStatus === 'PAID' ? 'Paid' : b.paymentStatus || 'Pending'}
                        </span>
                      </td>

                      {/* Seat Sheet Manifest Action */}
                      <td className="p-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleOpenManifest(flightInstance._id || flightInstance.id)}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-navy hover:text-white text-navy font-bold text-[11px] transition flex items-center gap-1 mx-auto cursor-pointer shadow-2xs"
                          title="View live aircraft seat layout and passenger manifest"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Sheet</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Live Aircraft Seat Sheet Manifest Modal */}
      {selectedManifestInstance && (
        <div className="fixed inset-0 z-50 bg-navy/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 border border-slate-200 shadow-2xl space-y-6 my-8 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-navy text-white flex items-center justify-center shadow-md">
                  <Plane className="w-5 h-5 text-skyblue" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-navy">
                    {manifestData?.instance?.flightNumber} — Live Flight Seat Manifest
                  </h3>
                  <p className="text-xs text-slate-500">
                    Route: <span className="font-bold text-navy">{manifestData?.instance?.route}</span> • Departure:{' '}
                    <span className="font-bold text-navy">
                      {manifestData?.instance?.departureDateTime
                        ? new Date(manifestData.instance.departureDateTime).toLocaleString()
                        : 'Scheduled'}
                    </span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedManifestInstance(null);
                  setManifestData(null);
                }}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {loadingManifest ? (
              <div className="py-16 text-center text-xs text-slate-500 space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin text-skyblue mx-auto" />
                <p>Loading live cabin layout and real-time reservations...</p>
              </div>
            ) : manifestData ? (
              <div className="space-y-6 flex-1 overflow-y-auto pr-1">
                {/* Stats */}
                <div className="grid grid-cols-4 gap-3 text-center">
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Capacity</span>
                    <p className="text-lg font-black text-navy">{manifestData.stats?.totalSeats}</p>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200">
                    <span className="text-[10px] font-bold text-emerald-600 uppercase">Available</span>
                    <p className="text-lg font-black text-emerald-700">{manifestData.stats?.availableSeats}</p>
                  </div>
                  <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200">
                    <span className="text-[10px] font-bold text-amber-600 uppercase">Held (Locked)</span>
                    <p className="text-lg font-black text-amber-700">{manifestData.stats?.reservedSeats}</p>
                  </div>
                  <div className="p-3 bg-slate-100 rounded-2xl border border-slate-300">
                    <span className="text-[10px] font-bold text-slate-600 uppercase">Confirmed</span>
                    <p className="text-lg font-black text-slate-800">{manifestData.stats?.bookedSeats}</p>
                  </div>
                </div>

                {/* Seat Grid Mapping */}
                <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50">
                  <h4 className="text-xs font-bold text-navy uppercase tracking-wider mb-3">
                    Cabin Seat Allocation &amp; Passenger Mapping
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-72 overflow-y-auto p-1">
                    {manifestData.seats?.map((seat) => {
                      const isBooked = seat.status === 'ASSIGNED';
                      const isLocked = seat.status === 'LOCKED';

                      return (
                        <div
                          key={seat.seatNumber}
                          className={`p-2.5 rounded-xl border text-xs transition-all ${
                            isBooked
                              ? 'bg-slate-100 border-slate-300 text-slate-700'
                              : isLocked
                              ? 'bg-amber-50 border-amber-300 text-amber-800'
                              : 'bg-white border-emerald-300 text-emerald-800'
                          }`}
                        >
                          <div className="flex items-center justify-between font-bold">
                            <span className="font-mono text-sm">{seat.seatNumber}</span>
                            <span className="text-[10px] opacity-75">{seat.position}</span>
                          </div>

                          {isBooked ? (
                            <div className="mt-1 space-y-0.5">
                              <p className="font-bold text-[11px] truncate">{seat.passenger?.name || 'Passenger'}</p>
                              <p className="text-[10px] font-mono text-slate-500 truncate">PNR: {seat.booking?.pnr || 'CONFIRMED'}</p>
                            </div>
                          ) : isLocked ? (
                            <div className="mt-1">
                              <span className="text-[10px] font-bold text-amber-600 flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5 animate-pulse" /> Temp Reserved
                              </span>
                            </div>
                          ) : (
                            <div className="mt-1">
                              <span className="text-[10px] font-bold text-emerald-600">Available</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
