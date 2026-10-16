import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { User, Tag, ShieldCheck, ArrowRight, Plane, Armchair, ChevronLeft } from 'lucide-react';
import api from '../lib/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const PassengerDetails = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const initialFlight = location.state?.flight;
  const [flight, setFlight] = useState(initialFlight);

  React.useEffect(() => {
    if (!initialFlight) {
      toast.error('Please select a flight to proceed with booking');
      navigate('/flights', { replace: true });
      return;
    }

    const instanceId = initialFlight._id || initialFlight.id || initialFlight.flightInstanceId;
    if (instanceId) {
      api.get(`/flights/instance/${instanceId}`)
        .then((res) => {
          const freshData = res.data?.flight || res.data?.data?.flight || res.data?.data;
          if (freshData && (freshData.adultFare || freshData.price)) {
            setFlight((prev) => ({
              ...prev,
              ...freshData,
              adultFare: freshData.adultFare || freshData.price || prev?.adultFare || 3500,
              childFare: freshData.childFare !== undefined ? freshData.childFare : prev?.childFare || 2600
            }));
          }
        })
        .catch(() => {});
    }
  }, [initialFlight, navigate]);

  const selectedSeats = location.state?.selectedSeats || [];
  const adultsCount = location.state?.adults || 1;
  const childrenCount = location.state?.children || 0;
  const totalPassengers = adultsCount + childrenCount;

  // Initialize passenger array with Aadhaar and DOB
  const [passengers, setPassengers] = useState(() => {
    const list = [];
    for (let i = 0; i < totalPassengers; i++) {
      const isChild = i >= adultsCount;
      list.push({
        firstName: i === 0 && user?.firstName ? user.firstName : '',
        lastName: i === 0 && user?.lastName ? user.lastName : '',
        type: isChild ? 'CHILD' : 'ADULT',
        seatNumber: selectedSeats[i] || '',
        gender: 'MALE',
        dateOfBirth: '',
        aadhaarNumber: ''
      });
    }
    return list;
  });

  const [contactEmail, setContactEmail] = useState(user?.email || '');
  const [contactPhone, setContactPhone] = useState(user?.phone || '');
  const [promoCode, setPromoCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [promoApplied, setPromoApplied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const currentAdults = passengers.filter((p) => p.type === 'ADULT').length;
  const currentChildren = passengers.filter((p) => p.type === 'CHILD').length;

  const adultFare = Number(flight?.adultFare || flight?.price || flight?.baseFare || 3500);
  const childFare = Number(flight?.childFare !== undefined ? flight?.childFare : Math.round(adultFare * 0.75));
  const baseTotal = currentAdults * adultFare + currentChildren * childFare;
  const taxes = Math.round(baseTotal * 0.12);
  const finalPayable = Math.max(0, baseTotal + taxes - discountAmount);

  if (!flight) {
    return null;
  }

  const handlePassengerChange = (index, field, value) => {
    const updated = [...passengers];
    updated[index][field] = value;
    setPassengers(updated);
  };

  const handleAadhaarChange = (index, value) => {
    // Keep only numbers and max 12 digits
    const digitsOnly = value.replace(/\D/g, '').slice(0, 12);
    // Format as XXXX XXXX XXXX
    const formatted = digitsOnly.replace(/(\d{4})(?=\d)/g, '$1 ');
    handlePassengerChange(index, 'aadhaarNumber', formatted);
  };

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;

    try {
      const res = await api.post('/offers/validate', { code: promoCode.trim().toUpperCase() });
      if (res.data?.discount) {
        const disc = res.data.discount;
        const calcDisc = Math.round((baseTotal * disc) / 100);
        setDiscountPercent(disc);
        setDiscountAmount(calcDisc);
        setPromoApplied(true);
        toast.success(`Promo code applied! ${disc}% discount applied.`);
        return;
      }
    } catch {
      // Check built-in mock promo codes
    }

    const code = promoCode.trim().toUpperCase();
    if (code === 'SKY500') {
      const calcDisc = 500;
      setDiscountPercent(0);
      setDiscountAmount(calcDisc);
      setPromoApplied(true);
      toast.success('Promo code SKY500 applied! Flat ₹500 discount.');
    } else if (code === 'FLYFLY10' || code === 'FLY10') {
      const disc = 10;
      const calcDisc = Math.round((baseTotal * disc) / 100);
      setDiscountPercent(disc);
      setDiscountAmount(calcDisc);
      setPromoApplied(true);
      toast.success('Promo code FLYFLY10 applied! 10% discount applied.');
    } else if (code === 'SKYNEXA25' || code === 'SAVE25') {
      const disc = 25;
      const calcDisc = Math.round((baseTotal * disc) / 100);
      setDiscountPercent(disc);
      setDiscountAmount(calcDisc);
      setPromoApplied(true);
      toast.success('Promo code applied! 25% discount applied.');
    } else {
      toast.error('Invalid or expired promo code');
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!contactEmail || !/\S+@\S+\.\S+/.test(contactEmail)) {
      newErrors.contactEmail = 'Valid contact email is required';
    }
    if (!contactPhone || contactPhone.trim().length < 7) {
      newErrors.contactPhone = 'Valid contact phone number is required';
    }

    passengers.forEach((p, idx) => {
      if (!p.firstName.trim()) {
        newErrors[`p_${idx}_first`] = `Passenger ${idx + 1} first name is required`;
      }
      if (!p.lastName.trim()) {
        newErrors[`p_${idx}_last`] = `Passenger ${idx + 1} last name is required`;
      }

      // Aadhaar Validation
      const rawAadhaar = (p.aadhaarNumber || '').replace(/\s/g, '');
      if (!rawAadhaar) {
        newErrors[`p_${idx}_aadhaar`] = `Passenger ${idx + 1} Aadhaar number is required`;
      } else if (!/^\d{12}$/.test(rawAadhaar)) {
        newErrors[`p_${idx}_aadhaar`] = `Aadhaar must be exactly 12 numeric digits`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please complete all passenger details including valid 12-digit Aadhaar numbers');
      return;
    }

    setSubmitting(true);
    // Format clean passenger payloads with raw Aadhaar numbers
    const formattedPassengers = passengers.map((p) => ({
      ...p,
      aadhaarNumber: (p.aadhaarNumber || '').replace(/\s/g, '')
    }));

    const bookingPayload = {
      flightInstanceId: flight._id || flight.id || flight.flightInstanceId,
      flightId: flight.flightId?._id || flight.flightId || flight._id || flight.id,
      origin: flight.origin,
      destination: flight.destination,
      departureDate: flight.date || flight.travelDate || flight.departureDateTime,
      passengers: formattedPassengers,
      seats: selectedSeats,
      contactEmail,
      contactPhone,
      promoCode: promoApplied ? promoCode : null,
      adultFare,
      childFare,
      baseFare: baseTotal,
      taxAmount: taxes,
      discountAmount,
      totalAmount: finalPayable,
      status: 'PENDING'
    };

    try {
      const res = await api.post('/bookings', bookingPayload);
      const created = res.data?.booking || res.data?.data?.booking || res.data?.data || res.data;
      const bookingId = created?._id || created?.id || created?.bookingReference;

      if (!bookingId) {
        throw new Error('Failed to retrieve booking identifier from server');
      }

      // Navigate to DemoPayment with real database booking record
      navigate('/payment', {
        state: {
          bookingId,
          booking: {
            ...bookingPayload,
            ...(created || {}),
            id: bookingId,
            _id: bookingId,
            adultCount: currentAdults,
            childCount: currentChildren,
            adultFare,
            childFare,
            contactEmail,
            flight
          }
        }
      });
    } catch (err) {
      console.error('Booking creation error:', err);
      toast.error(err.response?.data?.message || 'Failed to initiate booking. Please retry.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-navy transition"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Seat Selection
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Form (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
              <h1 className="text-2xl font-black text-navy mb-2">Passenger Information</h1>
              <p className="text-xs text-slate-500 mb-6">
                Enter names strictly matching the government ID or passport presented at airport security.
              </p>

              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Passenger Cards */}
                {passengers.map((passenger, idx) => (
                  <div
                    key={idx}
                    className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-4"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-navy text-white text-xs font-bold flex items-center justify-center">
                          {idx + 1}
                        </div>
                        <span className="font-bold text-navy text-sm">
                          Passenger {idx + 1}
                        </span>
                        <select
                          value={passenger.type}
                          onChange={(e) => handlePassengerChange(idx, 'type', e.target.value)}
                          className="text-xs font-bold px-2.5 py-1 rounded-xl border border-slate-200 bg-white text-navy focus:outline-none focus:border-skyblue cursor-pointer shadow-2xs"
                        >
                          <option value="ADULT">Adult (₹{adultFare.toLocaleString('en-IN')})</option>
                          <option value="CHILD">Child (₹{childFare.toLocaleString('en-IN')})</option>
                        </select>
                      </div>
                      <span className="px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-bold text-skyblue flex items-center gap-1">
                        <Armchair className="w-3.5 h-3.5" /> Seat {passenger.seatNumber}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* First Name */}
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">
                          First Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={passenger.firstName}
                          onChange={(e) => handlePassengerChange(idx, 'firstName', e.target.value)}
                          placeholder="e.g. Rajesh"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-skyblue focus:ring-2 focus:ring-skyblue/20 text-sm font-medium focus:outline-none bg-white"
                        />
                        {errors[`p_${idx}_first`] && (
                          <span className="text-[11px] text-rose-500 font-semibold mt-1 block">
                            {errors[`p_${idx}_first`]}
                          </span>
                        )}
                      </div>

                      {/* Last Name */}
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">
                          Last Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={passenger.lastName}
                          onChange={(e) => handlePassengerChange(idx, 'lastName', e.target.value)}
                          placeholder="e.g. Sharma"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-skyblue focus:ring-2 focus:ring-skyblue/20 text-sm font-medium focus:outline-none bg-white"
                        />
                        {errors[`p_${idx}_last`] && (
                          <span className="text-[11px] text-rose-500 font-semibold mt-1 block">
                            {errors[`p_${idx}_last`]}
                          </span>
                        )}
                      </div>

                      {/* Gender */}
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Gender</label>
                        <select
                          value={passenger.gender}
                          onChange={(e) => handlePassengerChange(idx, 'gender', e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-skyblue text-sm font-medium focus:outline-none bg-white cursor-pointer"
                        >
                          <option value="MALE">Male</option>
                          <option value="FEMALE">Female</option>
                          <option value="OTHER">Other</option>
                        </select>
                      </div>
                    </div>

                    {/* Aadhaar Number & Date of Birth Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 pt-2">
                      {/* Date of Birth */}
                      <div className="sm:col-span-5">
                        <label className="block text-xs font-bold text-slate-600 mb-1">
                          Date of Birth
                        </label>
                        <input
                          type="date"
                          value={passenger.dateOfBirth}
                          onChange={(e) => handlePassengerChange(idx, 'dateOfBirth', e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-skyblue text-sm font-medium focus:outline-none bg-white cursor-pointer"
                        />
                      </div>

                      {/* Aadhaar Card Number */}
                      <div className="sm:col-span-7">
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-bold text-slate-700">
                            Aadhaar Card Number (12 Digits) <span className="text-rose-500">*</span>
                          </label>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            Mandatory Government ID
                          </span>
                        </div>
                        <div className="relative">
                          <input
                            type="text"
                            required
                            maxLength={14}
                            value={passenger.aadhaarNumber}
                            onChange={(e) => handleAadhaarChange(idx, e.target.value)}
                            placeholder="e.g. 5421 8934 1029"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-skyblue focus:ring-2 focus:ring-skyblue/20 font-mono text-sm tracking-wider font-semibold focus:outline-none bg-white"
                          />
                        </div>
                        {errors[`p_${idx}_aadhaar`] ? (
                          <span className="text-[11px] text-rose-500 font-semibold mt-1 block">
                            {errors[`p_${idx}_aadhaar`]}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 mt-1 block font-medium">
                            Enter the 12-digit Aadhaar number for security verification.
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Contact Information */}
                <div className="p-6 rounded-2xl border border-slate-200 bg-white space-y-4">
                  <h3 className="text-base font-bold text-navy">Primary Contact Details</h3>
                  <p className="text-xs text-slate-500">
                    Booking confirmation and e-tickets will be sent to this email.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">
                        Email Address <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="john.doe@example.com"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-skyblue text-sm font-medium focus:outline-none"
                      />
                      {errors.contactEmail && (
                        <span className="text-[11px] text-rose-500 font-semibold mt-1 block">
                          {errors.contactEmail}
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">
                        Phone Number <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        placeholder="+1 (555) 019-2834"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-skyblue text-sm font-medium focus:outline-none"
                      />
                      {errors.contactPhone && (
                        <span className="text-[11px] text-rose-500 font-semibold mt-1 block">
                          {errors.contactPhone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 bg-navy hover:bg-skyblue text-white font-extrabold rounded-2xl shadow-md transition flex items-center justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer"
                >
                  <span>{submitting ? 'Creating Booking...' : 'Proceed to Payment'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>

          {/* Sidebar Summary (4 cols) */}
          <div className="lg:col-span-4 space-y-6 sticky top-28">
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-6">
              {/* Flight Badge */}
              <div className="pb-4 border-b border-slate-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-skyblue-light text-skyblue flex items-center justify-center">
                  <Plane className="w-5 h-5 rotate-45" />
                </div>
                <div>
                  <h4 className="font-extrabold text-navy text-sm">
                    {flight.origin} → {flight.destination}
                  </h4>
                  <p className="text-xs text-slate-400">
                    {flight.flightNumber} • {flight.date}
                  </p>
                </div>
              </div>

              {/* Promo Code Input */}
              <div>
                <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-2">
                  Promo / Coupon Code
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="e.g. SKYNEXA25"
                    disabled={promoApplied}
                    className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold uppercase tracking-wider focus:outline-none focus:border-skyblue disabled:bg-slate-50"
                  />
                  <button
                    type="button"
                    onClick={handleApplyPromo}
                    disabled={promoApplied || !promoCode}
                    className="px-4 py-2 bg-slate-100 hover:bg-skyblue hover:text-white text-navy font-bold text-xs rounded-xl transition disabled:opacity-50 cursor-pointer"
                  >
                    {promoApplied ? 'Applied' : 'Apply'}
                  </button>
                </div>
                {promoApplied && (
                  <p className="text-[11px] text-emerald-600 font-bold mt-1.5 flex items-center gap-1">
                    <Tag className="w-3 h-3" /> {discountPercent}% discount active!
                  </p>
                )}
              </div>

              {/* Dynamic Adult and Child Price Breakdown */}
              <div className="space-y-2.5 text-xs text-slate-600 border-t border-slate-100 pt-4">
                <div className="flex justify-between">
                  <span>Adults ({currentAdults} × ₹{Number(adultFare).toLocaleString('en-IN')})</span>
                  <span className="font-bold text-navy font-mono">₹{Number(currentAdults * adultFare).toLocaleString('en-IN')}</span>
                </div>
                {currentChildren > 0 && (
                  <div className="flex justify-between">
                    <span>Children ({currentChildren} × ₹{Number(childFare).toLocaleString('en-IN')})</span>
                    <span className="font-bold text-navy font-mono">₹{Number(currentChildren * childFare).toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between pt-1 border-t border-slate-100 font-semibold text-slate-700">
                  <span>Total Base Airfare</span>
                  <span className="font-bold text-navy font-mono">₹{Number(baseTotal).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Taxes & Security Fees (12%)</span>
                  <span className="font-bold text-navy font-mono">₹{Number(taxes).toLocaleString('en-IN')}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>Discount Savings</span>
                    <span className="font-mono">-₹{Number(discountAmount).toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="pt-3 border-t border-slate-100 flex justify-between items-baseline">
                  <span className="font-bold text-navy text-sm">Total Due</span>
                  <span className="text-2xl font-black text-navy font-mono">₹{Number(finalPayable).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="pt-2 text-[11px] text-slate-400 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-skyblue shrink-0" />
                <span>Encrypted transaction with instant seat locking</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PassengerDetails;
