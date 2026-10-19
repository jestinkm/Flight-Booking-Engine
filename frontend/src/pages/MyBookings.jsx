import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Ticket, Calendar, Plane, Search, AlertCircle, RefreshCw } from 'lucide-react';
import api from '../lib/axios';
import BookingCard from '../components/BookingCard';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('UPCOMING'); // UPCOMING | COMPLETED | CANCELLED
  const [selectedBookingForCancel, setSelectedBookingForCancel] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  const fetchBookings = async () => {
    setLoading(true);
    try {
      let res;
      try {
        res = await api.get('/bookings/my-bookings');
      } catch (e) {
        if (e.response?.status === 404) {
          res = await api.get('/bookings');
        } else {
          throw e;
        }
      }

      const list =
        res.data?.bookings ||
        res.data?.data?.bookings ||
        (Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : []);
      setBookings(list || []);
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const [cancelMode, setCancelMode] = useState('FULL'); // 'FULL' or 'PARTIAL'
  const [selectedPassengerIds, setSelectedPassengerIds] = useState([]);

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleOpenCancel = (booking) => {
    setSelectedBookingForCancel(booking);
    setCancelMode('FULL');
    setSelectedPassengerIds([]);
    setCancelModalOpen(true);
  };

  const togglePassengerSelection = (pId) => {
    setSelectedPassengerIds((prev) =>
      prev.includes(pId) ? prev.filter((id) => id !== pId) : [...prev, pId]
    );
  };

  const handleConfirmCancel = async () => {
    if (!selectedBookingForCancel) return;
    if (cancelMode === 'PARTIAL' && selectedPassengerIds.length === 0) {
      toast.error('Please select at least one passenger to cancel');
      return;
    }

    setCancelling(true);

    try {
      const cancelId = selectedBookingForCancel.id || selectedBookingForCancel._id;
      const payload = {
        cancellationReason: cancelMode === 'PARTIAL'
          ? 'Customer requested partial passenger cancellation'
          : 'Customer requested full cancellation via portal'
      };

      if (cancelMode === 'PARTIAL') {
        payload.passengerIds = selectedPassengerIds;
      }

      const res = await api.post(`/bookings/${cancelId}/cancel`, payload);
      const updated = res.data?.booking || res.data?.data?.booking;
      const updatedPassengers = res.data?.passengers || res.data?.data?.passengers;

      setBookings((prev) =>
        prev.map((b) =>
          (b.id === cancelId || b._id === cancelId)
            ? {
                ...b,
                ...(updated || {}),
                status: updated?.status || (cancelMode === 'PARTIAL' ? 'PARTIALLY_CANCELLED' : 'CANCELLED'),
                passengers: updatedPassengers || b.passengers
              }
            : b
        )
      );

      toast.success(res.data?.message || `Booking ${selectedBookingForCancel.bookingReference || ''} updated.`);
      setCancelModalOpen(false);
      setSelectedBookingForCancel(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel booking. Please contact support.');
    } finally {
      setCancelling(false);
    }
  };

  // Filter by active tab
  const filteredBookings = bookings.filter((b) => {
    const s = (b.status || '').toUpperCase();
    const flightInstance = b.flightInstanceId || b.flightInstance || {};
    const depDateTime = flightInstance.departureDateTime || b.departureDate || b.travelDate;
    const isPast = depDateTime ? new Date(depDateTime) < new Date() : false;

    if (activeTab === 'UPCOMING') {
      return (s === 'CONFIRMED' || s === 'PENDING') && !isPast;
    }
    if (activeTab === 'COMPLETED') {
      return s === 'COMPLETED' || (s === 'CONFIRMED' && isPast);
    }
    if (activeTab === 'CANCELLED') {
      return s === 'CANCELLED';
    }
    return true;
  });

  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage) || 1;
  const paginatedList = filteredBookings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200/80 gap-4 animate-fadeInDown">
          <div>
            <h1 className="text-3xl font-black text-navy flex items-center gap-2.5">
              <Ticket className="w-8 h-8 text-skyblue animate-pulseSubtle" /> My Flight Bookings
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Manage all upcoming trips, download boarding cards, and view flight history.
            </p>
          </div>

          <Link
            to="/search"
            className="px-5 py-2.5 bg-navy hover:bg-skyblue text-white text-xs font-bold rounded-xl shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105 active:scale-95 self-start sm:self-auto flex items-center gap-2 group"
          >
            <Plane className="w-4 h-4 group-hover:rotate-45 transition-transform duration-300" /> 
            <span>Book a New Flight</span>
          </Link>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-slate-200 gap-6 text-sm font-bold">
          {[
            { id: 'UPCOMING', label: 'Upcoming Trips' },
            { id: 'COMPLETED', label: 'Completed Flights' },
            { id: 'CANCELLED', label: 'Cancelled' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setCurrentPage(1);
              }}
              className={`pb-3 border-b-2 transition-all duration-200 font-bold cursor-pointer hover:scale-105 active:scale-95 ${
                activeTab === tab.id
                  ? 'border-skyblue text-skyblue'
                  : 'border-transparent text-slate-500 hover:text-navy'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Bookings List */}
        {loading ? (
          <LoadingSpinner message="Retrieving your bookings..." className="min-h-[40vh]" />
        ) : paginatedList.length > 0 ? (
          <div className="space-y-4 animate-fadeInUp">
            {paginatedList.map((booking) => (
              <BookingCard
                key={booking.id || booking._id}
                booking={booking}
                onCancel={handleOpenCancel}
              />
            ))}

            {/* Pagination */}
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
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 space-y-4">
            <div className="w-16 h-16 rounded-full bg-skyblue-light text-skyblue flex items-center justify-center mx-auto">
              <Ticket className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-navy">No {activeTab.toLowerCase()} bookings found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              You do not have any trips recorded under this tab. Explore our destinations and schedule your next getaway!
            </p>
            <Link
              to="/search"
              className="inline-flex items-center gap-2 px-6 py-3 bg-navy hover:bg-skyblue text-white font-bold text-xs rounded-xl shadow-md transition"
            >
              <span>Explore Flights</span>
            </Link>
          </div>
        )}
      </div>

      {/* Cancellation Modal */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Reservation Cancellation & Seat Release"
        maxWidth="max-w-lg"
      >
        <div className="space-y-5">
          {/* Options toggle if multiple active passengers */}
          {((selectedBookingForCancel?.passengers || []).filter((p) => p.status !== 'CANCELLED').length > 1) && (
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setCancelMode('FULL')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                  cancelMode === 'FULL'
                    ? 'bg-white text-navy shadow-2xs'
                    : 'text-slate-500 hover:text-navy'
                }`}
              >
                Cancel Entire Booking
              </button>
              <button
                type="button"
                onClick={() => setCancelMode('PARTIAL')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                  cancelMode === 'PARTIAL'
                    ? 'bg-white text-navy shadow-2xs'
                    : 'text-slate-500 hover:text-navy'
                }`}
              >
                Partial Cancellation
              </button>
            </div>
          )}

          {cancelMode === 'FULL' ? (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-2">
              <div className="flex items-center gap-2 text-rose-700 font-bold text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Full Reservation Cancellation</span>
              </div>
              <p className="text-xs text-rose-800 leading-relaxed">
                Are you sure you want to cancel booking{' '}
                <strong>{selectedBookingForCancel?.bookingReference}</strong>? This will release all assigned seats ({selectedBookingForCancel?.seats?.map(s => typeof s === 'string' ? s : s?.seatNumber || '').filter(Boolean).join(', ') || 'Assigned'}) back into public inventory and issue an automated refund.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800">
                Select the individual passenger(s) you wish to cancel. Remaining passengers will retain their confirmed seats and schedule.
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {(selectedBookingForCancel?.passengers || [])
                  .filter((p) => p.status !== 'CANCELLED')
                  .map((p, idx) => {
                    const pId = p.id || p._id || `mb-p-${idx}`;
                    const isChecked = selectedPassengerIds.includes(pId);
                    return (
                      <label
                        key={pId}
                        className={`flex items-center justify-between p-3 rounded-xl border transition cursor-pointer ${
                          isChecked
                            ? 'bg-rose-50/60 border-rose-300'
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => togglePassengerSelection(pId)}
                            className="rounded text-rose-600 focus:ring-rose-500 h-4 w-4"
                          />
                          <div>
                            <div className="text-xs font-bold text-navy">
                              {p.firstName} {p.lastName}
                            </div>
                            <span className="text-[10px] text-slate-500 font-medium">
                              Type: {p.type || 'ADULT'} • Seat: {p.seatNumber || 'Unassigned'}
                            </span>
                          </div>
                        </div>
                        <span className="text-[11px] font-mono font-bold text-slate-600">
                          {isChecked ? 'Marked for Cancel' : 'Active'}
                        </span>
                      </label>
                    );
                  })}
              </div>

              {selectedPassengerIds.length > 0 && (
                <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                  <div className="flex justify-between">
                    <span>Passengers to cancel:</span>
                    <span className="font-bold text-rose-600">{selectedPassengerIds.length}</span>
                  </div>
                  <div className="flex justify-between text-navy font-bold">
                    <span>Seat(s) to be released:</span>
                    <span>{selectedPassengerIds.length} seat(s)</span>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCancelModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Keep Booking
            </button>
            <button
              type="button"
              onClick={handleConfirmCancel}
              disabled={cancelling || (cancelMode === 'PARTIAL' && selectedPassengerIds.length === 0)}
              className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {cancelling
                ? 'Processing Cancellation...'
                : cancelMode === 'PARTIAL'
                ? `Cancel ${selectedPassengerIds.length} Passenger(s)`
                : 'Confirm Full Cancellation'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MyBookings;
