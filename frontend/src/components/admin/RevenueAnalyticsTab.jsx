import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Calendar,
  Plane,
  Ticket,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  CreditCard,
  Download,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Layers,
  ShieldCheck,
  FileSpreadsheet,
  RotateCcw
} from 'lucide-react';
import api from '../../lib/axios';
import toast from 'react-hot-toast';
import StatsCard from '../StatsCard';
import Modal from '../Modal';

const formatINR = (val) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(val || 0);
};

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
};

const RevenueAnalyticsTab = () => {
  // Active Sub-Tab: 'FLIGHTS' (Flight-Wise Revenue) or 'CUSTOMERS' (Customer Details)
  const [subTab, setSubTab] = useState('FLIGHTS');

  // Summary Metrics State
  const [summary, setSummary] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loadingSummary, setLoadingSummary] = useState(true);

  // Flight-Wise Report State
  const [flightView, setFlightView] = useState('instances'); // 'instances' or 'aggregated'
  const [flightData, setFlightData] = useState([]);
  const [flightPagination, setFlightPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [loadingFlights, setLoadingFlights] = useState(false);
  const [flightFilters, setFlightFilters] = useState({
    flightNumber: '',
    originAirport: '',
    destinationAirport: '',
    startDate: '',
    endDate: '',
    bookingStatus: 'ALL',
    paymentStatus: 'ALL',
    sortBy: 'departureDate',
    sortOrder: 'desc'
  });

  // Customer Bookings Report State
  const [customerData, setCustomerData] = useState([]);
  const [customerPagination, setCustomerPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [customerFilters, setCustomerFilters] = useState({
    search: '',
    flightNumber: '',
    bookingStatus: 'ALL',
    paymentStatus: 'ALL',
    startDate: '',
    endDate: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  // Export State
  const [exportingFlightCSV, setExportingFlightCSV] = useState(false);
  const [exportingCustomerCSV, setExportingCustomerCSV] = useState(false);

  // Manifest Details Modal
  const [manifestModalOpen, setManifestModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [copiedPNR, setCopiedPNR] = useState(null);

  // ----------------------------------------------------
  // 1. Fetch Executive Summary
  // ----------------------------------------------------
  const fetchSummary = useCallback(async () => {
    try {
      setLoadingSummary(true);
      const res = await api.get('/admin/analytics/summary');
      if (res.data?.success) {
        setSummary(res.data.data.summary);
        setTimeline(res.data.data.timeline || []);
      }
    } catch (err) {
      console.error('Failed to load analytics summary:', err);
      toast.error('Failed to load revenue analytics summary');
    } finally {
      setLoadingSummary(false);
    }
  }, []);

  // ----------------------------------------------------
  // 2. Fetch Flight Revenue Data
  // ----------------------------------------------------
  const fetchFlightRevenue = useCallback(async (page = 1) => {
    try {
      setLoadingFlights(true);
      const params = {
        view: flightView,
        page,
        limit: flightPagination.limit,
        sortBy: flightFilters.sortBy,
        sortOrder: flightFilters.sortOrder
      };

      if (flightFilters.flightNumber) params.flightNumber = flightFilters.flightNumber;
      if (flightFilters.startDate) params.startDate = flightFilters.startDate;
      if (flightFilters.endDate) params.endDate = flightFilters.endDate;
      if (flightFilters.bookingStatus !== 'ALL') params.bookingStatus = flightFilters.bookingStatus;
      if (flightFilters.paymentStatus !== 'ALL') params.paymentStatus = flightFilters.paymentStatus;

      const res = await api.get('/admin/analytics/flights', { params });
      if (res.data?.success) {
        setFlightData(res.data.data.items || []);
        setFlightPagination(res.data.data.pagination || { page, limit: 10, total: 0, pages: 1 });
      }
    } catch (err) {
      console.error('Failed to load flight revenue report:', err);
      toast.error('Failed to load flight revenue report');
    } finally {
      setLoadingFlights(false);
    }
  }, [flightView, flightFilters, flightPagination.limit]);

  // ----------------------------------------------------
  // 3. Fetch Customer Bookings Data
  // ----------------------------------------------------
  const fetchCustomerBookings = useCallback(async (page = 1) => {
    try {
      setLoadingCustomers(true);
      const params = {
        page,
        limit: customerPagination.limit,
        sortBy: customerFilters.sortBy,
        sortOrder: customerFilters.sortOrder
      };

      if (customerFilters.search) params.search = customerFilters.search;
      if (customerFilters.flightNumber) params.flightNumber = customerFilters.flightNumber;
      if (customerFilters.startDate) params.startDate = customerFilters.startDate;
      if (customerFilters.endDate) params.endDate = customerFilters.endDate;
      if (customerFilters.bookingStatus !== 'ALL') params.bookingStatus = customerFilters.bookingStatus;
      if (customerFilters.paymentStatus !== 'ALL') params.paymentStatus = customerFilters.paymentStatus;

      const res = await api.get('/admin/analytics/customers', { params });
      if (res.data?.success) {
        setCustomerData(res.data.data.items || []);
        setCustomerPagination(res.data.data.pagination || { page, limit: 10, total: 0, pages: 1 });
      }
    } catch (err) {
      console.error('Failed to load customer bookings report:', err);
      toast.error('Failed to load customer bookings report');
    } finally {
      setLoadingCustomers(false);
    }
  }, [customerFilters, customerPagination.limit]);

  // Initial Load & SubTab Changes
  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    if (subTab === 'FLIGHTS') {
      fetchFlightRevenue(1);
    } else {
      fetchCustomerBookings(1);
    }
  }, [subTab, flightView, flightFilters, customerFilters]);

  // ----------------------------------------------------
  // CSV Export Handlers
  // ----------------------------------------------------
  const handleExportFlightsCSV = async () => {
    try {
      setExportingFlightCSV(true);
      const res = await api.get('/admin/analytics/export/flights', {
        params: { view: flightView },
        responseType: 'blob'
      });

      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `skynexa-flight-revenue-${flightView}-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Flight revenue report exported successfully (Audit Logged)');
    } catch (err) {
      console.error('Error exporting flight revenue CSV:', err);
      toast.error('Failed to export flight revenue report');
    } finally {
      setExportingFlightCSV(false);
    }
  };

  const handleExportCustomersCSV = async () => {
    try {
      setExportingCustomerCSV(true);
      const res = await api.get('/admin/analytics/export/customers', {
        responseType: 'blob'
      });

      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `skynexa-customer-bookings-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Customer bookings report exported successfully (Audit Logged)');
    } catch (err) {
      console.error('Error exporting customer bookings CSV:', err);
      toast.error('Failed to export customer bookings report');
    } finally {
      setExportingCustomerCSV(false);
    }
  };

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedPNR(key);
    toast.success(`Copied ${text}`);
    setTimeout(() => setCopiedPNR(null), 2000);
  };

  // Sorting Toggles
  const handleSortFlights = (field) => {
    setFlightFilters((prev) => ({
      ...prev,
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleSortCustomers = (field) => {
    setCustomerFilters((prev) => ({
      ...prev,
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === 'asc' ? 'desc' : 'asc'
    }));
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase bg-skyblue/10 text-skyblue border border-skyblue/20">
              Executive Financial Intelligence
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500 font-medium">MongoDB Atlas Live Sync</span>
          </div>
          <h1 className="text-2xl font-black text-navy flex items-center gap-2.5">
            <BarChart3 className="w-7 h-7 text-skyblue" />
            Revenue & Customer Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Real-time financial reconciliation, flight-wise gross and net revenues, seat load factors, and DGCA-compliant customer manifests.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              fetchSummary();
              if (subTab === 'FLIGHTS') fetchFlightRevenue(flightPagination.page);
              else fetchCustomerBookings(customerPagination.page);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 shadow-2xs transition cursor-pointer"
            title="Refresh All Analytics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${(loadingSummary || loadingFlights || loadingCustomers) ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* 11 Executive Summary Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-400">
            System Revenue & Operational Metrics (11 Core Indicators)
          </h2>
          {summary && (
            <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Fleet Occupancy: {summary.overallOccupancyPct}%
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3.5">
          {/* 1. Total Flights */}
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
              <span>Total Flights</span>
              <Plane className="w-4 h-4 text-skyblue" />
            </div>
            <div className="text-xl font-black text-navy">
              {loadingSummary ? '...' : (summary?.totalFlights || 0)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Catalog routes</div>
          </div>

          {/* 2. Total Flight Instances */}
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
              <span>Flight Instances</span>
              <Calendar className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-xl font-black text-navy">
              {loadingSummary ? '...' : (summary?.totalFlightInstances || 0)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Scheduled departures</div>
          </div>

          {/* 3. Total Bookings */}
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
              <span>Total Bookings</span>
              <Ticket className="w-4 h-4 text-violet-500" />
            </div>
            <div className="text-xl font-black text-navy">
              {loadingSummary ? '...' : (summary?.totalBookings || 0)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">All time reservations</div>
          </div>

          {/* 4. Confirmed Bookings */}
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
              <span>Confirmed</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-xl font-black text-emerald-600">
              {loadingSummary ? '...' : (summary?.confirmedBookings || 0)}
            </div>
            <div className="text-[11px] text-emerald-700 font-medium mt-1">Active tickets</div>
          </div>

          {/* 5. Cancelled Bookings */}
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
              <span>Cancelled</span>
              <XCircle className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-xl font-black text-rose-600">
              {loadingSummary ? '...' : (summary?.cancelledBookings || 0)}
            </div>
            <div className="text-[11px] text-rose-700 font-medium mt-1">Refund processed</div>
          </div>

          {/* 6. Total Passengers */}
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
              <span>Total Passengers</span>
              <Users className="w-4 h-4 text-cyan-600" />
            </div>
            <div className="text-xl font-black text-navy">
              {loadingSummary ? '...' : (summary?.totalPassengers || 0)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {summary ? `${summary.confirmedPassengers || 0} active` : 'Individual fliers'}
            </div>
          </div>

          {/* 7. Gross Booking Value */}
          <div className="bg-gradient-to-br from-navy to-slate-900 text-white rounded-2xl p-4 border border-navy-800 shadow-sm col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between text-slate-300 text-xs font-semibold mb-2">
              <span>Gross Booking Value</span>
              <CreditCard className="w-4 h-4 text-skyblue" />
            </div>
            <div className="text-xl font-black text-white">
              {loadingSummary ? '...' : formatINR(summary?.grossBookingValue)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Cumulative bookings</div>
          </div>

          {/* 8. Net Revenue (Realized) */}
          <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-2xl p-4 border border-emerald-500/30 shadow-sm col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between text-emerald-100 text-xs font-semibold mb-2">
              <span>Net Realized Revenue</span>
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <div className="text-xl font-black text-white">
              {loadingSummary ? '...' : formatINR(summary?.netRevenue)}
            </div>
            <div className="text-[11px] text-emerald-100 font-medium mt-1">Realized collected</div>
          </div>

          {/* 9. Pending Payments */}
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
              <span>Pending Payments</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-xl font-black text-amber-600">
              {loadingSummary ? '...' : (summary?.pendingPayments?.count || 0)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {loadingSummary ? '...' : formatINR(summary?.pendingPayments?.amount || 0)}
            </div>
          </div>

          {/* 10. Failed Payments */}
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
              <span>Failed Payments</span>
              <AlertCircle className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-xl font-black text-slate-700">
              {loadingSummary ? '...' : (summary?.failedPayments?.count || 0)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {loadingSummary ? '...' : formatINR(summary?.failedPayments?.amount || 0)}
            </div>
          </div>

          {/* 11. Refunds Issued */}
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-2xs col-span-2 sm:col-span-2 xl:col-span-2">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
              <span>Refunds Issued</span>
              <RotateCcw className="w-4 h-4 text-purple-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black text-purple-700">
                {loadingSummary ? '...' : formatINR(summary?.refundsIssued?.amount || 0)}
              </span>
              <span className="text-xs text-purple-600 font-bold bg-purple-50 px-2 py-0.5 rounded-md">
                {summary?.refundsIssued?.count || 0} refunds
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">DGCA-compliant automated returns</div>
          </div>
        </div>
      </div>

      {/* Main Reports Segment Navigation */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Tab Switcher Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/60 gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSubTab('FLIGHTS')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                subTab === 'FLIGHTS'
                  ? 'bg-navy text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              <Plane className="w-3.5 h-3.5" />
              Flight-Wise Revenue & Occupancy
            </button>
            <button
              onClick={() => setSubTab('CUSTOMERS')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                subTab === 'CUSTOMERS'
                  ? 'bg-navy text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Customer & Passenger Manifest
            </button>
          </div>

          {/* Quick Export Button */}
          <div>
            {subTab === 'FLIGHTS' ? (
              <button
                onClick={handleExportFlightsCSV}
                disabled={exportingFlightCSV}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-2xs transition cursor-pointer disabled:opacity-50"
              >
                <Download className={`w-3.5 h-3.5 ${exportingFlightCSV ? 'animate-bounce' : ''}`} />
                {exportingFlightCSV ? 'Exporting...' : 'Export Flight CSV'}
              </button>
            ) : (
              <button
                onClick={handleExportCustomersCSV}
                disabled={exportingCustomerCSV}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-2xs transition cursor-pointer disabled:opacity-50"
              >
                <Download className={`w-3.5 h-3.5 ${exportingCustomerCSV ? 'animate-bounce' : ''}`} />
                {exportingCustomerCSV ? 'Exporting...' : 'Export Customer CSV'}
              </button>
            )}
          </div>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* REPORT 1: FLIGHT-WISE REVENUE & OCCUPANCY                        */}
        {/* ---------------------------------------------------------------- */}
        {subTab === 'FLIGHTS' && (
          <div className="p-6 space-y-6">
            {/* View Mode & Filter Controls */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Departure Mode vs Flight Summary toggle */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl w-fit">
                <button
                  onClick={() => setFlightView('instances')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    flightView === 'instances'
                      ? 'bg-white text-navy shadow-2xs'
                      : 'text-slate-500 hover:text-navy'
                  }`}
                >
                  Individual Departures
                </button>
                <button
                  onClick={() => setFlightView('aggregated')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    flightView === 'aggregated'
                      ? 'bg-white text-navy shadow-2xs'
                      : 'text-slate-500 hover:text-navy'
                  }`}
                >
                  Flight-Level Aggregation
                </button>
              </div>

              {/* Filters inline */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Search Flight Number */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search flight (e.g. SK-101)..."
                    value={flightFilters.flightNumber}
                    onChange={(e) => setFlightFilters({ ...flightFilters, flightNumber: e.target.value })}
                    className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-navy focus:outline-none focus:border-skyblue w-48"
                  />
                </div>

                {/* Date range */}
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
                  <span className="text-[11px] text-slate-400 font-semibold">Dates:</span>
                  <input
                    type="date"
                    value={flightFilters.startDate}
                    onChange={(e) => setFlightFilters({ ...flightFilters, startDate: e.target.value })}
                    className="bg-transparent text-xs text-navy focus:outline-none cursor-pointer"
                  />
                  <span className="text-slate-300">to</span>
                  <input
                    type="date"
                    value={flightFilters.endDate}
                    onChange={(e) => setFlightFilters({ ...flightFilters, endDate: e.target.value })}
                    className="bg-transparent text-xs text-navy focus:outline-none cursor-pointer"
                  />
                </div>

                {/* Reset Filters */}
                {(flightFilters.flightNumber || flightFilters.startDate || flightFilters.endDate) && (
                  <button
                    onClick={() =>
                      setFlightFilters({
                        flightNumber: '',
                        originAirport: '',
                        destinationAirport: '',
                        startDate: '',
                        endDate: '',
                        bookingStatus: 'ALL',
                        paymentStatus: 'ALL',
                        sortBy: 'departureDate',
                        sortOrder: 'desc'
                      })
                    }
                    className="text-xs text-slate-500 hover:text-rose-600 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" /> Clear
                  </button>
                )}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-100">
              <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead>
                  <tr className="bg-slate-50/80 text-[11px] font-black uppercase text-slate-500 tracking-wider border-b border-slate-100">
                    <th
                      onClick={() => handleSortFlights('flightNumber')}
                      className="py-3.5 px-4 cursor-pointer hover:text-navy"
                    >
                      <div className="flex items-center gap-1">
                        Flight <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th className="py-3.5 px-4">Route</th>
                    {flightView === 'instances' ? (
                      <th
                        onClick={() => handleSortFlights('departureDate')}
                        className="py-3.5 px-4 cursor-pointer hover:text-navy"
                      >
                        <div className="flex items-center gap-1">
                          Departure <ArrowUpDown className="w-3 h-3 text-slate-400" />
                        </div>
                      </th>
                    ) : (
                      <th className="py-3.5 px-4">Departures</th>
                    )}
                    <th className="py-3.5 px-4">Aircraft</th>
                    <th className="py-3.5 px-4">Capacity / Booked</th>
                    <th
                      onClick={() => handleSortFlights('occupancy')}
                      className="py-3.5 px-4 cursor-pointer hover:text-navy"
                    >
                      <div className="flex items-center gap-1">
                        Occupancy % <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th className="py-3.5 px-4">Bookings</th>
                    <th
                      onClick={() => handleSortFlights('grossBookingValue')}
                      className="py-3.5 px-4 cursor-pointer hover:text-navy text-right"
                    >
                      <div className="flex items-center justify-end gap-1">
                        Gross (₹) <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th className="py-3.5 px-4 text-right">Refunds (₹)</th>
                    <th
                      onClick={() => handleSortFlights('netCollectedRevenue')}
                      className="py-3.5 px-4 cursor-pointer hover:text-navy text-right"
                    >
                      <div className="flex items-center justify-end gap-1">
                        Net Revenue (₹) <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {loadingFlights ? (
                    <tr>
                      <td colSpan="10" className="py-12 text-center text-slate-400">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-skyblue" />
                        Loading flight revenue records from MongoDB...
                      </td>
                    </tr>
                  ) : flightData.length === 0 ? (
                    <tr>
                      <td colSpan="10" className="py-12 text-center text-slate-400">
                        No flight records matched the criteria.
                      </td>
                    </tr>
                  ) : (
                    flightData.map((row) => (
                      <tr key={row.id || row.flightNumber} className="hover:bg-slate-50/50 transition">
                        {/* Flight Number & Name */}
                        <td className="py-3.5 px-4">
                          <span className="font-mono font-bold text-navy bg-slate-100 px-2 py-0.5 rounded text-xs">
                            {row.flightNumber}
                          </span>
                          <div className="text-[11px] text-slate-400 font-medium mt-0.5">
                            {row.flightName}
                          </div>
                        </td>

                        {/* Route */}
                        <td className="py-3.5 px-4 font-semibold text-slate-700">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-navy font-bold">{row.origin?.code}</span>
                            <span className="text-slate-300">→</span>
                            <span className="font-mono text-navy font-bold">{row.destination?.code}</span>
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {row.origin?.city} to {row.destination?.city}
                          </div>
                        </td>

                        {/* Departure Date/Time OR Total Departures */}
                        {flightView === 'instances' ? (
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-700">{formatDate(row.departureDate)}</div>
                            <div className="text-[11px] text-slate-400 font-mono">{row.departureTime}</div>
                          </td>
                        ) : (
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-navy">{row.totalDepartures}</span>
                            <span className="text-[11px] text-slate-400 ml-1">departures</span>
                          </td>
                        )}

                        {/* Aircraft */}
                        <td className="py-3.5 px-4 text-slate-600 max-w-[150px] truncate" title={row.aircraft}>
                          {row.aircraft}
                        </td>

                        {/* Capacity & Booked */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-navy">
                            {row.seatsBooked} <span className="text-slate-400 font-normal">/ {row.totalSeatCapacity}</span>
                          </div>
                          <div className="text-[10px] text-slate-400">{row.seatsAvailable} seats available</div>
                        </td>

                        {/* Occupancy with visual meter */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  row.occupancy >= 70
                                    ? 'bg-emerald-500'
                                    : row.occupancy >= 40
                                    ? 'bg-skyblue'
                                    : 'bg-amber-400'
                                }`}
                                style={{ width: `${Math.min(100, Math.max(row.occupancy, 2))}%` }}
                              />
                            </div>
                            <span className="font-bold text-navy">{row.occupancy}%</span>
                          </div>
                        </td>

                        {/* Bookings */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-navy">{row.totalBookings}</div>
                          <div className="text-[10px] text-emerald-600 font-medium">
                            {row.confirmedBookings} confirmed
                            {row.cancelledBookings > 0 && (
                              <span className="text-rose-500 ml-1">• {row.cancelledBookings} cancelled</span>
                            )}
                          </div>
                        </td>

                        {/* Gross Booking Value */}
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-700">
                          {formatINR(row.grossBookingValue)}
                        </td>

                        {/* Refunds */}
                        <td className="py-3.5 px-4 text-right font-mono text-purple-700">
                          {row.refunds > 0 ? formatINR(row.refunds) : '₹0'}
                        </td>

                        {/* Net Revenue */}
                        <td className="py-3.5 px-4 text-right font-mono font-black text-emerald-600 text-sm">
                          {formatINR(row.netCollectedRevenue)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {flightPagination.total > flightPagination.limit && (
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-slate-500">
                  Showing {(flightPagination.page - 1) * flightPagination.limit + 1} to{' '}
                  {Math.min(flightPagination.page * flightPagination.limit, flightPagination.total)} of{' '}
                  {flightPagination.total} records
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    disabled={flightPagination.page <= 1}
                    onClick={() => fetchFlightRevenue(flightPagination.page - 1)}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-bold px-2 text-navy">
                    Page {flightPagination.page} of {flightPagination.pages}
                  </span>
                  <button
                    disabled={flightPagination.page >= flightPagination.pages}
                    onClick={() => fetchFlightRevenue(flightPagination.page + 1)}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* REPORT 2: CUSTOMER & PASSENGER MANIFEST WITH PRIVACY MASKING     */}
        {/* ---------------------------------------------------------------- */}
        {subTab === 'CUSTOMERS' && (
          <div className="p-6 space-y-6">
            {/* Search & Filters */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                {/* Global Search */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by PNR, customer name, email..."
                    value={customerFilters.search}
                    onChange={(e) => setCustomerFilters({ ...customerFilters, search: e.target.value })}
                    className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-navy focus:outline-none focus:border-skyblue w-64"
                  />
                </div>

                {/* Booking Status Filter */}
                <select
                  value={customerFilters.bookingStatus}
                  onChange={(e) => setCustomerFilters({ ...customerFilters, bookingStatus: e.target.value })}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-navy focus:outline-none focus:border-skyblue cursor-pointer font-medium"
                >
                  <option value="ALL">All Booking Statuses</option>
                  <option value="CONFIRMED">CONFIRMED</option>
                  <option value="CANCELLED">CANCELLED</option>
                  <option value="PARTIALLY_CANCELLED">PARTIALLY_CANCELLED</option>
                </select>

                {/* Payment Status Filter */}
                <select
                  value={customerFilters.paymentStatus}
                  onChange={(e) => setCustomerFilters({ ...customerFilters, paymentStatus: e.target.value })}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-navy focus:outline-none focus:border-skyblue cursor-pointer font-medium"
                >
                  <option value="ALL">All Payment Statuses</option>
                  <option value="PAID">PAID</option>
                  <option value="REFUNDED">REFUNDED</option>
                  <option value="PENDING">PENDING</option>
                  <option value="FAILED">FAILED</option>
                </select>

                {/* Reset */}
                {(customerFilters.search || customerFilters.bookingStatus !== 'ALL' || customerFilters.paymentStatus !== 'ALL') && (
                  <button
                    onClick={() =>
                      setCustomerFilters({
                        search: '',
                        flightNumber: '',
                        bookingStatus: 'ALL',
                        paymentStatus: 'ALL',
                        startDate: '',
                        endDate: '',
                        sortBy: 'createdAt',
                        sortOrder: 'desc'
                      })
                    }
                    className="text-xs text-slate-500 hover:text-rose-600 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" /> Clear
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg">
                  {customerPagination.total} Total Bookings
                </span>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-100">
              <table className="w-full text-left border-collapse min-w-[1050px]">
                <thead>
                  <tr className="bg-slate-50/80 text-[11px] font-black uppercase text-slate-500 tracking-wider border-b border-slate-100">
                    <th className="py-3.5 px-4">PNR / Booking Date</th>
                    <th className="py-3.5 px-4">Account Holder (Customer)</th>
                    <th className="py-3.5 px-4">Flight & Corridor</th>
                    <th className="py-3.5 px-4">Passenger Manifest & Aadhaar</th>
                    <th className="py-3.5 px-4">Allocated Seats</th>
                    <th className="py-3.5 px-4">Status & Payment</th>
                    <th
                      onClick={() => handleSortCustomers('totalAmount')}
                      className="py-3.5 px-4 cursor-pointer hover:text-navy text-right"
                    >
                      <div className="flex items-center justify-end gap-1">
                        Amount (₹) <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th className="py-3.5 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {loadingCustomers ? (
                    <tr>
                      <td colSpan="8" className="py-12 text-center text-slate-400">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-skyblue" />
                        Loading customer booking manifests from MongoDB...
                      </td>
                    </tr>
                  ) : customerData.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="py-12 text-center text-slate-400">
                        No customer bookings found.
                      </td>
                    </tr>
                  ) : (
                    customerData.map((row) => (
                      <tr key={row.bookingId} className="hover:bg-slate-50/50 transition">
                        {/* PNR & Date */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-black text-navy text-xs tracking-tight">
                              {row.pnr}
                            </span>
                            <button
                              onClick={() => copyToClipboard(row.pnr, row.bookingId)}
                              className="text-slate-400 hover:text-navy cursor-pointer"
                              title="Copy PNR"
                            >
                              {copiedPNR === row.bookingId ? (
                                <Check className="w-3 h-3 text-emerald-500" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {formatDate(row.bookingDate)}
                          </div>
                        </td>

                        {/* Customer Account Holder */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-navy">{row.customer?.name}</div>
                          <div className="text-[11px] text-slate-500">{row.customer?.email}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            Phone: {row.customer?.phone}
                          </div>
                        </td>

                        {/* Flight & Corridor */}
                        <td className="py-3.5 px-4">
                          <div className="font-mono font-bold text-navy flex items-center gap-1">
                            <span>{row.flight?.flightNumber}</span>
                            <span className="text-[11px] text-slate-400 font-normal">
                              ({row.flight?.originCode} → {row.flight?.destinationCode})
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-600 font-medium">
                            {formatDate(row.flight?.departureDate)} at {row.flight?.departureTime}
                          </div>
                        </td>

                        {/* Passenger Manifest with Privacy Masked Aadhaar */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-navy/5 text-navy">
                              {row.passengerCount} {row.passengerCount === 1 ? 'Passenger' : 'Passengers'}
                            </span>
                          </div>
                          <div className="text-[11px] font-medium text-slate-700 max-w-xs line-clamp-1">
                            {row.passengerNames}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                            <ShieldCheck className="w-3 h-3 text-emerald-600 inline" />
                            Aadhaar: {row.passengers?.[0]?.maskedAadhaar || 'XXXX-XXXX-****'}
                            {row.passengers?.length > 1 && ` (+${row.passengers.length - 1} more)`}
                          </div>
                        </td>

                        {/* Allocated Seats */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-1">
                            {row.seatNumbers ? (
                              row.seatNumbers.split(',').map((seat, idx) => (
                                <span
                                  key={idx}
                                  className="font-mono font-bold text-[11px] bg-slate-100 text-navy px-1.5 py-0.5 rounded border border-slate-200"
                                >
                                  {seat.trim()}
                                </span>
                              ))
                            ) : (
                              <span className="text-slate-400 text-xs">Unassigned</span>
                            )}
                          </div>
                        </td>

                        {/* Status Badges & Safe Payment Details */}
                        <td className="py-3.5 px-4 space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                                row.bookingStatus === 'CONFIRMED'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                            >
                              {row.bookingStatus}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                                row.paymentStatus === 'PAID'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : row.paymentStatus === 'REFUNDED'
                                  ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {row.paymentStatus}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                            <CreditCard className="w-3 h-3 text-slate-400" />
                            {row.paymentDetails?.safePaymentDetails || 'Safe Payment'}
                          </div>
                        </td>

                        {/* Amount */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="font-mono font-black text-navy text-sm">
                            {formatINR(row.financials?.totalAmount)}
                          </div>
                          {row.financials?.refundAmount > 0 && (
                            <div className="text-[10px] text-purple-600 font-semibold font-mono">
                              Refunded: {formatINR(row.financials.refundAmount)}
                            </div>
                          )}
                        </td>

                        {/* Action View Manifest */}
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => {
                              setSelectedBooking(row);
                              setManifestModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-navy transition cursor-pointer"
                            title="View Full Passenger Manifest & Receipt"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {customerPagination.total > customerPagination.limit && (
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-slate-500">
                  Showing {(customerPagination.page - 1) * customerPagination.limit + 1} to{' '}
                  {Math.min(customerPagination.page * customerPagination.limit, customerPagination.total)} of{' '}
                  {customerPagination.total} customer bookings
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    disabled={customerPagination.page <= 1}
                    onClick={() => fetchCustomerBookings(customerPagination.page - 1)}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-bold px-2 text-navy">
                    Page {customerPagination.page} of {customerPagination.pages}
                  </span>
                  <button
                    disabled={customerPagination.page >= customerPagination.pages}
                    onClick={() => fetchCustomerBookings(customerPagination.page + 1)}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Manifest & Financial Breakdown Modal */}
      {manifestModalOpen && selectedBooking && (
        <Modal
          isOpen={manifestModalOpen}
          onClose={() => setManifestModalOpen(false)}
          title={`Booking Manifest • ${selectedBooking.pnr}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-6">
            {/* Header Flight Details */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Flight Service</span>
                <div className="text-base font-black text-navy font-mono">
                  {selectedBooking.flight?.flightNumber} • {selectedBooking.flight?.flightName}
                </div>
                <div className="text-xs text-slate-600 mt-0.5">
                  {selectedBooking.flight?.originCity} ({selectedBooking.flight?.originCode}) →{' '}
                  {selectedBooking.flight?.destinationCity} ({selectedBooking.flight?.destinationCode})
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Departure</span>
                <div className="text-xs font-bold text-navy">{formatDate(selectedBooking.flight?.departureDate)}</div>
                <div className="text-xs font-mono text-slate-500">{selectedBooking.flight?.departureTime}</div>
              </div>
            </div>

            {/* Passenger Manifest Cards */}
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
                Passenger Manifest ({selectedBooking.passengers?.length || 0})
              </h4>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {selectedBooking.passengers?.map((p, idx) => (
                  <div
                    key={p.id || idx}
                    className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-bold text-navy flex items-center gap-2">
                        {p.name}
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-semibold">
                          {p.type}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="font-mono">Aadhaar: {p.maskedAadhaar}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Seat</span>
                      <span className="font-mono font-black text-xs px-2 py-0.5 bg-skyblue/10 text-skyblue rounded border border-skyblue/20">
                        {p.seatNumber || 'Unassigned'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Reconciliation Breakdown */}
            <div className="border-t border-slate-200 pt-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
                Financial Reconciliation Breakdown
              </h4>
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Base Airfare Subtotal</span>
                  <span className="font-mono font-bold">{formatINR(selectedBooking.financials?.subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Taxes (DGCA & GST 12%)</span>
                  <span className="font-mono">{formatINR(selectedBooking.financials?.taxAmount)}</span>
                </div>
                {selectedBooking.financials?.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Promotional Discount Applied</span>
                    <span className="font-mono font-bold">-{formatINR(selectedBooking.financials?.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-navy font-black border-t border-slate-200 pt-2 text-sm">
                  <span>Total Amount Paid</span>
                  <span className="font-mono">{formatINR(selectedBooking.financials?.totalAmount)}</span>
                </div>
                {selectedBooking.financials?.refundAmount > 0 && (
                  <div className="flex justify-between text-purple-700 font-bold border-t border-purple-200 pt-1 text-xs">
                    <span>Total Refunded to Source</span>
                    <span className="font-mono">{formatINR(selectedBooking.financials?.refundAmount)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Payment & Security Metadata */}
            <div className="grid grid-cols-2 gap-3 text-[11px] bg-slate-100 p-3 rounded-xl border border-slate-200/60 font-mono">
              <div>
                <span className="text-slate-400 block font-sans">Payment Method</span>
                <span className="font-bold text-navy">{selectedBooking.paymentDetails?.safePaymentDetails}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-sans">Transaction Reference</span>
                <span className="font-bold text-navy truncate block" title={selectedBooking.paymentDetails?.transactionId}>
                  {selectedBooking.paymentDetails?.transactionId}
                </span>
              </div>
            </div>

            {/* Footer Close */}
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setManifestModalOpen(false)}
                className="px-5 py-2 bg-navy text-white text-xs font-bold rounded-xl hover:bg-navy-800 transition cursor-pointer"
              >
                Close Manifest
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default RevenueAnalyticsTab;
