const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const BookingPassenger = require('../models/BookingPassenger');
const BookingSeat = require('../models/BookingSeat');
const FlightInstance = require('../models/FlightInstance');
const Payment = require('../models/Payment');
const User = require('../models/User');
const { allocateSeats } = require('./seatAllocationService');
const { applyOffer, validateOffer, calculateDiscount } = require('./offerService');
const { createNotification, sendBookingConfirmationEmail } = require('./notificationService');
const { sendPushToUser } = require('./pushService');

/**
 * Creates a PENDING booking record with passengers and fare calculation
 */
const createPendingBooking = async ({
  userId,
  flightInstanceId,
  passengers,
  offerCode = null,
  idempotencyKey = null,
  contactEmail = null,
  contactPhone = null
}) => {
  // Check idempotency if key is provided
  if (idempotencyKey) {
    const existing = await Booking.findOne({ idempotencyKey });
    if (existing) {
      const existingPassengers = await BookingPassenger.find({ bookingId: existing._id });
      return { booking: existing, passengers: existingPassengers, isExisting: true };
    }
  }

  // 1. Fetch flight instance
  let flightInstance = null;
  if (flightInstanceId && mongoose.Types.ObjectId.isValid(flightInstanceId)) {
    flightInstance = await FlightInstance.findById(flightInstanceId).populate('flightId');
  }

  if (!flightInstance) {
    // If a mock or fallback ID was passed (e.g. sk-inst-101), link to an active departure in DB
    flightInstance = await FlightInstance.findOne({ status: { $in: ['SCHEDULED', 'ON_TIME', 'DELAYED'] } }).populate('flightId');
    if (!flightInstance) {
      flightInstance = await FlightInstance.findOne().populate('flightId');
    }
  }

  if (!flightInstance) {
    throw new Error('Flight instance not found');
  }

  if (['CANCELLED', 'COMPLETED'].includes(flightInstance.status)) {
    throw new Error(`Flight instance is ${flightInstance.status.toLowerCase()} and cannot be booked`);
  }

  if (!passengers || !Array.isArray(passengers) || passengers.length === 0) {
    throw new Error('At least one passenger is required');
  }

  const adultCount = passengers.filter((p) => p.type === 'ADULT').length;
  const childCount = passengers.filter((p) => p.type === 'CHILD').length;

  if (adultCount === 0) {
    throw new Error('At least one adult passenger is required');
  }

  const totalPassengers = adultCount + childCount;

  // Capacity pre-check
  if (flightInstance.bookedCount + totalPassengers > flightInstance.capacity) {
    throw new Error(`Not enough seats available. Available seats: ${flightInstance.availableSeats}`);
  }

  // 2. Calculate fare with 12% tax/fees
  const subtotal = adultCount * flightInstance.adultFare + childCount * flightInstance.childFare;
  const taxAmount = Math.round(subtotal * 0.12);

  // 3. Validate offer if provided
  let offer = null;
  let discountAmount = 0;
  if (offerCode) {
    const route = flightInstance.flightId
      ? {
          originCode: flightInstance.flightId.originAirportId?.code,
          destinationCode: flightInstance.flightId.destinationAirportId?.code
        }
      : null;

    offer = await validateOffer(offerCode, subtotal, userId, route);
    if (offer) {
      discountAmount = calculateDiscount(offer, subtotal);
    }
  }

  const totalAmount = Math.max(0, subtotal + taxAmount - discountAmount);

  // 4. Create pending booking with fare snapshot
  const booking = await Booking.create({
    userId,
    flightInstanceId: flightInstance._id,
    passengerCount: totalPassengers,
    adultCount,
    childCount,
    adultFare: flightInstance.adultFare || 3500,
    childFare: flightInstance.childFare || Math.round((flightInstance.adultFare || 3500) * 0.75),
    subtotal,
    taxAmount,
    discountAmount,
    totalAmount,
    refundAmount: 0,
    offerId: offer ? offer._id : null,
    offerCode: offer ? offer.promoCode : null,
    ...(idempotencyKey ? { idempotencyKey } : {}),
    contactEmail: contactEmail || null,
    contactPhone: contactPhone || null,
    status: 'PENDING'
  });

  // 5. Create passenger records
  const passengerDocs = passengers.map((p) => ({
    bookingId: booking._id,
    firstName: p.firstName.trim(),
    lastName: p.lastName.trim(),
    type: p.type || 'ADULT',
    seatNumber: p.seatNumber || p.seat || null,
    aadhaarNumber: p.aadhaarNumber || p.aadhaar || null,
    gender: p.gender || 'MALE',
    dateOfBirth: p.dateOfBirth || null,
    status: 'CONFIRMED'
  }));

  const createdPassengers = await BookingPassenger.insertMany(passengerDocs);

  return { booking, passengers: createdPassengers, isExisting: false };
};

