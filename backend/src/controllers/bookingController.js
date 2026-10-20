const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const BookingPassenger = require('../models/BookingPassenger');
const BookingSeat = require('../models/BookingSeat');
const Payment = require('../models/Payment');
const {
  createPendingBooking,
  confirmBooking,
  cancelBookingService
} = require('../services/bookingService');
const { sendBookingConfirmationEmail } = require('../services/notificationService');

const findBookingByIdOrRef = async (id, session = null) => {
  if (!id) return null;
  const isObjectId = mongoose.Types.ObjectId.isValid(id);
  const query = isObjectId
    ? { $or: [{ _id: id }, { bookingReference: id }] }
    : { bookingReference: id };
  let q = Booking.findOne(query);
  if (session) q = q.session(session);
  return q;
};

// @desc    Create a pending booking with passengers
// @route   POST /api/bookings
// @access  Private
const createBooking = async (req, res, next) => {
  try {
    const { flightInstanceId, passengers, offerCode, idempotencyKey, contactEmail, contactPhone } = req.body;

    if (!flightInstanceId || !passengers || !Array.isArray(passengers) || passengers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Flight instance ID and at least one passenger are required'
      });
    }

    const result = await createPendingBooking({
      userId: req.user._id,
      flightInstanceId,
      passengers,
      offerCode,
      idempotencyKey,
      contactEmail: contactEmail || req.user.email,
      contactPhone: contactPhone || req.user.phone
    });

    res.status(result.isExisting ? 200 : 201).json({
      success: true,
      message: result.isExisting ? 'Existing booking retrieved' : 'Pending booking created',
      booking: result.booking,
      passengers: result.passengers,
      data: {
        booking: result.booking,
        passengers: result.passengers
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Confirm booking and execute payment in MongoDB transaction
// @route   POST /api/bookings/:id/confirm-payment
// @access  Private
const confirmPayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { paymentMethod, demoCardLast4, customEmail, contactEmail } = req.body;

    let booking = await findBookingByIdOrRef(id);

    // If ID was a client fallback, look for latest pending booking of user
    if (!booking) {
      booking = await Booking.findOne({ userId: req.user._id, status: 'PENDING' }).sort({ createdAt: -1 });
    }

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Ownership check (only creator or admin can confirm)
    if (
      booking.userId.toString() !== req.user._id.toString() &&
      req.user.role !== 'SUPER_ADMIN'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to this booking'
      });
    }

    const emailToUse = customEmail || contactEmail || booking.contactEmail || req.user?.email || null;

    const result = await confirmBooking({
      bookingId: booking._id,
      paymentMethod: paymentMethod || 'DEMO_CARD',
      demoCardLast4: demoCardLast4 || '4242',
      customEmail: emailToUse
    });

    // Fetch populated booking
    const populated = await Booking.findById(result.booking._id)
      .populate({
        path: 'flightInstanceId',
        populate: [
          {
            path: 'flightId',
            populate: [
              { path: 'originAirportId', model: 'Airport' },
              { path: 'destinationAirportId', model: 'Airport' },
              { path: 'aircraftLayoutId', model: 'AircraftLayout' }
            ]
          },
          { path: 'scheduleId' }
        ]
      })
      .populate('offerId');

    const payment = await Payment.findOne({ bookingId: result.booking._id }).sort({ createdAt: -1 });

    const populatedObj = populated.toObject({ virtuals: true });
    populatedObj.passengers = result.passengers;
    populatedObj.payment = payment;
    populatedObj.seats = result.passengers.map((p) => p.seatNumber).filter(Boolean);
    populatedObj.paymentStatus = 'PAID';

    res.json({
      success: true,
      message: 'Booking and payment confirmed successfully. Official E-Ticket pushed to email.',
      booking: populatedObj,
      passengers: result.passengers,
      payment,
      data: {
        booking: populatedObj,
        passengers: result.passengers,
        payment
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get payment and booking status
// @route   GET /api/bookings/:id/payment-status
// @access  Private
const getPaymentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    let booking = await findBookingByIdOrRef(id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    const isOwner = booking.userId.toString() === req.user._id.toString();
    const isAdmin = ['SCHEDULE_ADMIN', 'SUPER_ADMIN'].includes(req.user.role);

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this booking'
      });
    }

    const payment = await Payment.findOne({ bookingId: booking._id }).sort({ createdAt: -1 });

    res.json({
      success: true,
      bookingStatus: booking.status,
      paymentStatus: payment ? payment.status : booking.paymentStatus || 'PENDING',
      payment,
      data: {
        bookingId: booking._id,
        bookingReference: booking.bookingReference,
        bookingStatus: booking.status,
        paymentStatus: payment ? payment.status : booking.paymentStatus || 'PENDING',
        payment
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all bookings for logged-in user
// @route   GET /api/bookings/my-bookings
// @access  Private
const getMyBookings = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const query = { userId: req.user._id };
    if (req.query.status) {
      query.status = req.query.status.toUpperCase();
    }

    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate({
          path: 'flightInstanceId',
          populate: [
            {
              path: 'flightId',
              populate: [
                { path: 'originAirportId', model: 'Airport' },
                { path: 'destinationAirportId', model: 'Airport' },
                { path: 'aircraftLayoutId', model: 'AircraftLayout' }
              ]
            },
            { path: 'scheduleId' }
          ]
        })
        .populate('offerId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Booking.countDocuments(query)
    ]);

    // Attach passengers, payments, and seats to each booking
    const bookingIds = bookings.map((b) => b._id);
    const [passengers, payments, seats] = await Promise.all([
      BookingPassenger.find({ bookingId: { $in: bookingIds } }),
      Payment.find({ bookingId: { $in: bookingIds } }),
      BookingSeat.find({ bookingId: { $in: bookingIds } })
    ]);

    const passengersByBooking = new Map();
    passengers.forEach((p) => {
      const bId = p.bookingId.toString();
      if (!passengersByBooking.has(bId)) {
        passengersByBooking.set(bId, []);
      }
      passengersByBooking.get(bId).push(p);
    });

    const paymentsByBooking = new Map();
    payments.forEach((pay) => {
      paymentsByBooking.set(pay.bookingId.toString(), pay);
    });

    const seatsByBooking = new Map();
    seats.forEach((s) => {
      const bId = s.bookingId.toString();
      if (!seatsByBooking.has(bId)) {
        seatsByBooking.set(bId, []);
      }
      seatsByBooking.get(bId).push(s.seatNumber);
    });

    const formattedBookings = bookings.map((b) => {
      const obj = b.toObject({ virtuals: true });
      const bIdStr = b._id.toString();
      obj.passengers = passengersByBooking.get(bIdStr) || [];
      const seatList = seatsByBooking.get(bIdStr) || [];
      obj.seats = seatList.length > 0 ? seatList : obj.passengers.map((p) => p.seatNumber).filter(Boolean);
      obj.payment = paymentsByBooking.get(bIdStr) || null;
      obj.paymentStatus = obj.payment?.status || (obj.status === 'CONFIRMED' ? 'PAID' : obj.status === 'CANCELLED' ? 'REFUNDED' : 'PENDING');
      return obj;
    });

    res.json({
      success: true,
      bookings: formattedBookings,
      data: {
        bookings: formattedBookings,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get booking details by ID
// @route   GET /api/bookings/:id
// @access  Private
const getBookingById = async (req, res, next) => {
  try {
    const { id } = req.params;

    let booking = await findBookingByIdOrRef(id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    booking = await Booking.findById(booking._id)
      .populate({
        path: 'flightInstanceId',
        populate: [
          {
            path: 'flightId',
            populate: [
              { path: 'originAirportId', model: 'Airport' },
              { path: 'destinationAirportId', model: 'Airport' },
              { path: 'aircraftLayoutId', model: 'AircraftLayout' }
            ]
          },
          { path: 'scheduleId' }
        ]
      })
      .populate('offerId');

    // Ownership check
    const isOwner = booking.userId.toString() === req.user._id.toString();
    const isAdmin = ['SCHEDULE_ADMIN', 'SUPER_ADMIN'].includes(req.user.role);

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this booking'
      });
    }

    const [passengers, payment, rawSeats] = await Promise.all([
      BookingPassenger.find({ bookingId: booking._id }),
      Payment.findOne({ bookingId: booking._id }).sort({ createdAt: -1 }),
      BookingSeat.find({ bookingId: booking._id })
    ]);

    const seatStrings = rawSeats.map((s) => s.seatNumber).filter(Boolean);
    const bookingObj = booking.toObject({ virtuals: true });
    bookingObj.passengers = passengers;
    bookingObj.payment = payment;
    bookingObj.seats = seatStrings.length > 0 ? seatStrings : passengers.map((p) => p.seatNumber).filter(Boolean);
    bookingObj.paymentStatus = payment?.status || (booking.status === 'CONFIRMED' ? 'PAID' : booking.status === 'CANCELLED' ? 'REFUNDED' : 'PENDING');

    res.json({
      success: true,
      booking: bookingObj,
      passengers,
      payment,
      seats: bookingObj.seats,
      data: {
        booking: bookingObj,
        passengers,
        payment,
        seats: bookingObj.seats
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel booking (full or partial)
// @route   POST /api/bookings/:id/cancel
// @access  Private
const cancelBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      passengerIds,
      adultsToCancel,
      childrenToCancel,
      cancelAdults,
      cancelChildren,
      cancellationReason
    } = req.body;

    const booking = await findBookingByIdOrRef(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Ownership check
    const isOwner = booking.userId.toString() === req.user._id.toString();
    const isAdmin = ['SUPER_ADMIN', 'SCHEDULE_ADMIN'].includes(req.user.role);

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You cannot cancel this booking.'
      });
    }

    const updatedBooking = await cancelBookingService({
      bookingId: booking._id,
      passengerIds: passengerIds || [],
      adultsToCancel: adultsToCancel ?? cancelAdults ?? 0,
      childrenToCancel: childrenToCancel ?? cancelChildren ?? 0,
      cancellationReason: cancellationReason || 'Requested by user'
    });

    const passengers = await BookingPassenger.find({ bookingId: booking._id });

    res.json({
      success: true,
      message: `Booking updated to ${updatedBooking.status}`,
      booking: updatedBooking,
      passengers,
      data: {
        booking: updatedBooking,
        passengers
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Resend official E-Ticket copy to user email (Retry functionality)
// @route   POST /api/bookings/:id/resend-ticket, POST /api/bookings/:id/retry-email
// @access  Private
const resendETicket = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { customEmail } = req.body;

    let booking = await findBookingByIdOrRef(id);
    if (!booking) {
      booking = await Booking.findOne({ userId: req.user._id }).sort({ updatedAt: -1 });
    }

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    const targetEmail = customEmail || booking.contactEmail || req.user?.email || null;
    console.log(`[Resend Ticket] Manual retry requested for PNR ${booking.bookingReference} (Target: ${targetEmail || 'booking owner'})...`);
    const emailOutcome = await sendBookingConfirmationEmail(booking._id, {
      customEmail: targetEmail,
      forceResend: true
    });

    if (emailOutcome.success) {
      res.json({
        success: true,
        message: emailOutcome.isSandboxDelivered
          ? `Official E-Ticket dispatched! (Delivered to developer inbox ${emailOutcome.deliveredTo} in testing mode for passenger ${targetEmail})`
          : `Official E-Ticket has been successfully dispatched to ${emailOutcome.targetEmail || targetEmail}`,
        data: emailOutcome
      });
    } else {
      res.status(500).json({
        success: false,
        message: `Failed to dispatch E-Ticket: ${emailOutcome.error}`,
        data: emailOutcome
      });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBooking,
  confirmPayment,
  processPayment: confirmPayment,
  getPaymentStatus,
  getMyBookings,
  getBookingById,
  cancelBooking,
  resendETicket
};

