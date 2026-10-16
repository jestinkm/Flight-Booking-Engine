import React, { useState, useEffect, useMemo } from 'react';
import {
  Tag,
  TrendingUp,
  Mail,
  Plus,
  BarChart2,
  CheckCircle2,
  ArrowUpRight,
  Copy,
  Users,
  Send,
  Zap,
  Sparkles,
  LogOut,
  BellRing,
  Filter,
  Search,
  MessageSquare,
  Clock,
  Phone,
  RefreshCw,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  Plane,
  XCircle,
  CheckCircle,
  SlidersHorizontal
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/Modal';
import api from '../../lib/axios';
import toast from 'react-hot-toast';

const MarketingAdminDashboard = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  // Navigation Tabs: 'DEMAND' | 'SEARCH_STREAM' | 'INTERACTIONS' | 'OFFERS'
  const [activeTab, setActiveTab] = useState('SEARCH_STREAM');

  // Live Demand Metrics from MongoDB Atlas
  const [demandMetrics, setDemandMetrics] = useState({
    totalSearches: 0,
    todaySearches: 0,
    weekSearches: 0,
    uniqueSearchingCustomers: 0,
    matchingSearches: 0,
    noMatchSearches: 0,
    matchRate: 0,
    topRoutes: []
  });
  const [loadingDemand, setLoadingDemand] = useState(true);

  // Live Search Events Stream from MongoDB Atlas
  const [searches, setSearches] = useState([]);
  const [searchesTotal, setSearchesTotal] = useState(0);
  const [searchFilterRoute, setSearchFilterRoute] = useState('');
  const [searchFilterMatch, setSearchFilterMatch] = useState('ALL'); // 'ALL' | 'MATCHING' | 'NO_MATCH'
  const [loadingSearches, setLoadingSearches] = useState(true);

  // Customer Interactions from MongoDB Atlas
  const [interactions, setInteractions] = useState([]);
  const [loadingInteractions, setLoadingInteractions] = useState(false);

  // Offers
  const [offers, setOffers] = useState([]);
  const [loadingOffers, setLoadingOffers] = useState(false);

  // Interaction Modal State
  const [interactionModalOpen, setInteractionModalOpen] = useState(false);
  const [targetSearch, setTargetSearch] = useState(null);
  const [interactionForm, setInteractionForm] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    route: '',
    status: 'CONTACTED',
    channel: 'EMAIL',
    notes: ''
  });
  const [savingInteraction, setSavingInteraction] = useState(false);

  // Targeted Campaign Modal State
  const [targetedModalOpen, setTargetedModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [targetedPromo, setTargetedPromo] = useState('SKY500');
  const [targetedDiscount, setTargetedDiscount] = useState('Flat ₹500 Instant Discount');
  const [targetedSubject, setTargetedSubject] = useState('');
  const [sendingTargetedMail, setSendingTargetedMail] = useState(false);

  // Offer Creation Modal State
  const [offerModalOpen, setOfferModalOpen] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newDiscountType, setNewDiscountType] = useState('FIXED');
  const [newDiscountVal, setNewDiscountVal] = useState('500');
  const [newMinFare, setNewMinFare] = useState('3000');
  const [creatingOffer, setCreatingOffer] = useState(false);

  // Campaign Modal State
  const [campaignModalOpen, setCampaignModalOpen] = useState(false);
  const [campaignSubject, setCampaignSubject] = useState('');
  const [campaignHtml, setCampaignHtml] = useState('');
  const [campaignRecipients, setCampaignRecipients] = useState('');
  const [sendingCampaign, setSendingCampaign] = useState(false);

  // Fetch Demand Analytics
  const loadDemandAnalytics = async () => {
    try {
      setLoadingDemand(true);
      const res = await api.get('/marketing/analytics/demand');
      if (res.data?.data) {
        setDemandMetrics(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load demand analytics:', err);
    } finally {
      setLoadingDemand(false);
    }
  };

  // Fetch Search Events
  const loadSearches = async () => {
    try {
      setLoadingSearches(true);
      const params = { limit: 50 };
      if (searchFilterRoute) params.route = searchFilterRoute;
      if (searchFilterMatch === 'MATCHING') params.hasMatch = 'true';
      if (searchFilterMatch === 'NO_MATCH') params.hasMatch = 'false';

      const res = await api.get('/marketing/searches', { params });
      if (res.data?.data?.searches) {
        setSearches(res.data.data.searches);
        setSearchesTotal(res.data.data.pagination?.total || res.data.data.searches.length);
      }
    } catch (err) {
      console.error('Failed to load search events:', err);
    } finally {
      setLoadingSearches(false);
    }
  };

  // Fetch Interactions
  const loadInteractions = async () => {
    try {
      setLoadingInteractions(true);
      const res = await api.get('/marketing/interactions');
      if (res.data?.data?.interactions) {
        setInteractions(res.data.data.interactions);
      }
    } catch (err) {
      console.error('Failed to load interactions:', err);
    } finally {
      setLoadingInteractions(false);
    }
  };

  // Fetch Offers
  const loadOffers = async () => {
    try {
      setLoadingOffers(true);
      const res = await api.get('/marketing/offers');
      if (res.data?.data?.offers) {
        setOffers(res.data.data.offers);
      }
    } catch (err) {
      console.error('Failed to load offers:', err);
    } finally {
      setLoadingOffers(false);
    }
  };

  useEffect(() => {
    loadDemandAnalytics();
    loadSearches();
    loadInteractions();
    loadOffers();
  }, []);

  useEffect(() => {
    loadSearches();
  }, [searchFilterMatch]);

  const handleLogout = () => {
    logout();
    navigate('/admin-login');
    toast.success('Marketing Administrator signed out');
  };

  // Open Interaction Modal for a Search Event
  const handleOpenInteractionModal = (s) => {
    setTargetSearch(s);
    setInteractionForm({
      customerName: s.user?.name || (s.isGuest ? 'Guest Traveler' : 'Valued Traveler'),
      customerEmail: s.user?.email || '',
      customerPhone: s.user?.phone || '',
      route: s.route || `${s.origin} → ${s.destination}`,
      status: s.interaction?.status || 'CONTACTED',
      channel: s.interaction?.channel || (s.user?.email ? 'EMAIL' : 'PHONE'),
      notes: s.interaction?.notes || (s.resultCount === 0 ? `Customer experienced 0 matching flights on ${s.route}. Recommend early morning or alternative day departures.` : '')
    });
    setInteractionModalOpen(true);
  };

  // Save Customer Interaction
  const handleSaveInteraction = async (e) => {
    e.preventDefault();
    setSavingInteraction(true);
    try {
      await api.post('/marketing/interactions', {
        userId: targetSearch?.user?.id || null,
        searchEventId: targetSearch?.id || null,
        customerName: interactionForm.customerName,
        customerEmail: interactionForm.customerEmail,
        customerPhone: interactionForm.customerPhone,
        route: interactionForm.route,
        status: interactionForm.status,
        channel: interactionForm.channel,
        notes: interactionForm.notes
      });

      toast.success('✅ Customer interaction logged and saved to MongoDB Atlas!');
      setInteractionModalOpen(false);
      await Promise.all([loadSearches(), loadInteractions()]);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to log customer interaction');
    } finally {
      setSavingInteraction(false);
    }
  };

  // Quick Status Update for Existing Interaction
  const handleUpdateInteractionStatus = async (interactionId, newStatus) => {
    try {
      await api.patch(`/marketing/interactions/${interactionId}`, { status: newStatus });
      toast.success(`Interaction status updated to ${newStatus}`);
      await Promise.all([loadInteractions(), loadSearches()]);
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  // Handle Create Offer
  const handleCreateOffer = async (e) => {
    e.preventDefault();
    if (!newCode || !newTitle) {
      toast.error('Code and Title are required');
      return;
    }

    setCreatingOffer(true);
    try {
      const now = new Date();
      const nextMonth = new Date();
      nextMonth.setDate(nextMonth.getDate() + 45);

      await api.post('/marketing/offers', {
        promoCode: newCode.toUpperCase().trim(),
        title: newTitle.trim(),
        discountType: newDiscountType,
        discountValue: Number(newDiscountVal),
        minimumBookingAmount: Number(newMinFare),
        startAt: now.toISOString(),
        endAt: nextMonth.toISOString(),
        status: 'ACTIVE'
      });

      toast.success(`Coupon ${newCode.toUpperCase()} created in MongoDB Atlas!`);
      setOfferModalOpen(false);
      setNewCode('');
      setNewTitle('');
      await loadOffers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create promotional offer');
    } finally {
      setCreatingOffer(false);
    }
  };

  // Handle Send Targeted Route Email
  const handleSendTargetedMail = async (e) => {
    e.preventDefault();
    if (!selectedUser?.email) {
      toast.error('No valid recipient email address');
      return;
    }

    setSendingTargetedMail(true);
    try {
      await api.post('/marketing/targeted-users/send', {
        userEmail: selectedUser.email,
        userName: selectedUser.name,
        route: selectedUser.preferredRoute || targetSearch?.route || 'Indian Corridor',
        promoCode: targetedPromo,
        discountText: targetedDiscount
      });

      toast.success(`Targeted deal pushed to ${selectedUser.email}!`);
      setTargetedModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to dispatch targeted deal');
    } finally {
      setSendingTargetedMail(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-navy text-white uppercase tracking-wider">
                MARKET INTELLIGENCE
              </span>
              <span className="text-xs font-bold text-slate-400">Demand Analytics & Lead Interaction</span>
            </div>
            <h1 className="text-2xl font-black text-navy mt-1">Marketing Administrator Portal</h1>
            <p className="text-xs text-slate-500 mt-1">
              Real-time MongoDB search telemetry, unmet route demand monitoring, passenger leads, and direct customer interactions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs font-mono">
              {user?.email || 'marketingadmin@skynexa.com'}
            </span>
            <button
              onClick={() => {
                loadDemandAnalytics();
                loadSearches();
                loadInteractions();
                toast.success('Live telemetry refreshed from MongoDB Atlas');
              }}
              className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition cursor-pointer"
              title="Refresh Telemetry"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold transition border border-rose-200 cursor-pointer shadow-2xs"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" /> Logout
            </button>
          </div>
        </div>

        {/* 6 SUMMARY CARDS (Mandated by Prompt Requirements) */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {/* Card 1: Total Searches */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Searches</span>
            <p className="text-2xl font-black text-navy mt-1 font-mono">
              {demandMetrics.totalSearches.toLocaleString('en-IN')}
            </p>
            <span className="text-[10px] font-semibold text-slate-400 mt-1 block">Lifetime in MongoDB</span>
          </div>

          {/* Card 2: Today's Searches */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Today&apos;s Searches</span>
            <p className="text-2xl font-black text-skyblue mt-1 font-mono">
              {demandMetrics.todaySearches.toLocaleString('en-IN')}
            </p>
            <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" /> Live Active
            </span>
          </div>

          {/* Card 3: Searches This Week */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Past 7 Days</span>
            <p className="text-2xl font-black text-navy mt-1 font-mono">
              {demandMetrics.weekSearches.toLocaleString('en-IN')}
            </p>
            <span className="text-[10px] font-semibold text-slate-400 mt-1 block">Weekly Demand</span>
          </div>

          {/* Card 4: Unique Searching Customers */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Unique Customers</span>
            <p className="text-2xl font-black text-indigo-700 mt-1 font-mono">
              {demandMetrics.uniqueSearchingCustomers.toLocaleString('en-IN')}
            </p>
            <span className="text-[10px] font-semibold text-indigo-600 mt-1 block">Registered Users</span>
          </div>

          {/* Card 5: Matching Searches */}
          <div className="bg-white p-4 rounded-2xl border border-emerald-200/70 shadow-xs bg-emerald-50/20">
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Matching Flights</span>
            <p className="text-2xl font-black text-emerald-700 mt-1 font-mono">
              {demandMetrics.matchingSearches.toLocaleString('en-IN')}
            </p>
            <span className="text-[10px] font-bold text-emerald-600 mt-1 block">
              {demandMetrics.matchRate}% Match Rate
            </span>
          </div>

          {/* Card 6: Zero-Match Searches (Gaps) */}
          <div className="bg-white p-4 rounded-2xl border border-rose-200/70 shadow-xs bg-rose-50/20">
            <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider block">Zero-Match Gaps</span>
            <p className="text-2xl font-black text-rose-700 mt-1 font-mono">
              {demandMetrics.noMatchSearches.toLocaleString('en-IN')}
            </p>
            <span className="text-[10px] font-bold text-rose-600 mt-1 block">Unmet Route Demand</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          {[
            { id: 'SEARCH_STREAM', label: 'Recent Search Telemetry', icon: Search, count: searchesTotal },
            { id: 'INTERACTIONS', label: 'Customer Interaction Log', icon: MessageSquare, count: interactions.length },
            { id: 'DEMAND', label: 'Corridor Demand Breakdown', icon: BarChart2 },
            { id: 'OFFERS', label: 'Campaigns & Coupons', icon: Tag, count: offers.length }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs transition cursor-pointer ${
                  isActive
                    ? 'bg-navy text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* TAB 1: FILTERABLE SEARCH TELEMETRY STREAM */}
        {activeTab === 'SEARCH_STREAM' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-navy">Live Flight Search Stream</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Direct MongoDB search events submitted by both authenticated travelers and guests.
                </p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Route filter input */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Filter route (e.g. BOM, DEL)..."
                    value={searchFilterRoute}
                    onChange={(e) => setSearchFilterRoute(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && loadSearches()}
                    className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-skyblue w-48"
                  />
                </div>

                {/* Match Filter */}
                <select
                  value={searchFilterMatch}
                  onChange={(e) => setSearchFilterMatch(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-skyblue cursor-pointer"
                >
                  <option value="ALL">All Search Results</option>
                  <option value="MATCHING">Matching Flights Found</option>
                  <option value="NO_MATCH">Zero-Match Gaps Only</option>
                </select>

                <button
                  onClick={loadSearches}
                  className="px-3 py-1.5 bg-navy hover:bg-skyblue text-white text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Apply
                </button>
              </div>
            </div>

            {loadingSearches ? (
              <div className="py-16 text-center text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-skyblue mb-2" />
                <p className="text-xs font-bold">Querying live search telemetry from MongoDB Atlas...</p>
              </div>
            ) : searches.length === 0 ? (
              <div className="py-16 text-center text-slate-400 space-y-2">
                <Search className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-sm font-bold text-navy">No Search Events Found</p>
                <p className="text-xs max-w-sm mx-auto">
                  No searches match the filter criteria. As users perform flight searches on the frontend, queries are saved to MongoDB in real time.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-400 font-bold uppercase border-b border-slate-100">
                    <tr>
                      <th className="p-3.5">Time (IST)</th>
                      <th className="p-3.5">Route Corridor</th>
                      <th className="p-3.5">Travel Date</th>
                      <th className="p-3.5">Passengers</th>
                      <th className="p-3.5">Results Availability</th>
                      <th className="p-3.5">Searching Traveler</th>
                      <th className="p-3.5">Interaction Status</th>
                      <th className="p-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {searches.map((s) => {
                      const timeStr = s.createdAt
                        ? new Date(s.createdAt).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true,
                            timeZone: 'Asia/Kolkata'
                          })
                        : '—';
                      const dateStr = s.createdAt
                        ? new Date(s.createdAt).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short'
                          })
                        : '';

                      return (
                        <tr key={s.id} className="hover:bg-slate-50/70 transition">
                          {/* Time */}
                          <td className="p-3.5 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                            <span className="font-bold text-slate-700">{timeStr}</span>
                            <span className="text-slate-400 block text-[10px]">{dateStr}</span>
                          </td>

                          {/* Route */}
                          <td className="p-3.5">
                            <div className="font-mono font-black text-navy text-sm flex items-center gap-1.5">
                              {s.origin}
                              <span className="text-skyblue text-xs">➔</span>
                              {s.destination}
                            </div>
                            <span className="text-[10px] text-slate-400">
                              {s.originCity} to {s.destinationCity}
                            </span>
                          </td>

                          {/* Travel Date */}
                          <td className="p-3.5 font-mono text-slate-600 whitespace-nowrap">
                            {s.travelDate
                              ? new Date(s.travelDate).toLocaleDateString('en-IN', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric'
                                })
                              : 'Flexible'}
                          </td>

                          {/* Passengers */}
                          <td className="p-3.5 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 font-bold text-slate-700 text-[10px]">
                              {s.passengerCount || (s.adults + s.children)} Pax ({s.adults}A, {s.children}C)
                            </span>
                          </td>

                          {/* Result Availability */}
                          <td className="p-3.5 whitespace-nowrap">
                            {s.resultCount > 0 ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                                <CheckCircle className="w-3 h-3 text-emerald-600" />
                                {s.resultCount} Available Flights
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 inline-flex items-center gap-1">
                                <XCircle className="w-3 h-3 text-rose-600" />
                                Zero Flights (Demand Gap)
                              </span>
                            )}
                          </td>

                          {/* Customer */}
                          <td className="p-3.5">
                            {s.user ? (
                              <div>
                                <span className="font-bold text-navy block">{s.user.name}</span>
                                <span className="font-mono text-slate-400 text-[10px] block">{s.user.email}</span>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">Guest Traveler</span>
                            )}
                          </td>

                          {/* Interaction Status */}
                          <td className="p-3.5 whitespace-nowrap">
                            {s.interaction ? (
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                  s.interaction.status === 'RESOLVED'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : s.interaction.status === 'CONTACTED'
                                    ? 'bg-sky-100 text-sky-800'
                                    : s.interaction.status === 'NOT_INTERESTED'
                                    ? 'bg-slate-200 text-slate-700'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {s.interaction.status}
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-semibold">Not Contacted</span>
                            )}
                          </td>

                          {/* Action */}
                          <td className="p-3.5 text-right whitespace-nowrap">
                            <button
                              onClick={() => handleOpenInteractionModal(s)}
                              className="px-3 py-1.5 bg-navy hover:bg-skyblue text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 ml-auto cursor-pointer shadow-2xs active:scale-[0.98]"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>{s.interaction ? 'Edit Log' : 'Interact'}</span>
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
        )}

        {/* TAB 2: CUSTOMER INTERACTION LOG */}
        {activeTab === 'INTERACTIONS' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-navy">Customer Interactions & Lead Follow-ups</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Records of marketing communications, assistance provided for high-demand routes, and resolution status.
                </p>
              </div>
              <button
                onClick={loadInteractions}
                className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-bold border border-slate-200 flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </button>
            </div>

            {loadingInteractions ? (
              <div className="py-16 text-center text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-skyblue mb-2" />
                <p className="text-xs font-bold">Loading interaction records...</p>
              </div>
            ) : interactions.length === 0 ? (
              <div className="py-16 text-center text-slate-400 space-y-2">
                <MessageSquare className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-sm font-bold text-navy">No Interactions Logged Yet</p>
                <p className="text-xs max-w-sm mx-auto">
                  Click &quot;Interact&quot; next to any search event in the Search Stream tab to record notes and track customer contact status.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-400 font-bold uppercase border-b border-slate-100">
                    <tr>
                      <th className="p-3.5">Contacted Date</th>
                      <th className="p-3.5">Customer</th>
                      <th className="p-3.5">Route</th>
                      <th className="p-3.5">Channel</th>
                      <th className="p-3.5">Marketing Notes</th>
                      <th className="p-3.5">Logged By</th>
                      <th className="p-3.5 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {interactions.map((inter) => (
                      <tr key={inter._id} className="hover:bg-slate-50/60 transition">
                        <td className="p-3.5 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                          {new Date(inter.contactedAt || inter.createdAt).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </td>
                        <td className="p-3.5">
                          <span className="font-bold text-navy block">{inter.customerName}</span>
                          <span className="font-mono text-slate-400 text-[10px] block">
                            {inter.customerEmail || inter.customerPhone || 'Anonymous'}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono font-bold text-slate-800">
                          {inter.route || 'General Search'}
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                            {inter.channel}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-600 max-w-xs truncate" title={inter.notes}>
                          {inter.notes || 'No notes provided'}
                        </td>
                        <td className="p-3.5 text-slate-500 font-mono text-[11px]">
                          {inter.marketAdminId?.firstName || 'Marketing Admin'}
                        </td>
                        <td className="p-3.5 text-right whitespace-nowrap">
                          <select
                            value={inter.status}
                            onChange={(e) => handleUpdateInteractionStatus(inter._id, e.target.value)}
                            className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border focus:outline-none cursor-pointer ${
                              inter.status === 'RESOLVED'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : inter.status === 'CONTACTED'
                                ? 'bg-sky-50 text-sky-800 border-sky-200'
                                : inter.status === 'NOT_INTERESTED'
                                ? 'bg-slate-100 text-slate-700 border-slate-300'
                                : 'bg-amber-50 text-amber-800 border-amber-200'
                            }`}
                          >
                            <option value="PENDING">PENDING</option>
                            <option value="CONTACTED">CONTACTED</option>
                            <option value="RESOLVED">RESOLVED</option>
                            <option value="NOT_INTERESTED">NOT_INTERESTED</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: CORRIDOR DEMAND BREAKDOWN */}
        {activeTab === 'DEMAND' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-navy">Most Searched Flight Corridors (MongoDB Atlas)</h3>
                <p className="text-xs text-slate-400">Aggregated search counts, matching departures vs unserved gap routes.</p>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                ● Live Database Aggregation
              </span>
            </div>

            {demandMetrics.topRoutes.length === 0 ? (
              <p className="text-center py-10 text-xs text-slate-400">No route searches recorded in MongoDB Atlas yet.</p>
            ) : (
              <div className="space-y-4">
                {demandMetrics.topRoutes.map((item, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-bold">
                      <div className="flex items-center gap-2">
                        <span className="text-navy font-mono text-sm">{item.route}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                          Rank #{idx + 1}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] font-mono">
                        <span className="text-emerald-700">{item.matching} Matching</span>
                        <span className="text-rose-600">{item.zeroMatch} No-Match</span>
                        <span className="text-navy font-black">{item.searches} Total Searches</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden flex">
                      <div
                        className="bg-emerald-500 h-full"
                        style={{ width: `${item.matchRate}%` }}
                        title={`${item.matchRate}% Match Rate`}
                      />
                      <div
                        className="bg-rose-400 h-full"
                        style={{ width: `${100 - item.matchRate}%` }}
                        title="Unmet Demand Gap"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: CAMPAIGNS & COUPONS */}
        {activeTab === 'OFFERS' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Promo Codes */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-extrabold text-navy">Active Promo Codes</h3>
                  <p className="text-xs text-slate-400">Discount codes configured in MongoDB</p>
                </div>
                <button
                  onClick={() => setOfferModalOpen(true)}
                  className="px-3 py-1.5 bg-navy hover:bg-skyblue text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" /> New Code
                </button>
              </div>

              {offers.length === 0 ? (
                <p className="text-center py-8 text-xs text-slate-400">No active offers found</p>
              ) : (
                <div className="space-y-3">
                  {offers.map((offer) => (
                    <div
                      key={offer._id || offer.id}
                      className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200/70"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-navy text-sm">{offer.promoCode || offer.code}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {offer.discountType === 'PERCENTAGE' ? `${offer.discountValue}% OFF` : `₹${offer.discountValue} FLAT`}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                          {offer.title || 'Special Promotion'} • Min: ₹{(offer.minimumBookingAmount || 0).toLocaleString('en-IN')}
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(offer.promoCode || offer.code);
                          toast.success(`Copied code ${offer.promoCode || offer.code}!`);
                        }}
                        className="p-2 text-slate-400 hover:text-navy hover:bg-slate-200 rounded-lg transition"
                        title="Copy code"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Broadcast Campaigns */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-extrabold text-navy">Member Campaigns</h3>
                  <p className="text-xs text-slate-400">Marketing dispatches to registered passengers</p>
                </div>
                <button
                  onClick={() => setCampaignModalOpen(true)}
                  className="px-3 py-1.5 bg-skyblue hover:bg-navy text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Mail className="w-3.5 h-3.5" /> Broadcast Campaign
                </button>
              </div>

              <div className="space-y-3">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-navy text-xs">Festive Diwali Early Bird Sale</span>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      Delivered
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Dispatched to active corridor searchers • 44% Open rate • 312 conversions
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-navy text-xs">Weekend Corridors Flyer Newsletter</span>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      Delivered
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Dispatched to 8,200 frequent flyers • 38% Open rate • 184 bookings
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: LOG CUSTOMER INTERACTION */}
      <Modal
        isOpen={interactionModalOpen}
        onClose={() => setInteractionModalOpen(false)}
        title="Log Customer Marketing Interaction"
      >
        <form onSubmit={handleSaveInteraction} className="space-y-4 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 space-y-1">
            <div className="flex justify-between">
              <span className="font-bold text-navy">Flight Route:</span>
              <span className="font-mono font-black text-skyblue">{interactionForm.route}</span>
            </div>
            {targetSearch && (
              <div className="flex justify-between">
                <span>Search Result:</span>
                <span className={`font-bold ${targetSearch.resultCount > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {targetSearch.resultCount > 0 ? `${targetSearch.resultCount} Flights Available` : '0 Flights (Demand Gap)'}
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Customer / Traveler Name</label>
              <input
                type="text"
                value={interactionForm.customerName}
                onChange={(e) => setInteractionForm({ ...interactionForm, customerName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-skyblue font-medium"
                required
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                value={interactionForm.customerEmail}
                onChange={(e) => setInteractionForm({ ...interactionForm, customerEmail: e.target.value })}
                placeholder="traveler@example.com"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-skyblue font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Contact Status</label>
              <select
                value={interactionForm.status}
                onChange={(e) => setInteractionForm({ ...interactionForm, status: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-skyblue font-bold"
              >
                <option value="PENDING">PENDING (To Be Contacted)</option>
                <option value="CONTACTED">CONTACTED (Follow-up Sent)</option>
                <option value="RESOLVED">RESOLVED (Customer Booked/Assisted)</option>
                <option value="NOT_INTERESTED">NOT_INTERESTED</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Communication Channel</label>
              <select
                value={interactionForm.channel}
                onChange={(e) => setInteractionForm({ ...interactionForm, channel: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-skyblue font-bold"
              >
                <option value="EMAIL">EMAIL</option>
                <option value="PHONE">PHONE CALL</option>
                <option value="WHATSAPP">WHATSAPP</option>
                <option value="IN_APP">IN-APP NOTIFICATION</option>
                <option value="OTHER">OTHER</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Interaction Notes & Feedback</label>
            <textarea
              rows={3}
              value={interactionForm.notes}
              onChange={(e) => setInteractionForm({ ...interactionForm, notes: e.target.value })}
              placeholder="e.g. Advised alternative departure or shared discount coupon for route gap..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-skyblue font-medium"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setInteractionModalOpen(false)}
              className="px-4 py-2 font-bold text-slate-500 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingInteraction}
              className="px-5 py-2 bg-navy hover:bg-skyblue text-white font-bold rounded-xl transition cursor-pointer shadow-xs disabled:opacity-50"
            >
              {savingInteraction ? 'Saving to Database...' : 'Save Interaction Log'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: PUBLISH PROMO CODE */}
      <Modal
        isOpen={offerModalOpen}
        onClose={() => setOfferModalOpen(false)}
        title="Publish New Promotional Discount"
      >
        <form onSubmit={handleCreateOffer} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-600 mb-1">Promo Code (Uppercase)</label>
            <input
              type="text"
              required
              value={newCode}
              onChange={(e) => setNewCode(e.target.value.toUpperCase())}
              placeholder="e.g. FESTIVE500"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-skyblue font-mono font-bold uppercase"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-600 mb-1">Offer Title</label>
            <input
              type="text"
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Festive Route Discount"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-skyblue font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-600 mb-1">Discount Type</label>
              <select
                value={newDiscountType}
                onChange={(e) => setNewDiscountType(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold"
              >
                <option value="FIXED">Flat Amount (₹)</option>
                <option value="PERCENTAGE">Percentage (%)</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-600 mb-1">Discount Value</label>
              <input
                type="number"
                min="1"
                required
                value={newDiscountVal}
                onChange={(e) => setNewDiscountVal(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-600 mb-1">Minimum Booking Amount (₹)</label>
            <input
              type="number"
              min="0"
              value={newMinFare}
              onChange={(e) => setNewMinFare(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono font-bold"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setOfferModalOpen(false)}
              className="px-4 py-2 font-bold text-slate-500 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creatingOffer}
              className="px-4 py-2 bg-navy hover:bg-skyblue text-white font-bold rounded-xl transition cursor-pointer disabled:opacity-50"
            >
              {creatingOffer ? 'Publishing...' : 'Publish Live to Database'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: BROADCAST CAMPAIGN */}
      <Modal
        isOpen={campaignModalOpen}
        onClose={() => setCampaignModalOpen(false)}
        title="Broadcast Email Campaign"
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setSendingCampaign(true);
            try {
              await api.post('/marketing/campaigns/send', {
                subject: campaignSubject,
                htmlContent: campaignHtml,
                recipientEmails: [campaignRecipients || user?.email || 'traveler@skynexa.com']
              });
              toast.success('Campaign dispatched successfully!');
              setCampaignModalOpen(false);
            } catch (err) {
              toast.error(err.response?.data?.message || 'Failed to dispatch campaign');
            } finally {
              setSendingCampaign(false);
            }
          }}
          className="space-y-4 text-xs"
        >
          <div>
            <label className="block font-bold text-slate-600 mb-1">Campaign Subject</label>
            <input
              type="text"
              required
              value={campaignSubject}
              onChange={(e) => setCampaignSubject(e.target.value)}
              placeholder="e.g. Flash Sale: Flat ₹500 off Chennai to Bengaluru!"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-600 mb-1">Test Recipient Email</label>
            <input
              type="email"
              required
              value={campaignRecipients}
              onChange={(e) => setCampaignRecipients(e.target.value)}
              placeholder="customer@example.com"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-600 mb-1">Email Body Content (HTML / Text)</label>
            <textarea
              rows={4}
              required
              value={campaignHtml}
              onChange={(e) => setCampaignHtml(e.target.value)}
              placeholder="<p>Special deal on Skynexa flight corridors!</p>"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCampaignModalOpen(false)}
              className="px-4 py-2 font-bold text-slate-500 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={sendingCampaign}
              className="px-4 py-2 bg-navy hover:bg-skyblue text-white font-bold rounded-xl transition cursor-pointer disabled:opacity-50"
            >
              {sendingCampaign ? 'Sending...' : 'Send Campaign'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MarketingAdminDashboard;
