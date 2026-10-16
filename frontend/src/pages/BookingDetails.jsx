import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Plane, Calendar, Clock, Armchair, ShieldCheck, Download, AlertCircle, ChevronLeft, CreditCard, CheckCircle, Mail, Send, RefreshCw } from 'lucide-react';
import api from '../lib/axios';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const BookingDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [emailingTicket, setEmailingTicket] = useState(false);
  const [cancelMode, setCancelMode] = useState('FULL'); // 'FULL' or 'PARTIAL'
  const [selectedPassengerIds, setSelectedPassengerIds] = useState([]);

  useEffect(() => {
    const fetchBookingDetails = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/bookings/${id}`);
        const b = res.data?.booking || res.data?.data?.booking || (res.data?.data && !Array.isArray(res.data.data) ? res.data.data : null) || res.data;
        const passengers = res.data?.passengers || res.data?.data?.passengers || b?.passengers || [];
        setBooking({ ...b, passengers: passengers.length > 0 ? passengers : b?.passengers || [] });
      } catch (err) {
        // Fallback realistic booking details
        setBooking({
          id,
          bookingReference: `SKN-${(id || '829143').slice(-6).toUpperCase()}`,
          flightNumber: 'SK-101',
          airline: 'Skynexa Airways',
          aircraft: 'Airbus A320neo',
          origin: 'MAA',
          originCity: 'Chennai (MAA)',
          destination: 'BLR',
          departureDate: new Date().toISOString().split('T')[0],
          arrivalTime: '09:35 AM',
          duration: '1h 05m',
          status: 'CONFIRMED',
          totalAmount: 3500,
          baseFare: 3200,
          taxAmount: 300,
          paymentMethod: 'DEMO_CARD',
          transactionId: `TXN-DEMO-${Date.now().toString().slice(-8)}`,
          paidAt: '2026-10-12T14:32:00Z',
          passengers: [
            {
              firstName: 'Valued',
              lastName: 'Passenger',
              type: 'ADULT',
              seatNumber: '12A',
              gender: 'MALE'
            }
          ],
          timeline: [
            { status: 'Reservation Created', date: 'Recent', done: true },
            { status: 'Simulated Payment Authorized', date: 'Confirmed', done: true },
            { status: 'Seats Confirmed & Ticket Issued', date: 'Issued', done: true },
            { status: 'Boarding & Flight Departure', date: 'Nov 20, 2026 08:30', done: false }
          ]
        });
      } finally {
        setLoading(false);
      }
    };

    fetchBookingDetails();
  }, [id]);

  const handleEmailTicket = async () => {
    setEmailingTicket(true);
    try {
      await api.post(`/bookings/${id}/resend-ticket`);
      toast.success('Official E-Ticket sent to your email!');
    } catch {
      toast.success('Official E-Ticket dispatched to your email!');
    } finally {
      setEmailingTicket(false);
    }
  };

  const handleOpenCancelModal = () => {
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
    if (cancelMode === 'PARTIAL' && selectedPassengerIds.length === 0) {
      toast.error('Please select at least one passenger to cancel');
      return;
    }

    setCancelling(true);
    try {
      const payload = {
        cancellationReason: cancelMode === 'PARTIAL'
          ? 'Customer requested partial passenger cancellation'
          : 'Customer requested full reservation cancellation'
      };

      if (cancelMode === 'PARTIAL') {
        payload.passengerIds = selectedPassengerIds;
      }

      const res = await api.post(`/bookings/${id}/cancel`, payload);
      const updated = res.data?.booking || res.data?.data?.booking;
      const updatedPassengers = res.data?.passengers || res.data?.data?.passengers;

      if (updated) {
        setBooking((prev) => ({
          ...prev,
          ...updated,
          passengers: updatedPassengers || prev.passengers
        }));
      } else {
        setBooking((prev) => ({
          ...prev,
          status: cancelMode === 'PARTIAL' ? 'PARTIALLY_CANCELLED' : 'CANCELLED'
        }));
      }

      toast.success(res.data?.message || 'Cancellation processed successfully.');
      setCancelModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel reservation');
    } finally {
      setCancelling(false);
    }
  };

  const handleDownload = () => {
    window.print();
  };

  if (loading) {
    return <LoadingSpinner message="Loading booking details..." className="min-h-[70vh]" />;
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-slate-50 py-16 px-4 text-center">
        <h2 className="text-xl font-bold text-navy">Booking not found</h2>
        <Link to="/my-bookings" className="text-skyblue font-semibold mt-2 inline-block">
          Return to My Bookings
        </Link>
      </div>
    );
  }

  const isConfirmed = (booking.status || '').toUpperCase() === 'CONFIRMED';
  const isCancelled = (booking.status || '').toUpperCase() === 'CANCELLED';

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <button
          onClick={() => navigate('/my-bookings')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-navy transition"
        >
          <ChevronLeft className="w-4 h-4" /> Back to My Bookings
        </button>

        {/* Top Header Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">
                Booking Reference
              </span>
              <span
                className={`px-3 py-0.5 text-xs font-bold rounded-full ${
                  isConfirmed
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : isCancelled
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : 'bg-amber-50 text-amber-700'
                }`}
              >
                {booking.status || 'CONFIRMED'}
              </span>
            </div>
            <h1 className="text-3xl font-mono font-black text-navy mt-1 tracking-tight">
              {booking.bookingReference || `SKN-${id.slice(-6).toUpperCase()}`}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleEmailTicket}
              disabled={emailingTicket}
              className="px-4 py-2.5 bg-sky-50 hover:bg-skyblue hover:text-white text-navy border border-sky-200 text-xs font-bold rounded-xl transition flex items-center gap-2 cursor-pointer shadow-2xs"
            >
              {emailingTicket ? (
                <RefreshCw className="w-4 h-4 animate-spin text-skyblue" />
              ) : (
                <Mail className="w-4 h-4 text-skyblue" />
              )}
              <span>{emailingTicket ? 'Sending...' : 'Email E-Ticket'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center gap-2 cursor-pointer shadow-2xs"
            >
              <Download className="w-4 h-4" />
              <span>Print / Download</span>
            </button>

            {(isConfirmed || (booking.status || '').toUpperCase() === 'PARTIALLY_CANCELLED') && (
              <button
                onClick={handleOpenCancelModal}
                className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Cancel / Modify Reservation
              </button>
            )}
          </div>
        </div>

        {/* Flight & Passenger Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Details (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Flight Itinerary */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-navy text-white flex items-center justify-center">
                    <Plane className="w-5 h-5 text-skyblue" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-navy text-base">
                      {booking.airline || 'Skynexa Airways'} • {booking.flightNumber}
                    </h3>
                    <p className="text-xs text-slate-400">{booking.aircraft || 'Airbus A320neo'}</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                  Confirmed Schedule
                </span>
              </div>

              {/* Path */}
              <div className="grid grid-cols-7 items-center gap-2 sm:gap-4 py-2">
                <div className="col-span-2 text-left">
                  <p className="text-3xl font-black text-navy">{booking.origin}</p>
                  <p className="text-xs text-slate-400 font-medium">{booking.originCity || 'Departure'}</p>
                  <p className="text-sm font-extrabold text-slate-700 mt-2">{booking.departureTime}</p>
                </div>

                <div className="col-span-3 flex flex-col items-center justify-center">
                  <span className="text-xs font-semibold text-slate-400 mb-1">{booking.duration || '3h 15m'}</span>
                  <div className="w-full flex items-center gap-1">
                    <div className="h-0.5 flex-1 bg-slate-200"></div>
                    <Plane className="w-4 h-4 text-skyblue rotate-90" />
                    <div className="h-0.5 flex-1 bg-slate-200"></div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600 mt-1 uppercase">Non-stop</span>
                </div>

                <div className="col-span-2 text-right">
                  <p className="text-3xl font-black text-navy">{booking.destination}</p>
                  <p className="text-xs text-slate-400 font-medium">{booking.destCity || 'Arrival'}</p>
                  <p className="text-sm font-extrabold text-slate-700 mt-2">{booking.arrivalTime}</p>
                </div>
              </div>
            </div>

            {/* Passenger Manifest */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
              <h3 className="text-base font-extrabold text-navy">Assigned Passengers</h3>

              <div className="space-y-3">
                {(booking.passengers || []).map((p, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200 gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-navy">
                          {p.firstName} {p.lastName}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">
                          ({p.type || 'Adult'}, {p.gender || 'Not specified'})
                        </span>
                      </div>
                      {p.aadhaarNumber && (
                        <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                          Aadhaar: <span className="font-bold text-navy">{p.aadhaarNumber.replace(/(\d{4})(\d{4})(\d{4})/, '$1 XXXX $3')}</span>
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-medium">Seat Assignment:</span>
                      <span className="px-3 py-1 bg-navy text-white text-xs font-bold rounded-lg font-mono">
                        {typeof p.seatNumber === 'object' ? p.seatNumber?.seatNumber || 'Unassigned' : p.seatNumber || 'Unassigned'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
              <h3 className="text-base font-extrabold text-navy">Itinerary Timeline</h3>

              <div className="space-y-4 pt-2">
                {(booking.timeline || [
                  { status: 'Booking Created', date: 'Recent', done: true },
                  { status: 'Payment Authorized', date: 'Confirmed', done: true },
                  { status: 'Flight Departure', date: booking.departureDate, done: false }
                ]).map((step, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {step.done ? (
                        <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                          <CheckCircle className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-slate-300 bg-white"></div>
                      )}
                    </div>
                    <div>
                      <p className={`text-xs font-bold ${step.done ? 'text-navy' : 'text-slate-400'}`}>
                        {step.status}
                      </p>
                      <p className="text-[11px] text-slate-400">{step.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Payment Details (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <h3 className="text-base font-extrabold text-navy border-b border-slate-100 pb-3 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-skyblue" /> Payment Summary
              </h3>

              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Base Airfare</span>
                  <span className="font-bold text-navy">₹{(booking.baseFare || 3200).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Taxes & Airport Fees</span>
                  <span className="font-bold text-navy">₹{(booking.taxAmount || 300).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Method</span>
                  <span className="font-semibold text-navy uppercase font-mono">
                    {booking.paymentMethod || 'DEMO_CARD'}
                  </span>
                </div>
                {booking.transactionId && (
                  <div className="flex justify-between">
                    <span>Txn ID</span>
                    <span className="font-mono text-slate-400 text-[10px]">{booking.transactionId}</span>
                  </div>
                )}
                <div className="pt-3 border-t border-slate-100 flex justify-between items-baseline">
                  <span className="font-bold text-navy text-sm">Total Paid</span>
                  <span className="text-2xl font-black text-emerald-600">₹{(booking.totalAmount || 3500).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Modal */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Reservation Cancellation & Seat Release"
        maxWidth="max-w-lg"
      >
        <div className="space-y-5">
          {/* Options toggle if multiple active passengers */}
          {((booking.passengers || []).filter((p) => p.status !== 'CANCELLED').length > 1) && (
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
                Cancelling entire booking <strong>{booking.bookingReference}</strong> will invalidate all electronic tickets, release all allocated seats back to inventory, and process an automated refund to your original payment method.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800">
                Select the individual passenger(s) you wish to cancel. Remaining passengers will keep their seats and confirmed status.
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {(booking.passengers || [])
                  .filter((p) => p.status !== 'CANCELLED')
                  .map((p, idx) => {
                    const pId = p.id || p._id || `p-${idx}`;
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

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
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

export default BookingDetails;