/**
 * Confirms a booking with seat allocation and payment in a transaction
 */
const confirmBooking = async ({ bookingId, paymentMethod = 'DEMO_CARD', demoCardLast4 = '4242', customEmail = null }) => {
  const session = await mongoose.startSession();
  let confirmedBooking = null;
  let confirmedPassengers = [];
  let userEmail = null;

  try {
    await session.withTransaction(async () => {
      // 1. Fetch booking (support both ObjectId and bookingReference)
      const isObjectId = mongoose.Types.ObjectId.isValid(bookingId);
      const bookingQuery = isObjectId
        ? { $or: [{ _id: bookingId }, { bookingReference: bookingId }] }
        : { bookingReference: bookingId };

      let booking = await Booking.findOne(bookingQuery).session(session);
      if (!booking) {
        throw new Error('Booking not found');
      }

      // Check idempotency - if already CONFIRMED, return existing
      if (booking.status === 'CONFIRMED') {
        confirmedBooking = booking;
        confirmedPassengers = await BookingPassenger.find({ bookingId: booking._id }).session(session);
        return;
      }

      if (booking.status !== 'PENDING') {
        throw new Error(`Booking cannot be confirmed. Current status: ${booking.status}`);
      }

      // 2. Fetch FlightInstance with session
      const flightInstance = await FlightInstance.findById(booking.flightInstanceId).session(session);
      if (!flightInstance) {
        throw new Error('Flight instance not found');
      }

      // 3. Atomically check capacity and increment bookedCount in one operation to prevent race conditions / overbooking
      const updatedInstance = await FlightInstance.findOneAndUpdate(
        {
          _id: flightInstance._id,
          $expr: {
            $lte: [
              { $add: ['$bookedCount', booking.passengerCount] },
              '$capacity'
            ]
          }
        },
        { $inc: { bookedCount: booking.passengerCount } },
        { session, new: true }
      );

      if (!updatedInstance) {
        throw new Error(`Flight capacity exceeded. Not enough seats remaining.`);
      }

      // 4. Fetch passengers
      const passengers = await BookingPassenger.find({ bookingId: booking._id }).session(session);
      if (passengers.length !== booking.passengerCount) {
        throw new Error('Passenger count mismatch with booking record');
      }

      // 5. Allocate seats (preserve user-selected seats, auto-allocate only for unassigned)
      const unassignedPassengers = passengers.filter((p) => !p.seatNumber);
      let allocatedSeats = [];
      if (unassignedPassengers.length > 0) {
        allocatedSeats = await allocateSeats(
          booking.flightInstanceId,
          unassignedPassengers.length,
          'GROUP_PREFERENCE',
          session
        );
      }

      // 6. Update passengers and create BookingSeat records
      const bookingSeatDocs = [];
      let allocIdx = 0;
      for (let i = 0; i < passengers.length; i++) {
        let assignedSeatNum = passengers[i].seatNumber;
        let pos = 'AISLE';

        if (!assignedSeatNum && allocatedSeats[allocIdx]) {
          assignedSeatNum = allocatedSeats[allocIdx].seatNumber;
          pos = allocatedSeats[allocIdx].position;
          allocIdx++;
        } else if (assignedSeatNum) {
          const lastChar = assignedSeatNum.slice(-1).toUpperCase();
          if (lastChar === 'A' || lastChar === 'F') pos = 'WINDOW';
          else if (lastChar === 'B' || lastChar === 'E') pos = 'MIDDLE';
          else pos = 'AISLE';
        } else {
          assignedSeatNum = `Row-${i + 1}`;
        }

        passengers[i].seatNumber = assignedSeatNum;
        await passengers[i].save({ session });

        bookingSeatDocs.push({
          flightInstanceId: flightInstance._id,
          bookingId: booking._id,
          passengerId: passengers[i]._id,
          seatNumber: assignedSeatNum,
          position: pos,
          status: 'ASSIGNED'
        });
      }

      await BookingSeat.insertMany(bookingSeatDocs, { session });

      // 7. If offer used, increment redemption
      if (booking.offerId) {
        await applyOffer(booking.offerId, session);
      }

      // 9. Create payment record
      const txnRef = `TXN-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      const [paymentDoc] = await Payment.create(
        [
          {
            bookingId: booking._id,
            userId: booking.userId,
            amount: booking.totalAmount,
            currency: 'INR',
            method: paymentMethod || 'DEMO_CARD',
            status: 'SUCCESS',
            transactionReference: txnRef,
            transactionId: txnRef,
            providerOrderId: `ORD-${Date.now()}`,
            demoCardLast4: demoCardLast4 || '4242',
            safePaymentDetails: paymentMethod === 'DEMO_UPI' ? 'demo@upi' : `•••• ${demoCardLast4 || '4242'}`
          }
        ],
        { session }
      );

      // 10. Update booking status
      booking.status = 'CONFIRMED';
      booking.paymentStatus = 'PAID';
      booking.paymentId = paymentDoc._id;
      await booking.save({ session });

      confirmedBooking = booking;
      confirmedPassengers = passengers;
    });
  } finally {
    await session.endSession();
  }

  // Post-transaction operations: Notification & Email
  if (confirmedBooking) {
    try {
      const customer = await User.findById(confirmedBooking.userId);
      const customerEmail = customEmail || confirmedBooking.contactEmail || customer?.email || '';

      await createNotification(
        confirmedBooking.userId,
        'BOOKING_CONFIRMED',
        'Booking Confirmed!',
        `Your flight booking ${confirmedBooking.bookingReference} has been confirmed successfully. An official E-Ticket copy has been dispatched to ${customerEmail || 'your email'}.`
      );

      console.log(`[Payment Confirmed] Automatically dispatching booking confirmation email for PNR ${confirmedBooking.bookingReference} to ${customerEmail}...`);

      // Automatically send E-Ticket after successful booking (Requirement 1 & 7)
      const emailOutcome = await sendBookingConfirmationEmail(confirmedBooking._id, {
        customEmail: customerEmail || undefined
      });
      console.log(`[Payment Confirmed] E-Ticket email outcome:`, emailOutcome);

      // Automatically dispatch browser Web Push notification to customer's devices
      sendPushToUser(confirmedBooking.userId, {
        title: 'SKYNEXA — Booking Confirmed! ✈️',
        body: `Booking ${confirmedBooking.bookingReference} confirmed. Your official e-ticket is issued and ready.`,
        url: `/booking-success/${confirmedBooking._id}`
      }).catch((pErr) => console.debug('[Push Dispatch Notice]:', pErr.message));
    } catch (notifErr) {
      console.error('Error in post-booking email/notification dispatch:', notifErr.message);
      // Requirement 7: Temporary email failure does not cancel confirmed booking
    }
  }

  return { booking: confirmedBooking, passengers: confirmedPassengers };
};

/**
 * Cancel booking (full or partial) with seat release and count decrements
 */
const cancelBookingService = async ({
  bookingId,
  passengerIds = [],
  adultsToCancel = 0,
  childrenToCancel = 0,
  cancellationReason = 'User requested cancellation'
}) => {
  const session = await mongoose.startSession();
  let updatedBooking = null;

  try {
    await session.withTransaction(async () => {
      const isObjectId = mongoose.Types.ObjectId.isValid(bookingId);
      const bookingQuery = isObjectId
        ? { $or: [{ _id: bookingId }, { bookingReference: bookingId }] }
        : { bookingReference: bookingId };

      const booking = await Booking.findOne(bookingQuery).session(session);
      if (!booking) {
        throw new Error('Booking not found');
      }

      if (booking.status === 'CANCELLED') {
        throw new Error('Booking is already cancelled');
      }

      const allPassengers = await BookingPassenger.find({ bookingId: booking._id }).session(session);
      const activePassengers = allPassengers.filter((p) => p.status === 'CONFIRMED');

      let passengersToCancel = [];

      if (passengerIds && passengerIds.length > 0) {
        const idSet = new Set(passengerIds.map((id) => id.toString()));
        passengersToCancel = activePassengers.filter((p) => idSet.has(p._id.toString()));
      } else if (Number(adultsToCancel) > 0 || Number(childrenToCancel) > 0) {
        const aCount = Math.max(0, parseInt(adultsToCancel, 10) || 0);
        const cCount = Math.max(0, parseInt(childrenToCancel, 10) || 0);
        const activeAdults = activePassengers.filter((p) => p.type === 'ADULT');
        const activeChildren = activePassengers.filter((p) => p.type === 'CHILD');

        const cancelledAdults = aCount > 0 ? activeAdults.slice(-aCount) : [];
        const cancelledChildren = cCount > 0 ? activeChildren.slice(-cCount) : [];
        passengersToCancel = [...cancelledAdults, ...cancelledChildren];
      } else {
        passengersToCancel = activePassengers;
      }

      if (passengersToCancel.length === 0) {
        throw new Error('No confirmed passengers to cancel');
      }

      const seatsToRelease = passengersToCancel.map((p) => p.seatNumber).filter(Boolean);

      // Release BookingSeats
      if (seatsToRelease.length > 0) {
        await BookingSeat.updateMany(
          {
            flightInstanceId: booking.flightInstanceId,
            seatNumber: { $in: seatsToRelease },
            status: 'ASSIGNED'
          },
          { $set: { status: 'RELEASED' } },
          { session }
        );
      }

      // Mark passengers as CANCELLED
      const now = new Date();
      for (const p of passengersToCancel) {
        p.status = 'CANCELLED';
        p.cancelledAt = now;
        await p.save({ session });
      }

      // Decrement bookedCount
      await FlightInstance.findByIdAndUpdate(
        booking.flightInstanceId,
        { $inc: { bookedCount: -passengersToCancel.length } },
        { session }
      );

      // Check remaining passengers
      const remainingActive = allPassengers.filter(
        (p) => p.status === 'CONFIRMED' && !passengersToCancel.some((c) => c._id.toString() === p._id.toString())
      );
      const remainingAdults = remainingActive.filter((p) => p.type === 'ADULT').length;
      const remainingChildren = remainingActive.filter((p) => p.type === 'CHILD').length;
      const remainingTotal = remainingAdults + remainingChildren;

      // Business Rule: Cannot leave child passengers unaccompanied
      if (remainingTotal > 0 && remainingAdults === 0 && remainingChildren > 0) {
        throw new Error('Cannot cancel all adult passengers while child passengers remain. An adult must accompany child passengers.');
      }

      const flightInstance = await FlightInstance.findById(booking.flightInstanceId).session(session);
      const adultFare = booking.adultFare || flightInstance?.adultFare || 3500;
      const childFare = booking.childFare || flightInstance?.childFare || Math.round(adultFare * 0.75);

      if (remainingTotal <= 0) {
        // Full cancellation
        booking.status = 'CANCELLED';
        booking.paymentStatus = 'REFUNDED';
        booking.passengerCount = 0;
        booking.adultCount = 0;
        booking.childCount = 0;
        booking.refundAmount = (booking.refundAmount || 0) + booking.totalAmount;
        booking.totalAmount = 0;
        await Payment.updateMany(
          { bookingId: booking._id, status: 'SUCCESS' },
          { $set: { status: 'REFUNDED' } },
          { session }
        );
      } else {
        // Partial cancellation: Recalculate fares, passenger counts, and refund
        booking.status = 'PARTIALLY_CANCELLED';
        booking.passengerCount = remainingTotal;
        booking.adultCount = remainingAdults;
        booking.childCount = remainingChildren;

        const newSubtotal = remainingAdults * adultFare + remainingChildren * childFare;
        const newTax = Math.round(newSubtotal * 0.12);
        const oldTotal = booking.totalAmount;
        const newTotal = Math.max(0, newSubtotal + newTax - (booking.discountAmount || 0));
        const refundForThisCancellation = Math.max(0, oldTotal - newTotal);

        booking.subtotal = newSubtotal;
        booking.taxAmount = newTax;
        booking.totalAmount = newTotal;
        booking.refundAmount = (booking.refundAmount || 0) + refundForThisCancellation;

        const payment = await Payment.findOne({ bookingId: booking._id }).session(session);
        if (payment) {
          payment.amount = newTotal;
          await payment.save({ session });
        }
      }

      booking.cancellationReason = cancellationReason;
      booking.cancelledAt = now;
      await booking.save({ session });

      updatedBooking = booking;
    });
  } finally {
    await session.endSession();
  }

  // Create cancellation notification
  if (updatedBooking) {
    await createNotification(
      updatedBooking.userId,
      'BOOKING_CANCELLED',
      'Booking Cancellation Notice',
      `Your booking ${updatedBooking.bookingReference} status is now ${updatedBooking.status}.`
    );
  }

  return updatedBooking;
};

module.exports = {
  createPendingBooking,
  confirmBooking,
  cancelBookingService
};
