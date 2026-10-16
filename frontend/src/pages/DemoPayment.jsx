import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CreditCard, QrCode, AlertTriangle, ShieldCheck, CheckCircle2, Lock, ArrowRight } from 'lucide-react';
import api from '../lib/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const DemoPayment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const booking = location.state?.booking || {
    id: location.state?.bookingId || 'SKN-982314',
    flight: {
      origin: 'DEL',
      destination: 'BOM',
      flightNumber: 'SK-101',
      date: new Date().toISOString().split('T')[0]
    },
    passengers: [{ firstName: 'Demo', lastName: 'Passenger', seatNumber: '1A' }],
    totalAmount: 3500
  };

  const bookingId = booking.id || booking._id || location.state?.bookingId || 'SKN-982314';

  const [paymentMethod, setPaymentMethod] = useState('CARD'); // CARD | UPI
  const [processing, setProcessing] = useState(false);

  // Pre-filled demo card data
  const [cardNumber] = useState('4242 •••• •••• 4242');
  const [cardHolder] = useState('ALEX M DEMO');
  const [expiry] = useState('12/28');
  const [cvv] = useState('888');

  // Pre-filled demo UPI data
  const [upiId] = useState('demo@upi');

  const handleConfirmPayment = async () => {
    setProcessing(true);
    try {
      const emailToSend = booking.contactEmail || user?.email || '';
      const res = await api.post(`/bookings/${bookingId}/confirm-payment`, {
        paymentMethod: paymentMethod === 'CARD' ? 'DEMO_CARD' : 'DEMO_UPI',
        transactionId: `TXN-DEMO-${Date.now()}`,
        customEmail: emailToSend || undefined,
        contactEmail: emailToSend || undefined
      });

      const confirmedBookingData = res.data?.booking || res.data?.data?.booking || res.data?.data;
      const confirmedPaymentData = res.data?.payment || res.data?.data?.payment;

      toast.success('Payment authorized & e-ticket dispatched to your email!');
      setTimeout(() => {
        const finalRef =
          confirmedBookingData?.bookingReference ||
          booking.bookingReference ||
          `SKN-${Math.floor(100000 + Math.random() * 900000)}`;

        const nextId = confirmedBookingData?._id || confirmedBookingData?.id || bookingId;

        navigate(`/booking-success/${nextId}`, {
          state: {
            booking: {
              ...booking,
              ...(confirmedBookingData || {}),
              payment: confirmedPaymentData || confirmedBookingData?.payment,
              bookingReference: finalRef,
              status: 'CONFIRMED',
              paymentStatus: 'PAID',
              paymentMethod: paymentMethod === 'CARD' ? 'DEMO_CARD' : 'DEMO_UPI',
              paidAt: new Date().toISOString()
            }
          }
        });
      }, 700);
    } catch (err) {
      console.error('Payment confirmation error:', err);
      toast.error(err.response?.data?.message || 'Payment processing failed. Please retry.');
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Simulated Warning Banner */}
        <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-5 flex items-start gap-4 shadow-xs">
          <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700 shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-amber-900">
              SIMULATED PAYMENT - NO REAL MONEY WILL BE CHARGED
            </h2>
            <p className="text-xs text-amber-800 mt-1 leading-relaxed">
              This is a demonstration sandbox environment. All payment inputs below are pre-filled fictional test values. <strong>DO NOT</strong> enter actual credit/debit card numbers or personal banking credentials.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Payment Method & Inputs (8 cols) */}
          <div className="md:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h1 className="text-xl font-black text-navy">Select Demo Method</h1>
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-emerald-600" /> Demo Sandbox
              </span>
            </div>

            {/* Method Tabs */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('CARD')}
                className={`py-3 px-4 rounded-2xl border-2 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
                  paymentMethod === 'CARD'
                    ? 'border-skyblue bg-skyblue-light text-skyblue shadow-xs'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Demo Card</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('UPI')}
                className={`py-3 px-4 rounded-2xl border-2 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
                  paymentMethod === 'UPI'
                    ? 'border-skyblue bg-skyblue-light text-skyblue shadow-xs'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <QrCode className="w-4 h-4" />
                <span>Demo UPI / QR</span>
              </button>
            </div>

            {/* Demo Card Fields */}
            {paymentMethod === 'CARD' ? (
              <div className="space-y-4 pt-2">
                <div className="p-3 bg-slate-50 rounded-xl text-[11px] font-semibold text-slate-500 border border-slate-200">
                  ⚠️ TEST DATA - DO NOT ENTER REAL DETAILS
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Demo Card Number
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={cardNumber}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-100/70 font-mono text-sm font-bold text-navy select-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Cardholder Name
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={cardHolder}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-100/70 font-mono text-sm font-bold text-navy select-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      Expiry Date
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={expiry}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-100/70 font-mono text-sm font-bold text-navy select-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      CVV Code
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={cvv}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-100/70 font-mono text-sm font-bold text-navy select-none"
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* Demo UPI Section */
              <div className="space-y-4 pt-2 text-center">
                <div className="p-3 bg-slate-50 rounded-xl text-[11px] font-semibold text-slate-500 border border-slate-200 text-left">
                  ⚠️ TEST DATA - DO NOT ENTER REAL DETAILS
                </div>

                {/* Simulated QR Code */}
                <div className="w-44 h-44 mx-auto bg-slate-100 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center p-4">
                  <QrCode className="w-20 h-20 text-navy mb-2" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Simulated QR Code
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1 text-left">
                    Demo UPI Virtual Address
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={upiId}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-100/70 font-mono text-sm font-bold text-navy select-none text-center"
                  />
                </div>
              </div>
            )}

            {/* Confirm Button */}
            <button
              type="button"
              onClick={handleConfirmPayment}
              disabled={processing}
              className="w-full py-4 bg-skyblue hover:bg-navy text-white font-extrabold rounded-2xl shadow-lg hover:shadow-xl transition flex items-center justify-center gap-2 text-base cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>
                {processing ? 'Processing Demo Payment...' : 'Confirm Demo Payment'}
              </span>
            </button>

            <p className="text-center text-[11px] text-slate-400">
              By clicking confirm, you trigger a mock transaction confirmation event for this test booking.
            </p>
          </div>

          {/* Booking Summary Sidebar (5 cols) */}
          <div className="md:col-span-5 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
            <h3 className="text-base font-extrabold text-navy border-b border-slate-100 pb-3">
              Order Overview
            </h3>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="flex justify-between">
                <span className="text-slate-400">Booking Reference</span>
                <span className="font-mono font-bold text-navy">{bookingId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Route</span>
                <span className="font-bold text-navy">
                  {booking.flight?.origin || booking.origin || 'DEL'} → {booking.flight?.destination || booking.destination || 'BOM'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Travel Date</span>
                <span className="font-semibold text-navy">
                  {booking.flight?.date || booking.departureDate || new Date().toISOString().split('T')[0]}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Passengers</span>
                <span className="font-semibold text-navy">
                  {booking.passengers?.length || (Number(booking.adultCount || 1) + Number(booking.childCount || 0))} Person(s)
                </span>
              </div>
              {booking.adultCount !== undefined && booking.adultCount > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Adults ({booking.adultCount} × ₹{Number(booking.adultFare || 3500).toLocaleString('en-IN')})</span>
                  <span className="font-semibold text-navy font-mono">₹{Number(booking.adultCount * (booking.adultFare || 3500)).toLocaleString('en-IN')}</span>
                </div>
              )}
              {booking.childCount !== undefined && booking.childCount > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Children ({booking.childCount} × ₹{Number(booking.childFare || 2600).toLocaleString('en-IN')})</span>
                  <span className="font-semibold text-navy font-mono">₹{Number(booking.childCount * (booking.childFare || 2600)).toLocaleString('en-IN')}</span>
                </div>
              )}
              {booking.taxAmount !== undefined && booking.taxAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Aviation Security & GST (12%)</span>
                  <span className="font-semibold text-navy font-mono">₹{Number(booking.taxAmount).toLocaleString('en-IN')}</span>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-between items-baseline">
              <span className="text-sm font-extrabold text-navy">Total Amount</span>
              <span className="text-3xl font-black text-emerald-600 font-mono">
                ₹{Number(booking.totalAmount || 3500).toLocaleString('en-IN')}
              </span>
            </div>

            <div className="p-3 bg-skyblue-light rounded-xl text-skyblue text-xs font-semibold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Free instant confirmation upon verification</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoPayment;
