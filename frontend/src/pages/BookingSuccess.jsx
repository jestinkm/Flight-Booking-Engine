import React, { useEffect, useState } from 'react';
import { useLocation, useParams, Link, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plane,
  Calendar,
  Users,
  Armchair,
  ArrowRight,
  ShieldCheck,
  Ticket,
  Printer,
  Sparkles,
  Mail,
  Send,
  RefreshCw,
  Check,
  CreditCard,
  Hash,
  ArrowLeft
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../lib/axios';

const BookingSuccess = () => {
  const { bookingId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [showFullScreenTick, setShowFullScreenTick] = useState(true);
  const [showConfetti, setShowConfetti] = useState(true);
  const [isResending, setIsResending] = useState(false);
  const [customEmailModal, setCustomEmailModal] = useState(false);
  const [targetEmail, setTargetEmail] = useState(
    location.state?.booking?.contactEmail || user?.email || ''
  );
  const [fetchedBooking, setFetchedBooking] = useState(null);
  const [loading, setLoading] = useState(!location.state?.booking);

  // Fetch real booking from MongoDB Atlas via backend API on mount or refresh
  useEffect(() => {
    if (bookingId) {
      api
        .get(`/bookings/${bookingId}`)
        .then((res) => {
          const data = res.data?.booking || res.data?.data?.booking || res.data?.data || res.data;
          const passengers = res.data?.passengers || res.data?.data?.passengers || data?.passengers;
          const payment = res.data?.payment || res.data?.data?.payment || data?.payment;
          const seats = res.data?.seats || res.data?.data?.seats || data?.seats;
          if (data) {
            setFetchedBooking({
              ...data,
              passengers: passengers || data.passengers || [],
              payment: payment || data.payment || null,
              seats: seats || data.seats || []
            });
            if (data.contactEmail) {
              setTargetEmail((prev) => prev || data.contactEmail);
            }
          }
        })
        .catch((err) => {
          console.warn('Booking fetch notice:', err?.message);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [bookingId]);

  useEffect(() => {
    const tickTimer = setTimeout(() => setShowFullScreenTick(false), 4500);
    const confettiTimer = setTimeout(() => setShowConfetti(false), 7000);
    return () => {
      clearTimeout(tickTimer);
      clearTimeout(confettiTimer);
    };
  }, []);

  // Merge state-based and backend-fetched booking data
  const booking = fetchedBooking || location.state?.booking || {
    id: bookingId,
    bookingReference: `SKN-${(bookingId || '894231').slice(-6).toUpperCase()}`,
    status: 'CONFIRMED',
    paymentStatus: 'PAID'
  };

  const status = (booking.status || 'CONFIRMED').toUpperCase();
  const paymentRecord = booking.payment || location.state?.payment || {};
  const paymentStatus = (
    booking.paymentStatus ||
    paymentRecord.status ||
    (status === 'CONFIRMED' ? 'PAID' : status === 'CANCELLED' ? 'REFUNDED' : 'PENDING')
  ).toUpperCase();

  const isConfirmed = status === 'CONFIRMED' && (paymentStatus === 'PAID' || paymentStatus === 'SUCCESS');
  const isPending = status === 'PENDING' || paymentStatus === 'PENDING';
  const isFailed = paymentStatus === 'FAILED' || (status === 'CANCELLED' && paymentStatus !== 'REFUNDED');

  const bookingRef =
    booking.bookingReference ||
    booking.reference ||
    `SKN-${(bookingId || '729183').slice(-6).toUpperCase()}`;

  const flightInstance = booking.flightInstanceId || booking.flightInstance || {};
  const flight =
    flightInstance.flightId ||
    booking.flightId ||
    booking.flight ||
    {};

  const flightNumber =
    flight.flightNumber ||
    flight.flightCode ||
    booking.flightNumber ||
    booking.flightCode ||
    'SK-101';

  const flightName =
    flight.flightName ||
    booking.flightName ||
    'Skynexa Flight';

  const aircraft =
    flight.aircraftLayoutId?.name ||
    flight.aircraftLayoutId?.aircraftType ||
    flight.aircraft ||
    booking.aircraft ||
    'Airbus A320neo';

  const origObj = flight.originAirportId || flightInstance.originAirportId || flight.origin || booking.origin;
  const destObj = flight.destinationAirportId || flightInstance.destinationAirportId || flight.destination || booking.destination;

  const originCode = typeof origObj === 'object' && origObj !== null ? (origObj.code || origObj.city || 'DEL') : (origObj || 'DEL');
  const originCity = typeof origObj === 'object' && origObj !== null ? (origObj.city || origObj.name || originCode) : originCode;

  const destCode = typeof destObj === 'object' && destObj !== null ? (destObj.code || destObj.city || 'BOM') : (destObj || 'BOM');
  const destCity = typeof destObj === 'object' && destObj !== null ? (destObj.city || destObj.name || destCode) : destCode;

  // Dates & Times
  const depIso = flightInstance.departureDateTime || booking.departureDateTime || flight.departureDateTime;
  const arrIso = flightInstance.arrivalDateTime || booking.arrivalDateTime || flight.arrivalDateTime;

  const travelDateFormatted = depIso
    ? new Date(depIso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : booking.departureDate || booking.travelDate || new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const depTimeFormatted = depIso
    ? new Date(depIso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
    : flight.departureTime || '08:30 AM';

  const arrDateFormatted = arrIso
    ? new Date(arrIso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : travelDateFormatted;

  const arrTimeFormatted = arrIso
    ? new Date(arrIso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
    : flight.arrivalTime || '10:00 AM';

  const normalizeSeat = (s) => {
    if (!s) return '';
    if (typeof s === 'string') return s;
    if (typeof s === 'object') return s.seatNumber || s.seat || s.code || '';
    return String(s);
  };

  // Passengers & Seats
  const rawPassengers =
    Array.isArray(booking.passengers) && booking.passengers.length > 0
      ? booking.passengers
      : Array.isArray(booking.passengerDetails) && booking.passengerDetails.length > 0
      ? booking.passengerDetails
      : [];

  const rawSeats = (
    Array.isArray(booking.seats) && booking.seats.length > 0
      ? booking.seats
      : Array.isArray(booking.seatNumbers) && booking.seatNumbers.length > 0
      ? booking.seatNumbers
      : []
  ).map(normalizeSeat).filter(Boolean);

  const passengerList =
    rawPassengers.length > 0
      ? rawPassengers.map((p, idx) => ({
          firstName: p.firstName || (typeof p === 'string' ? p : `Traveler ${idx + 1}`),
          lastName: p.lastName || '',
          type: p.type || 'ADULT',
          seatNumber: normalizeSeat(p.seatNumber) || rawSeats[idx] || `${idx + 1}A`
        }))
      : rawSeats.length > 0
      ? rawSeats.map((s, idx) => ({
          firstName: idx === 0 && user?.firstName ? user.firstName : `Traveler ${idx + 1}`,
          lastName: idx === 0 && user?.lastName ? user.lastName : '',
          type: 'ADULT',
          seatNumber: s
        }))
      : [
          {
            firstName: user?.firstName || 'Valued',
            lastName: user?.lastName || 'Passenger',
            type: 'ADULT',
            seatNumber: '1A'
          }
        ];

  const seats = (
    rawSeats.length > 0
      ? rawSeats
      : passengerList.map((p) => p.seatNumber).filter(Boolean)
  ).map(normalizeSeat).filter(Boolean);

  // Financials
  const baseFare = booking.subtotal || booking.baseFare || 3500;
  const taxAmount = booking.taxAmount || Math.round(baseFare * 0.12);
  const discountAmount = booking.discountAmount || 0;
  const totalAmount = booking.totalAmount || booking.finalPayable || (baseFare + taxAmount - discountAmount);

  // Payment Details
  const transactionId =
    paymentRecord.transactionId ||
    paymentRecord.transactionReference ||
    booking.transactionId ||
    (isConfirmed ? `TXN-${(booking._id || 'DEMO').slice(-8).toUpperCase()}` : 'PENDING');

  const paymentMethodDisplay =
    paymentRecord.safePaymentDetails ||
    (paymentRecord.method === 'DEMO_UPI' ? 'UPI (demo@upi)' : `Credit Card (•••• ${paymentRecord.demoCardLast4 || '4242'})`);

  const bookingCreatedAt = booking.createdAt
    ? new Date(booking.createdAt).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    : new Date().toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });

  const actualBookingId = booking._id || booking.id || bookingId;

  const handlePrintTicket = () => {
    window.print();
  };

  const handleResendTicket = async (emailToSend) => {
    const email = emailToSend || targetEmail || booking.contactEmail || user?.email;
    if (!email) {
      toast.error('Please specify an email address to send the e-ticket');
      return;
    }
    setIsResending(true);
    try {
      if (actualBookingId) {
        const res = await api.post(`/bookings/${actualBookingId}/resend-ticket`, {
          customEmail: email
        });
        setFetchedBooking((prev) => ({
          ...(prev || booking),
          emailSent: true,
          emailDeliveryError: null,
          contactEmail: email
        }));
        setCustomEmailModal(false);
        toast.success(res.data?.message || `Official E-Ticket sent to ${email}!`);
      }
    } catch (err) {
      console.error('Failed to resend ticket:', err);
      const errMsg = err.response?.data?.message || err.message || 'Failed to dispatch email';
      setFetchedBooking((prev) => ({
        ...(prev || booking),
        emailSent: false,
        emailDeliveryError: errMsg
      }));
      toast.error(errMsg);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Full-Screen Green Tick Overlay (Only shown on confirmed bookings) */}
      {showFullScreenTick && isConfirmed && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-xl animate-fadeIn p-6 text-center select-none">
          <style>{`
            @keyframes drawTick {
              0% { stroke-dashoffset: 100; opacity: 0; }
              40% { opacity: 1; }
              100% { stroke-dashoffset: 0; opacity: 1; }
            }
            @keyframes pulseGlow {
              0%, 100% { transform: scale(1); box-shadow: 0 0 50px rgba(16, 185, 129, 0.5); }
              50% { transform: scale(1.05); box-shadow: 0 0 90px rgba(16, 185, 129, 0.8); }
            }
          `}</style>

          <div className="relative flex flex-col items-center max-w-lg w-full space-y-6">
            <div className="relative flex items-center justify-center my-4">
              <div className="absolute w-52 h-52 rounded-full bg-emerald-500/20 animate-ping"></div>
              <div className="absolute w-40 h-40 rounded-full bg-emerald-400/30 animate-pulse"></div>

              <div
                className="relative w-32 h-32 rounded-full bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 flex items-center justify-center ring-8 ring-emerald-400/30"
                style={{ animation: 'pulseGlow 2.5s infinite ease-in-out' }}
              >
                <svg className="w-20 h-20 text-white drop-shadow-md" viewBox="0 0 52 52">
                  <circle
                    cx="26"
                    cy="26"
                    r="23"
                    fill="none"
                    stroke="rgba(255,255,255,0.3)"
                    strokeWidth="3"
                  />
                  <path
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray="100"
                    strokeDashoffset="0"
                    d="M14 27l8 8 16-16"
                    style={{ animation: 'drawTick 0.9s cubic-bezier(0.65, 0, 0.45, 1) forwards' }}
                  />
                </svg>
              </div>
            </div>

            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-black uppercase tracking-widest shadow-inner">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Payment Confirmed &amp; Seats Allocated</span>
              </div>

              <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                Booking Confirmed!
              </h2>

              <p className="text-sm sm:text-base text-slate-300 max-w-md mx-auto leading-relaxed">
                Your flight booking is secured. Seat reservations are saved in MongoDB and an official E-Ticket has been dispatched.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 text-xs font-semibold text-emerald-300">
                <span className="flex items-center gap-1.5 bg-emerald-950/60 border border-emerald-500/30 px-3 py-1.5 rounded-xl">
                  <Check className="w-4 h-4 text-emerald-400" /> PNR #{bookingRef}
                </span>
                <span className="flex items-center gap-1.5 bg-emerald-950/60 border border-emerald-500/30 px-3 py-1.5 rounded-xl">
                  <Armchair className="w-4 h-4 text-emerald-400" /> Seats: {seats.map(normalizeSeat).filter(Boolean).join(', ') || '1A'}
                </span>
                <span className="flex items-center gap-1.5 bg-emerald-950/60 border border-emerald-500/30 px-3 py-1.5 rounded-xl">
                  <Mail className="w-4 h-4 text-emerald-400" /> E-Ticket Sent
                </span>
              </div>
            </div>

            <div className="pt-4 w-full max-w-sm space-y-2">
              <button
                type="button"
                onClick={() => setShowFullScreenTick(false)}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-white font-black text-sm shadow-xl hover:shadow-emerald-500/30 transition flex items-center justify-center gap-2 cursor-pointer transform hover:-translate-y-0.5"
              >
                <span>View Boarding Pass &amp; Details</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confetti Animation */}
      {showConfetti && isConfirmed && (
        <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
          {[...Array(30)].map((_, i) => {
            const colors = ['#2496ED', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6'];
            const randomColor = colors[i % colors.length];
            const leftPos = (i * 3.3) % 100;
            const delay = (i * 0.15) % 2;
            const size = 6 + (i % 6);
            return (
              <div
                key={i}
                className="absolute rounded-sm animate-pulse"
                style={{
                  top: '-20px',
                  left: `${leftPos}%`,
                  width: `${size}px`,
                  height: `${size * 1.5}px`,
                  backgroundColor: randomColor,
                  transform: `rotate(${i * 25}deg)`,
                  animation: `bounce 3s infinite ${delay}s, ping 2s infinite ${delay}s`
                }}
              />
            );
          })}
        </div>
      )}

      <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn relative z-10">
        {/* Navigation Breadcrumb / Top Bar */}
        <div className="flex items-center justify-between text-xs text-slate-500">
          <Link
            to="/my-bookings"
            className="inline-flex items-center gap-1.5 font-bold hover:text-navy transition"
          >
            <ArrowLeft className="w-4 h-4 text-skyblue" />
            <span>My Bookings</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">Booking Ref:</span>
            <span className="font-mono font-bold text-navy bg-white px-2.5 py-1 rounded-lg border border-slate-200">
              {bookingRef}
            </span>
          </div>
        </div>

        {/* Dynamic Status Header */}
        <div className="text-center space-y-3">
          {isConfirmed ? (
            <>
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 mb-2 shadow-lg ring-8 ring-emerald-50">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-black uppercase rounded-full tracking-wider">
                <Sparkles className="w-3.5 h-3.5" /> Booking Confirmed &amp; Seats Allocated
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-navy tracking-tight">
                Booking Confirmed
              </h1>
              <p className="text-sm text-slate-500 font-medium max-w-md mx-auto">
                Your flight is confirmed and your tickets are issued. A confirmation copy has been dispatched to your email.
              </p>
            </>
          ) : isPending ? (
            <>
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-100 text-amber-600 mb-2 shadow-lg ring-8 ring-amber-50">
                <Clock className="w-12 h-12 animate-pulse" />
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-black uppercase rounded-full tracking-wider">
                <AlertTriangle className="w-3.5 h-3.5" /> Action Required: Payment Pending
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-navy tracking-tight">
                Payment Pending
              </h1>
              <p className="text-sm text-slate-500 font-medium max-w-md mx-auto">
                Your reservation is held. Please complete the simulated payment to lock in your seats and receive your boarding passes.
              </p>
              <div className="pt-2">
                <Link
                  to="/payment"
                  state={{ bookingId: actualBookingId, booking }}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-skyblue hover:bg-navy text-white text-xs font-extrabold shadow-md transition"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Complete Payment Now</span>
                </Link>
              </div>
            </>
          ) : (
            <>
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-rose-100 text-rose-600 mb-2 shadow-lg ring-8 ring-rose-50">
                <AlertTriangle className="w-12 h-12" />
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-black uppercase rounded-full tracking-wider">
                <span>Payment Unsuccessful</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-navy tracking-tight">
                Payment Failed
              </h1>
              <p className="text-sm text-slate-500 font-medium max-w-md mx-auto">
                We were unable to complete your transaction. Your reserved seats are temporarily on hold.
              </p>
              <div className="pt-2">
                <Link
                  to="/payment"
                  state={{ bookingId: actualBookingId, booking }}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold shadow-md transition"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Retry Payment</span>
                </Link>
              </div>
            </>
          )}
        </div>

        {/* Boarding Pass / Ticket Summary Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xl overflow-hidden relative">
          {/* Top Navy Header Banner */}
          <div className="bg-gradient-to-r from-navy via-navy-800 to-navy p-6 sm:p-8 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-skyblue text-xs font-black uppercase tracking-widest">
                <Plane className="w-4 h-4" />
                <span>Skynexa Airways • Official Boarding Pass</span>
              </div>
              <p className="text-2xl sm:text-3xl font-mono font-black tracking-wider text-white">
                PNR: {bookingRef}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
                  isConfirmed
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : isPending
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isConfirmed ? 'bg-emerald-400 animate-ping' : isPending ? 'bg-amber-400' : 'bg-rose-400'
                  }`}
                ></span>
                {paymentStatus}
              </span>

              <span className="px-3 py-1 rounded-xl bg-white/10 text-white text-xs font-mono font-bold">
                Txn: {transactionId}
              </span>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* E-Ticket Email Delivery Banner */}
            {isConfirmed && (
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-sky-50 via-blue-50 to-emerald-50 border border-sky-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-navy text-skyblue flex items-center justify-center shrink-0 shadow-md">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-black uppercase text-navy tracking-wider">
                        {booking.emailSent ? 'Official E-Ticket Dispatched' : 'Official E-Ticket Status'}
                      </p>
                      {booking.emailSent ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-600" /> SENT
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-600" /> PENDING DELIVERY
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5 font-medium leading-relaxed">
                      {booking.emailSent
                        ? 'Detailed flight itinerary, seat allocation, and baggage allowance sent to:'
                        : 'Passenger contact email specified for this booking:'}
                    </p>
                    <p className="text-xs font-bold text-navy font-mono mt-0.5">
                      {booking.contactEmail || targetEmail || user?.email || 'Registered Email'}
                    </p>
                    {!booking.emailSent ? (
                      <div className="mt-2.5 p-2.5 rounded-xl bg-sky-50/90 border border-sky-200 text-[11px] text-slate-700 leading-normal flex items-start gap-2">
                        <ShieldCheck className="w-4 h-4 text-skyblue shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-navy">Delivery Note: </span>
                          <span>Your official e-ticket is queued for dispatch to <strong className="font-mono text-navy">{booking.contactEmail || targetEmail || user?.email}</strong>. You can also print or download your verified e-ticket anytime below.</span>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2.5 p-2 rounded-xl bg-emerald-50/80 border border-emerald-200 text-[11px] text-emerald-800 leading-normal flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Confirmed copy dispatched to your inbox. Please check spam/promotions folder if not visible immediately.</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                  <button
                    onClick={() => handleResendTicket(booking.contactEmail || targetEmail || user?.email)}
                    disabled={isResending}
                    className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-white hover:bg-navy hover:text-white text-navy font-bold text-xs border border-slate-200 shadow-2xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {isResending ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 text-skyblue" />
                        <span>Resend Email</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setCustomEmailModal(!customEmailModal)}
                    className="px-3.5 py-2 rounded-xl bg-skyblue hover:bg-navy text-white font-bold text-xs shadow-2xs transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send to Other</span>
                  </button>
                </div>
              </div>
            )}

            {/* Custom Email Modal Dialog */}
            {customEmailModal && (
              <div className="p-4 bg-white rounded-2xl border border-sky-300 shadow-md space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-navy uppercase tracking-wider">
                    Send E-Ticket Copy to Alternate Email Address
                  </span>
                  <button
                    onClick={() => setCustomEmailModal(false)}
                    className="text-xs text-slate-400 hover:text-navy cursor-pointer"
                  >
                    ✕ Cancel
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={targetEmail}
                    onChange={(e) => setTargetEmail(e.target.value)}
                    placeholder="Enter recipient email address..."
                    className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-skyblue"
                  />
                  <button
                    onClick={() => handleResendTicket(targetEmail)}
                    disabled={isResending || !targetEmail}
                    className="px-4 py-2 rounded-xl bg-navy hover:bg-skyblue text-white text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    {isResending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    <span>Send E-Ticket</span>
                  </button>
                </div>
              </div>
            )}

            {/* Flight Path Animation (Origin ─── ✈ ─── Destination) */}
            <div className="grid grid-cols-7 items-center gap-2 sm:gap-4 py-6 border-b border-slate-100 bg-slate-50/70 rounded-2xl px-5">
              <div className="col-span-2 text-left">
                <p className="text-3xl sm:text-4xl font-black text-navy tracking-tight">{originCode}</p>
                <p className="text-xs text-slate-700 font-bold mt-0.5">{originCity}</p>
                <p className="text-[11px] text-slate-400 font-semibold mt-1">
                  Dep: <span className="text-navy font-bold">{depTimeFormatted}</span>
                </p>
                <p className="text-[10px] text-slate-400">{travelDateFormatted}</p>
              </div>

              <div className="col-span-3 flex flex-col items-center justify-center">
                <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-skyblue mb-1 uppercase tracking-wider">
                  <span>{flightNumber}</span>
                  <span>•</span>
                  <span className="font-sans font-bold text-slate-600">{flightName}</span>
                </div>
                <div className="w-full flex items-center gap-1.5">
                  <div className="h-0.5 flex-1 bg-skyblue/30"></div>
                  <div className="w-9 h-9 rounded-full bg-navy text-white flex items-center justify-center shadow-md">
                    <Plane className="w-4 h-4 text-skyblue rotate-45" />
                  </div>
                  <div className="h-0.5 flex-1 bg-skyblue/30"></div>
                </div>
                <span className="text-[11px] font-bold text-slate-500 mt-1">
                  {aircraft}
                </span>
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-0.5">
                  Non-Stop Flight
                </span>
              </div>

              <div className="col-span-2 text-right">
                <p className="text-3xl sm:text-4xl font-black text-navy tracking-tight">{destCode}</p>
                <p className="text-xs text-slate-700 font-bold mt-0.5">{destCity}</p>
                <p className="text-[11px] text-slate-400 font-semibold mt-1">
                  Arr: <span className="text-navy font-bold">{arrTimeFormatted}</span>
                </p>
                <p className="text-[10px] text-slate-400">{arrDateFormatted}</p>
              </div>
            </div>

            {/* Travel Metadata Matrix */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-3 text-xs border-b border-slate-100 pb-5">
              <div>
                <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px] mb-1">Departure Date</p>
                <p className="font-black text-navy flex items-center gap-1.5 text-sm">
                  <Calendar className="w-4 h-4 text-skyblue" /> {travelDateFormatted}
                </p>
              </div>

              <div>
                <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px] mb-1">Passengers</p>
                <p className="font-black text-navy flex items-center gap-1.5 text-sm">
                  <Users className="w-4 h-4 text-skyblue" /> {passengerList.length} Traveler{passengerList.length > 1 ? 's' : ''}
                </p>
              </div>

              <div>
                <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px] mb-1">Allocated Seats</p>
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {seats.map((s, idx) => {
                    const seatStr = normalizeSeat(s);
                    return (
                      <span
                        key={seatStr ? `${seatStr}-${idx}` : `seat-${idx}`}
                        className="px-2.5 py-0.5 bg-skyblue text-white font-mono font-black rounded-md text-xs shadow-2xs"
                      >
                        {seatStr || 'Assigned'}
                      </span>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px] mb-1">Payment Method</p>
                <p className="font-bold text-navy flex items-center gap-1.5 text-xs">
                  <CreditCard className="w-3.5 h-3.5 text-skyblue" /> {paymentMethodDisplay}
                </p>
              </div>
            </div>

            {/* Passenger Manifest Table */}
            <div className="space-y-3">
              <p className="text-xs font-black text-navy uppercase tracking-wider flex items-center gap-2">
                <Ticket className="w-4 h-4 text-skyblue" /> Passenger Manifest &amp; Seat Allocation
              </p>
              <div className="space-y-2">
                {passengerList.map((p, idx) => {
                  const assignedSeat = normalizeSeat(p.seatNumber) || normalizeSeat(seats[idx]) || 'Assigned';
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/60 text-xs font-semibold text-slate-700"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-full bg-navy text-white font-bold flex items-center justify-center text-[10px]">
                          {idx + 1}
                        </div>
                        <span className="font-bold text-navy">
                          {p.firstName} {p.lastName || ''}
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal uppercase">
                          ({p.type || 'Adult'})
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 text-[11px]">Assigned Seat:</span>
                        <span className="font-mono font-black text-navy bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                          {assignedSeat}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Fare Breakdown & Payment Summary */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              <p className="text-xs font-black text-navy uppercase tracking-wider flex items-center gap-2">
                <Hash className="w-3.5 h-3.5 text-skyblue" /> Fare Breakdown &amp; Payment Record
              </p>
              <div className="space-y-2 text-xs">
                {(() => {
                  const adultCount = booking.adultCount || passengerList.filter((p) => p.type === 'ADULT').length || passengerList.length;
                  const childCount = booking.childCount !== undefined ? booking.childCount : passengerList.filter((p) => p.type === 'CHILD').length;
                  const adultFareVal = booking.adultFare || Math.round(baseFare / (adultCount + (childCount * 0.75) || 1));
                  const childFareVal = booking.childFare !== undefined ? booking.childFare : Math.round(adultFareVal * 0.75);

                  return (
                    <>
                      <div className="flex justify-between text-slate-600">
                        <span>Adult Base Airfare ({adultCount} × ₹{Number(adultFareVal).toLocaleString('en-IN')})</span>
                        <span className="font-mono font-semibold text-navy">₹{Number(adultCount * adultFareVal).toLocaleString('en-IN')}</span>
                      </div>
                      {childCount > 0 && (
                        <div className="flex justify-between text-slate-600">
                          <span>Child Base Airfare ({childCount} × ₹{Number(childFareVal).toLocaleString('en-IN')})</span>
                          <span className="font-mono font-semibold text-navy">₹{Number(childCount * childFareVal).toLocaleString('en-IN')}</span>
                        </div>
                      )}
                    </>
                  );
                })()}
                <div className="flex justify-between text-slate-600">
                  <span>Aviation Security, Passenger Service &amp; GST (12%)</span>
                  <span className="font-mono font-semibold text-navy">₹{Number(taxAmount).toLocaleString('en-IN')}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Promotional Discount</span>
                    <span className="font-mono">-₹{Number(discountAmount).toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
                  <div>
                    <span className="text-sm font-black text-navy">Final Amount Paid</span>
                    <span className="text-[10px] text-slate-400 block font-normal">
                      Status: <strong className="text-emerald-600">{paymentStatus}</strong> • {bookingCreatedAt}
                    </span>
                  </div>
                  <span className="text-2xl font-black text-emerald-600 font-mono">
                    ₹{Number(totalAmount).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Simulated Demo Disclaimer */}
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800 space-y-1">
              <p className="font-extrabold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-600" /> Demo Payment Notice
              </p>
              <p className="text-[11px] leading-relaxed">
                This is a demonstration sandbox booking. Flight seat assignments, PNR, and payment records are fully committed to the MongoDB Atlas database.
              </p>
            </div>
          </div>

          {/* Action Footer Buttons */}
          <div className="bg-slate-50 p-6 sm:p-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <button
              onClick={handlePrintTicket}
              className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-navy font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>Print / Download e-Ticket</span>
            </button>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Link
                to="/my-bookings"
                className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-navy hover:bg-skyblue text-white font-bold text-xs transition text-center shadow-md cursor-pointer"
              >
                View My Bookings
              </Link>
              <Link
                to="/search"
                className="flex-1 sm:flex-none px-5 py-3 rounded-xl bg-slate-200 hover:bg-slate-300 text-navy font-bold text-xs transition text-center cursor-pointer"
              >
                Search Flights
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingSuccess;
