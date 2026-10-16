import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Filter, SlidersHorizontal, ArrowUpDown, Plane, AlertCircle, Clock, Search } from 'lucide-react';
import api from '../lib/axios';
import FlightCard from '../components/FlightCard';
import SearchForm from '../components/SearchForm';
import LoadingSpinner from '../components/LoadingSpinner';

const SearchFlights = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const origin = searchParams.get('origin') || 'DEL';
  const destination = searchParams.get('destination') || 'BOM';
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
  const adults = parseInt(searchParams.get('adults') || '1', 10);
  const children = parseInt(searchParams.get('children') || '0', 10);

  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recentSearches, setRecentSearches] = useState([]);

  // Filters & Sorting state
  const [maxPrice, setMaxPrice] = useState(15000);
  const [timeFilter, setTimeFilter] = useState('ALL'); // ALL, MORNING, AFTERNOON, EVENING
  const [stopsFilter, setStopsFilter] = useState('ALL'); // ALL, DIRECT, ONE_STOP
  const [sortBy, setSortBy] = useState('PRICE_ASC'); // PRICE_ASC, TIME_ASC, DURATION_ASC
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    const fetchFlights = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get('/flights/search', {
          params: { origin, destination, date, adults, children }
        });
        const results =
          res.data?.flights ||
          res.data?.data?.flights ||
          (Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : []);
        
        setFlights(Array.isArray(results) ? results : []);
      } catch (err) {
        setFlights([]);
        setError(err.response?.data?.message || 'Failed to retrieve flights');
      } finally {
        setLoading(false);
      }
    };

    const fetchRecentSearches = async () => {
      try {
        const res = await api.get('/flights/recent-searches');
        const list = res.data?.searches || res.data?.data?.searches || [];
        setRecentSearches(Array.isArray(list) ? list : []);
      } catch (err) {
        // silent
      }
    };

    fetchFlights();
    fetchRecentSearches();
  }, [origin, destination, date, adults, children]);

  // Filtered and Sorted Flights
  const filteredFlights = useMemo(() => {
    return flights
      .filter((f) => {
        const fare = f.adultFare || f.baseFare || f.price || 0;
        if (fare > maxPrice) return false;

        // Time filter
        let hour = f.departureHour;
        if (hour === undefined && f.departureDateTime) {
          const depDate = new Date(f.departureDateTime);
          const istHour = depDate.toLocaleTimeString('en-US', {
            hour: '2-digit',
            hour12: false,
            timeZone: 'Asia/Kolkata'
          });
          hour = parseInt(istHour, 10);
        }
        if (hour === undefined) hour = 10;

        if (timeFilter === 'MORNING' && (hour < 5 || hour >= 12)) return false;
        if (timeFilter === 'AFTERNOON' && (hour < 12 || hour >= 18)) return false;
        if (timeFilter === 'EVENING' && (hour < 18 || hour >= 24)) return false;

        // Stops filter
        const stops = f.stops !== undefined ? f.stops : 0;
        if (stopsFilter === 'DIRECT' && stops !== 0) return false;
        if (stopsFilter === 'ONE_STOP' && stops !== 1) return false;

        return true;
      })
      .sort((a, b) => {
        const fareA = a.adultFare || a.baseFare || a.price || 0;
        const fareB = b.adultFare || b.baseFare || b.price || 0;
        if (sortBy === 'PRICE_ASC') return fareA - fareB;
        if (sortBy === 'PRICE_DESC') return fareB - fareA;
        if (sortBy === 'TIME_ASC') {
          const timeA = a.departureDateTime ? new Date(a.departureDateTime).getTime() : (a.departureHour || 0);
          const timeB = b.departureDateTime ? new Date(b.departureDateTime).getTime() : (b.departureHour || 0);
          return timeA - timeB;
        }
        if (sortBy === 'TIME_DESC') {
          const timeA = a.departureDateTime ? new Date(a.departureDateTime).getTime() : (a.departureHour || 0);
          const timeB = b.departureDateTime ? new Date(b.departureDateTime).getTime() : (b.departureHour || 0);
          return timeB - timeA;
        }
        if (sortBy === 'DURATION_ASC') return (a.durationMinutes || 0) - (b.durationMinutes || 0);
        return 0;
      });
  }, [flights, maxPrice, timeFilter, stopsFilter, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredFlights.length / itemsPerPage) || 1;
  const paginatedFlights = filteredFlights.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Search Bar Modifier Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
          <SearchForm
            initialValues={{ origin, destination, date, adults, children }}
            compact
          />
        </div>

        {/* Recently Searched Flights */}
        {recentSearches && recentSearches.length > 0 && (
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-sky-50 text-skyblue flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-navy uppercase tracking-wider">Recently Searched Flights</h3>
                  <p className="text-[11px] text-slate-400">Stored in MongoDB Atlas • Instant one-click query</p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-slate-400">
                {recentSearches.length} Recent Route{recentSearches.length > 1 ? 's' : ''}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {recentSearches.slice(0, 3).map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="p-3.5 rounded-2xl border border-slate-100 hover:border-skyblue/60 bg-slate-50/80 hover:bg-white transition flex flex-col justify-between gap-3 shadow-2xs group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-navy text-sm">{item.origin}</span>
                      <span className="text-skyblue font-bold text-xs">➔</span>
                      <span className="font-mono font-black text-navy text-sm">{item.destination}</span>
                    </div>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                      {(item.adults || 1) + (item.children || 0)} Pax
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-500 flex items-center justify-between">
                    <span className="font-medium text-slate-600">{item.date || 'Flexible Date'}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      item.resultCount > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {item.resultCount > 0 ? `${item.resultCount} Flights Found` : '0 Direct Flights'}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      const params = new URLSearchParams({
                        origin: item.origin,
                        destination: item.destination,
                        date: item.date || date,
                        adults: (item.adults || 1).toString(),
                        children: (item.children || 0).toString()
                      });
                      navigate(`/search?${params.toString()}`);
                    }}
                    className="w-full py-2 px-3 bg-navy hover:bg-skyblue text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-[0.98]"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Search Again</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Results Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/70 shadow-xs">
          <div>
            <h1 className="text-xl font-extrabold text-navy">
              Flights from <span className="text-skyblue">{origin}</span> to{' '}
              <span className="text-skyblue">{destination}</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {filteredFlights.length} flights available for {date} • {adults + children} passenger(s)
            </p>
          </div>

            {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-semibold text-slate-500">Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-navy focus:outline-none focus:border-skyblue cursor-pointer"
            >
              <option value="PRICE_ASC">Lowest Fare (₹)</option>
              <option value="PRICE_DESC">Highest Fare (₹)</option>
              <option value="TIME_ASC">Earliest Departure</option>
              <option value="TIME_DESC">Latest Departure</option>
              <option value="DURATION_ASC">Shortest Duration</option>
            </select>
          </div>
        </div>

        {/* Main Grid: Sidebar Filters + Flight List */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* Filter Sidebar */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-sm font-bold text-navy flex items-center gap-1.5">
                <SlidersHorizontal className="w-4 h-4 text-skyblue" /> Filters
              </span>
              <button
                onClick={() => {
                  setMaxPrice(25000);
                  setTimeFilter('ALL');
                  setStopsFilter('ALL');
                }}
                className="text-[11px] font-semibold text-skyblue hover:underline"
              >
                Reset All
              </button>
            </div>

            {/* Max Price Slider */}
            <div>
              <div className="flex justify-between items-center text-xs font-semibold text-slate-700 mb-2">
                <span>Maximum Fare</span>
                <span className="font-bold text-navy">₹{maxPrice.toLocaleString('en-IN')}</span>
              </div>
              <input
                type="range"
                min="1500"
                max="25000"
                step="500"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-skyblue"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                <span>₹1,500</span>
                <span>₹25,000</span>
              </div>
            </div>

            {/* Stops Filter */}
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-2">
                Stops
              </label>
              <div className="space-y-1.5 text-xs">
                {[
                  { id: 'ALL', label: 'All Flights' },
                  { id: 'DIRECT', label: 'Non-stop Only' },
                  { id: 'ONE_STOP', label: '1 Stop' }
                ].map((stopOpt) => (
                  <label key={stopOpt.id} className="flex items-center gap-2 cursor-pointer text-slate-600 hover:text-navy">
                    <input
                      type="radio"
                      name="stops"
                      checked={stopsFilter === stopOpt.id}
                      onChange={() => setStopsFilter(stopOpt.id)}
                      className="accent-skyblue"
                    />
                    <span>{stopOpt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Departure Times */}
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-2">
                Departure Time
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { id: 'ALL', label: 'Anytime' },
                  { id: 'MORNING', label: 'Morning (05-12)' },
                  { id: 'AFTERNOON', label: 'Afternoon (12-18)' },
                  { id: 'EVENING', label: 'Evening (18-24)' }
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTimeFilter(t.id)}
                    className={`p-2 rounded-xl text-left border text-[11px] font-semibold transition ${
                      timeFilter === t.id
                        ? 'border-skyblue bg-skyblue-light text-skyblue'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Flight Results Column */}
          <div className="lg:col-span-3 space-y-4">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="bg-white rounded-2xl p-6 border border-slate-200 animate-pulse h-40"></div>
                ))}
              </div>
            ) : paginatedFlights.length > 0 ? (
              <>
                {paginatedFlights.map((flight) => (
                  <FlightCard
                    key={flight.id || flight._id}
                    flight={flight}
                    searchParams={{ origin, destination, date, adults, children }}
                  />
                ))}

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between bg-white px-6 py-4 rounded-2xl border border-slate-200/80 mt-6">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3.5 py-1.5 text-xs font-bold rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
                    >
                      Previous
                    </button>
                    <span className="text-xs font-medium text-slate-500">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3.5 py-1.5 text-xs font-bold rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            ) : flights.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
                  <Plane className="w-6 h-6 rotate-45" />
                </div>
                <h3 className="text-lg font-bold text-navy">No Flights Scheduled</h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto">
                  No flights are scheduled for this route and date. Please select another date or destination.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
                  <SlidersHorizontal className="w-6 h-6 text-slate-400" />
                </div>
                <h3 className="text-lg font-bold text-navy">No flights match your criteria</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Try adjusting your maximum fare limit, stop preferences, or departure times to see more flights.
                </p>
                <button
                  onClick={() => {
                    setMaxPrice(25000);
                    setTimeFilter('ALL');
                    setStopsFilter('ALL');
                  }}
                  className="mt-2 px-4 py-2 bg-navy text-white text-xs font-bold rounded-xl hover:bg-skyblue transition cursor-pointer"
                >
                  Reset Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchFlights;
