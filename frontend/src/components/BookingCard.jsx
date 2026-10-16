import React from 'react';
import { Link } from 'react-router-dom';
import { Plane, Calendar, Users, Armchair, ChevronRight, Printer, CreditCard } from 'lucide-react';

const BookingCard = ({ booking, onCancel }) => {
  const id = booking.id || booking._id;
  const bookingReference = booking.bookingReference || booking.pnr || `SKN-${(id || '1000').slice(-6).toUpperCase()}`;

  const flightInstance = booking.flightInstanceId || booking.flightInstance || {};
  const flight = flightInstance.flightId || flightInstance.flight || booking.flight || {};
  const flightNumber = flight.flightCode || flight.flightNumber || booking.flightNumber || 'SK-101';
  const flightName = flight.flightName || booking.flightName || 'Skynexa Airways';

  const origObj = flight.originAirportId || flightInstance.originAirportId || flightInstance.origin || flight.origin || booking.origin;
  const destObj = flight.destinationAirportId || flightInstance.destinationAirportId || flightInstance.destination || flight.destination || booking.destination;

  const originCode = typeof origObj === 'object' && origObj !== null ? (origObj.code || origObj.city || 'DEL') : (origObj || 'DEL');
  const originCity = typeof origObj === 'object' && origObj !== null ? (origObj.city || origObj.name || originCode) : originCode;

  const destCode = typeof destObj === 'object' && destObj !== null ? (destObj.code || destObj.city || 'BOM') : (destObj || 'BOM');
  const destCity = typeof destObj === 'object' && destObj !== null ? (destObj.city || destObj.name || destCode) : destCode;

  const rawDate = flightInstance.departureDateTime || booking.departureDate || booking.travelDate || flightInstance.travelDate;
  const departureDate = rawDate
    ? new Date(rawDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  let departureTime = '08:30 AM';
  if (flightInstance.departureDateTime) {
    departureTime = new Date(flightInstance.departureDateTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  } else if (flight.departureTime || booking.departureTime) {
    departureTime = flight.departureTime || booking.departureTime;
  }

  const normalizeSeat = (s) => {
    if (!s) return '';
    if (typeof s === 'string') return s;
    if (typeof s === 'object') return s.seatNumber || s.seat || s.code || '';
    return String(s);
  };

  const passengers = booking.passengers || [];
  const passengerCount = passengers.length || booking.passengerCount || 1;
  const seats = (
    booking.seats && booking.seats.length > 0
      ? booking.seats
      : passengers.map((p) => p.seatNumber)
  ).map(normalizeSeat).filter(Boolean);

  const totalAmount = booking.totalAmount || booking.finalAmount || booking.amount || 3500;
  const status = (booking.status || 'CONFIRMED').toUpperCase();
  const paymentStatus = (booking.paymentStatus || (status === 'CONFIRMED' ? 'PAID' : status === 'CANCELLED' ? 'REFUNDED' : 'PENDING')).toUpperCase();

  const getStatusBadge = () => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'PENDING':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'CANCELLED':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'COMPLETED':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getPaymentBadge = () => {
    switch (paymentStatus) {
      case 'PAID':
      case 'SUCCESS':
        return 'bg-emerald-50 text-emerald-700 border-emerald-300';
      case 'REFUNDED':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'FAILED':
        return 'bg-rose-50 text-rose-700 border-rose-300';
      default:
        return 'bg-amber-50 text-amber-700 border-amber-300';
    }
  };

  const handlePrint = (e) => {
    e.stopPropagation();
    window.print();
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 hover:border-slate-300 p-6 shadow-xs hover:shadow-md transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-navy/5 flex items-center justify-center text-navy">
            <Plane className="w-5 h-5 text-skyblue" />
          </div>
          <div>
            <span className="text-xs font-mono text-slate-400 font-bold uppercase tracking-wider block">
              Ref #{bookingReference}
            </span>
            <h4 className="text-base font-extrabold text-navy">
              {flightNumber} • {flightName}
            </h4>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${getStatusBadge()}`}>
            {status}
          </span>
          <span className={`px-2.5 py-0.5 text-xs font-mono font-bold rounded-full border ${getPaymentBadge()}`}>
            {paymentStatus}
          </span>
          <span className="text-lg font-black text-navy ml-2">
            ₹{Number(totalAmount).toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Route & Schedule */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4 items-center">
        <div className="flex items-center gap-3">
          <div>
            <p className="text-2xl font-black text-navy">{originCode}</p>
            <p className="text-xs text-slate-500 font-semibold truncate max-w-[120px]">{originCity}</p>
          </div>
          <div className="flex-1 flex flex-col items-center px-2">
            <Plane className="w-4 h-4 text-skyblue rotate-90" />
            <div className="w-full border-t border-dashed border-slate-300 my-1"></div>
          </div>
          <div>
            <p className="text-2xl font-black text-navy">{destCode}</p>
            <p className="text-xs text-slate-500 font-semibold truncate max-w-[120px]">{destCity}</p>
          </div>
        </div>

        <div className="space-y-1 text-xs text-slate-600 md:border-l md:border-slate-100 md:pl-4">
          <p className="flex items-center gap-1.5 font-medium">
            <Calendar className="w-3.5 h-3.5 text-skyblue" /> {departureDate} • {departureTime}
          </p>
          <p className="flex items-center gap-1.5 font-medium">
            <Users className="w-3.5 h-3.5 text-skyblue" /> {passengerCount} Passenger{passengerCount > 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex items-center justify-between md:justify-end gap-2 md:border-l md:border-slate-100 md:pl-4">
          {seats.length > 0 && (
            <div className="flex items-center gap-1.5">
              <Armchair className="w-4 h-4 text-slate-400" />
              <div className="flex flex-wrap gap-1">
                {seats.map((s, idx) => {
                  const seatStr = normalizeSeat(s);
                  return (
                    <span
                      key={seatStr ? `${seatStr}-${idx}` : `card-seat-${idx}`}
                      className="px-2 py-0.5 bg-sky-50 text-skyblue border border-sky-200 font-mono font-bold rounded text-xs"
                    >
                      {seatStr}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <span className="text-xs text-slate-400">
          Booked on {booking.createdAt ? new Date(booking.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recent'}
        </span>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {status === 'CONFIRMED' && onCancel && (
            <button
              onClick={() => onCancel(booking)}
              className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
            >
              Cancel Booking
            </button>
          )}

          {status === 'PENDING' && (
            <Link
              to="/payment"
              state={{ bookingId: id, booking }}
              className="px-3.5 py-1.5 text-xs font-extrabold text-white bg-skyblue hover:bg-navy rounded-lg transition flex items-center gap-1 cursor-pointer"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Complete Payment</span>
            </Link>
          )}

          <button
            onClick={handlePrint}
            title="Print or download confirmation"
            className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-navy bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition flex items-center gap-1 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>

          <Link
            to={`/booking-success/${id}`}
            className="px-4 py-1.5 text-xs font-bold text-navy bg-slate-100 hover:bg-navy hover:text-white rounded-lg transition flex items-center gap-1"
          >
            <span>View Ticket</span>
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BookingCard;
