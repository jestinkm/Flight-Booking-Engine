const mongoose = require('mongoose');
const Flight = require('../models/Flight');
const FlightInstance = require('../models/FlightInstance');
const Booking = require('../models/Booking');
const BookingPassenger = require('../models/BookingPassenger');
const Payment = require('../models/Payment');
const Airport = require('../models/Airport');
const AircraftLayout = require('../models/AircraftLayout');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

// ----------------------------------------------------
// Privacy Masking & Security Sanitization Utilities
// ----------------------------------------------------

/**
 * Mask Aadhaar number to DGCA & UIDAI privacy standard: XXXX-XXXX-1234
 */
const maskAadhaar = (aadhaar) => {
  if (!aadhaar) return 'Not Provided';
  const clean = String(aadhaar).replace(/\D/g, '');
  if (clean.length >= 4) {
    const last4 = clean.slice(-4);
    return `XXXX-XXXX-${last4}`;
  }
  return 'XXXX-XXXX-****';
};

/**
 * Mask payment details (card / UPI)
 */
const maskPaymentDetails = (payment) => {
  if (!payment) return 'N/A';
  if (payment.safePaymentDetails) {
    return payment.safePaymentDetails;
  }
  if (payment.demoCardLast4) {
    return `•••• ${payment.demoCardLast4}`;
  }
  if (payment.method === 'DEMO_UPI' || payment.method === 'UPI') {
    return 'UPI (Masked)';
  }
  return 'Secure Payment';
};

/**
 * Mask phone numbers: +91 98*****210
 */
const maskPhone = (phone) => {
  if (!phone) return 'N/A';
  const str = String(phone).trim();
  if (str.length <= 4) return str;
  const start = str.slice(0, Math.min(4, Math.floor(str.length / 3)));
  const end = str.slice(-2);
  return `${start}*****${end}`;
};

/**
 * Prevent CSV formula injection (DDE/Formula attacks in Excel/Sheets)
 * Values starting with =, +, -, @, \t, or \r are prefixed with a single quote.
 */
const sanitizeCsvCell = (val) => {
  if (val === null || val === undefined) return '""';
  let str = String(val);
  if (/^[=+\-@\t\r]/.test(str)) {
    str = "'" + str;
  }
  return `"${str.replace(/"/g, '""')}"`;
};

// ----------------------------------------------------
// 1. Executive Analytics Summary (11 Cards + Charts)
// ----------------------------------------------------

/**
 * @desc    Get executive revenue and booking analytics summary
 * @route   GET /api/admin/analytics/summary
 * @access  Private (SUPER_ADMIN)
 */
const getAnalyticsSummary = async (req, res, next) => {
  try {
    // 1. Core entity counts
    const [
      totalFlights,
      totalFlightInstances,
      totalBookings,
      confirmedBookings,
      cancelledBookings,
      totalPassengers,
      confirmedPassengers
    ] = await Promise.all([
      Flight.countDocuments({ active: true }),
      FlightInstance.countDocuments(),
      Booking.countDocuments(),
      Booking.countDocuments({ status: 'CONFIRMED' }),
      Booking.countDocuments({ status: { $in: ['CANCELLED', 'PARTIALLY_CANCELLED'] } }),
      BookingPassenger.countDocuments(),
      BookingPassenger.countDocuments({ status: 'CONFIRMED' })
    ]);

    // 2. Gross Booking Value (sum of totalAmount across all bookings)
    const grossValResult = await Booking.aggregate([
      {
        $group: {
          _id: null,
          grossBookingValue: { $sum: '$totalAmount' },
          totalSubtotal: { $sum: '$subtotal' },
          totalTax: { $sum: '$taxAmount' },
          totalDiscount: { $sum: '$discountAmount' }
        }
      }
    ]);
    const grossMetrics = grossValResult[0] || {
      grossBookingValue: 0,
      totalSubtotal: 0,
      totalTax: 0,
      totalDiscount: 0
    };

    // 3. Payment distributions (SUCCESS, REFUNDED, PENDING, FAILED)
    const paymentAgg = await Payment.aggregate([
      {
        $group: {
          _id: '$status',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    const paymentsByStatus = {
      SUCCESS: { count: 0, amount: 0 },
      REFUNDED: { count: 0, amount: 0 },
      PENDING: { count: 0, amount: 0 },
      FAILED: { count: 0, amount: 0 }
    };

    paymentAgg.forEach((item) => {
      if (paymentsByStatus[item._id]) {
        paymentsByStatus[item._id] = {
          count: item.count,
          amount: Math.round(item.totalAmount)
        };
      }
    });

    // Realized Net Revenue = Successful collected payments (excluding pending/failed/refunded)
    const successfulPaymentsAmount = paymentsByStatus.SUCCESS.amount;
    const refundsIssuedAmount = paymentsByStatus.REFUNDED.amount;
    const netRevenue = Math.max(0, successfulPaymentsAmount);

    // 4. Overall Seat Load Factor / Occupancy
    const capacityAgg = await FlightInstance.aggregate([
      {
        $group: {
          _id: null,
          totalCapacity: { $sum: '$capacity' },
          totalBooked: { $sum: '$bookedCount' }
        }
      }
    ]);
    const totalFleetCapacity = capacityAgg[0]?.totalCapacity || 0;
    const totalFleetBooked = capacityAgg[0]?.totalBooked || 0;
    const overallOccupancyPct = totalFleetCapacity > 0
      ? Math.round((totalFleetBooked / totalFleetCapacity) * 100 * 10) / 10
      : 0;

    // 5. Timeline points for 14-day trends
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const timelineAgg = await Booking.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          bookingsCount: { $sum: 1 },
          confirmedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'CONFIRMED'] }, 1, 0] }
          },
          cancelledCount: {
            $sum: { $cond: [{ $in: ['$status', ['CANCELLED', 'PARTIALLY_CANCELLED']] }, 1, 0] }
          },
          dailyRevenue: {
            $sum: { $cond: [{ $eq: ['$status', 'CONFIRMED'] }, '$totalAmount', 0] }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        summary: {
          totalFlights,
          totalFlightInstances,
          totalBookings,
          confirmedBookings,
          cancelledBookings,
          totalPassengers,
          confirmedPassengers,
          grossBookingValue: Math.round(grossMetrics.grossBookingValue),
          netRevenue: Math.round(netRevenue),
          successfulPayments: paymentsByStatus.SUCCESS,
          refundsIssued: paymentsByStatus.REFUNDED,
          pendingPayments: paymentsByStatus.PENDING,
          failedPayments: paymentsByStatus.FAILED,
          discountsApplied: Math.round(grossMetrics.totalDiscount),
          taxesCollected: Math.round(grossMetrics.totalTax),
          overallOccupancyPct,
          totalFleetCapacity,
          totalFleetBooked
        },
        timeline: timelineAgg.map((item) => ({
          date: item._id,
          bookings: item.bookingsCount,
          confirmed: item.confirmedCount,
          cancelled: item.cancelledCount,
          revenue: Math.round(item.dailyRevenue)
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

// ----------------------------------------------------
// 2. Flight-Wise Revenue & Occupancy Report
// ----------------------------------------------------

/**
 * @desc    Get detailed flight-wise revenue report (individual departures or flight-level aggregation)
 * @route   GET /api/admin/analytics/flights
 * @access  Private (SUPER_ADMIN)
 */
const getFlightRevenueReport = async (req, res, next) => {
  try {
    const {
      view = 'instances', // 'instances' or 'aggregated'
      flightNumber,
      originAirport,
      destinationAirport,
      startDate,
      endDate,
      bookingStatus,
      paymentStatus,
      sortBy = 'departureDate',
      sortOrder = 'desc',
      page = 1,
      limit = 10
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const skipNum = (pageNum - 1) * limitNum;

    // 1. Fetch all active flights with airports & layouts
    const flightFilter = { active: true };
    if (flightNumber) {
      flightFilter.flightNumber = new RegExp(flightNumber.trim(), 'i');
    }
    if (originAirport) {
      if (mongoose.Types.ObjectId.isValid(originAirport)) {
        flightFilter.originAirportId = originAirport;
      }
    }
    if (destinationAirport) {
      if (mongoose.Types.ObjectId.isValid(destinationAirport)) {
        flightFilter.destinationAirportId = destinationAirport;
      }
    }

    const allFlights = await Flight.find(flightFilter)
      .populate('originAirportId')
      .populate('destinationAirportId')
      .populate('aircraftLayoutId');

    const flightMap = new Map();
    allFlights.forEach((f) => flightMap.set(f._id.toString(), f));

    // 2. Fetch FlightInstances with date and flight filter
    const instanceFilter = {};
    const matchingFlightIds = Array.from(flightMap.keys());
    if (matchingFlightIds.length === 0) {
      return res.json({
        success: true,
        data: {
          items: [],
          pagination: { page: pageNum, limit: limitNum, total: 0, pages: 0 },
          view
        }
      });
    }
    instanceFilter.flightId = { $in: matchingFlightIds };

    if (startDate || endDate) {
      instanceFilter.travelDate = {};
      if (startDate) {
        instanceFilter.travelDate.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        instanceFilter.travelDate.$lte = end;
      }
    }

    const instances = await FlightInstance.find(instanceFilter).sort({ departureDateTime: -1 });

    // 3. Fetch all bookings for these flight instances
    const instanceIds = instances.map((inst) => inst._id);
    const bookingQuery = { flightInstanceId: { $in: instanceIds } };
    if (bookingStatus && bookingStatus !== 'ALL') {
      bookingQuery.status = bookingStatus;
    }
    if (paymentStatus && paymentStatus !== 'ALL') {
      bookingQuery.paymentStatus = paymentStatus;
    }

    const bookings = await Booking.find(bookingQuery);
    const bookingIds = bookings.map((b) => b._id);
    const payments = await Payment.find({ bookingId: { $in: bookingIds } });

    // Map payments by bookingId
    const paymentsByBookingId = new Map();
    payments.forEach((p) => {
      const bId = p.bookingId.toString();
      if (!paymentsByBookingId.has(bId)) paymentsByBookingId.set(bId, []);
      paymentsByBookingId.get(bId).push(p);
    });

    // Map bookings by flightInstanceId
    const bookingsByInstanceId = new Map();
    bookings.forEach((b) => {
      const instId = b.flightInstanceId.toString();
      if (!bookingsByInstanceId.has(instId)) bookingsByInstanceId.set(instId, []);
      bookingsByInstanceId.get(instId).push(b);
    });

    // Calculate metrics per instance
    const instanceRows = instances.map((inst) => {
      const flight = flightMap.get(inst.flightId.toString()) || {};
      const instBookings = bookingsByInstanceId.get(inst._id.toString()) || [];

      let totalGross = 0;
      let totalDiscounts = 0;
      let totalSuccessfulPayments = 0;
      let totalRefunds = 0;
      let confirmedCount = 0;
      let cancelledCount = 0;

      instBookings.forEach((b) => {
        totalGross += b.totalAmount || 0;
        totalDiscounts += b.discountAmount || 0;
        if (b.status === 'CONFIRMED') confirmedCount++;
        if (b.status === 'CANCELLED' || b.status === 'PARTIALLY_CANCELLED') cancelledCount++;

        const bPayments = paymentsByBookingId.get(b._id.toString()) || [];
        bPayments.forEach((p) => {
          if (p.status === 'SUCCESS') totalSuccessfulPayments += p.amount || 0;
          if (p.status === 'REFUNDED') totalRefunds += p.amount || 0;
        });
      });

      const netCollectedRevenue = Math.max(0, totalSuccessfulPayments);
      const capacity = inst.capacity || flight.totalCapacity || 180;
      const bookedCount = inst.bookedCount || 0;
      const availableSeats = Math.max(0, capacity - bookedCount);
      const occupancyPct = capacity > 0 ? Math.round((bookedCount / capacity) * 100 * 10) / 10 : 0;

      const depDate = inst.departureDateTime ? new Date(inst.departureDateTime) : new Date(inst.travelDate);
      const arrDate = inst.arrivalDateTime ? new Date(inst.arrivalDateTime) : null;

      return {
        id: inst._id.toString(),
        flightInstanceId: inst._id.toString(),
        flightId: flight._id ? flight._id.toString() : '',
        flightNumber: flight.flightNumber || 'N/A',
        flightName: flight.flightName || 'Skynexa Flight',
        origin: {
          code: flight.originAirportId?.code || 'DEL',
          name: flight.originAirportId?.name || '',
          city: flight.originAirportId?.city || ''
        },
        destination: {
          code: flight.destinationAirportId?.code || 'BOM',
          name: flight.destinationAirportId?.name || '',
          city: flight.destinationAirportId?.city || ''
        },
        departureDateTime: depDate.toISOString(),
        departureDate: depDate.toISOString().split('T')[0],
        departureTime: depDate.toTimeString().substring(0, 5),
        arrivalDateTime: arrDate ? arrDate.toISOString() : null,
        arrivalTime: arrDate ? arrDate.toTimeString().substring(0, 5) : 'N/A',
        aircraft: flight.aircraftLayoutId?.name || 'Airbus A320neo',
        aircraftModel: flight.aircraftLayoutId?.model || 'Airbus A320neo',
        totalSeatCapacity: capacity,
        seatsBooked: bookedCount,
        seatsAvailable: availableSeats,
        totalBookings: instBookings.length,
        confirmedBookings: confirmedCount,
        cancelledBookings: cancelledCount,
        grossBookingValue: Math.round(totalGross),
        successfulPayments: Math.round(totalSuccessfulPayments),
        discounts: Math.round(totalDiscounts),
        refunds: Math.round(totalRefunds),
        netCollectedRevenue: Math.round(netCollectedRevenue),
        occupancy: occupancyPct,
        status: inst.status || 'SCHEDULED'
      };
    });

    let finalRows = [];

    if (view === 'aggregated') {
      // Flight-level aggregation
      const aggregatedMap = new Map();

      instanceRows.forEach((row) => {
        const key = row.flightNumber;
        if (!aggregatedMap.has(key)) {
          aggregatedMap.set(key, {
            id: row.flightId,
            flightId: row.flightId,
            flightNumber: row.flightNumber,
            flightName: row.flightName,
            origin: row.origin,
            destination: row.destination,
            aircraft: row.aircraft,
            totalDepartures: 0,
            totalSeatCapacity: 0,
            seatsBooked: 0,
            seatsAvailable: 0,
            totalBookings: 0,
            confirmedBookings: 0,
            cancelledBookings: 0,
            grossBookingValue: 0,
            successfulPayments: 0,
            discounts: 0,
            refunds: 0,
            netCollectedRevenue: 0
          });
        }

        const agg = aggregatedMap.get(key);
        agg.totalDepartures += 1;
        agg.totalSeatCapacity += row.totalSeatCapacity;
        agg.seatsBooked += row.seatsBooked;
        agg.seatsAvailable += row.seatsAvailable;
        agg.totalBookings += row.totalBookings;
        agg.confirmedBookings += row.confirmedBookings;
        agg.cancelledBookings += row.cancelledBookings;
        agg.grossBookingValue += row.grossBookingValue;
        agg.successfulPayments += row.successfulPayments;
        agg.discounts += row.discounts;
        agg.refunds += row.refunds;
        agg.netCollectedRevenue += row.netCollectedRevenue;
      });

      finalRows = Array.from(aggregatedMap.values()).map((agg) => ({
        ...agg,
        occupancy: agg.totalSeatCapacity > 0
          ? Math.round((agg.seatsBooked / agg.totalSeatCapacity) * 100 * 10) / 10
          : 0
      }));
    } else {
      finalRows = instanceRows;
    }

    // Sorting
    finalRows.sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];

      if (sortBy === 'departureDate') {
        valA = new Date(a.departureDateTime || 0).getTime();
        valB = new Date(b.departureDateTime || 0).getTime();
      }

      if (typeof valA === 'string') {
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortOrder === 'asc' ? (valA || 0) - (valB || 0) : (valB || 0) - (valA || 0);
    });

    const total = finalRows.length;
    const paginatedItems = finalRows.slice(skipNum, skipNum + limitNum);

    res.json({
      success: true,
      data: {
        items: paginatedItems,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum) || 1
        },
        view
      }
    });
  } catch (error) {
    next(error);
  }
};

// ----------------------------------------------------
// 3. Customer & Passenger Details Report
// ----------------------------------------------------

/**
 * @desc    Get customer and passenger booking details report with privacy masking
 * @route   GET /api/admin/analytics/customers
 * @access  Private (SUPER_ADMIN)
 */
const getCustomerBookingsReport = async (req, res, next) => {
  try {
    const {
      search,
      pnr,
      customerId,
      flightNumber,
      bookingStatus,
      paymentStatus,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 10
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const skipNum = (pageNum - 1) * limitNum;

    // Build filter for Bookings
    const bookingFilter = {};

    if (pnr) {
      bookingFilter.bookingReference = new RegExp(pnr.trim(), 'i');
    }
    if (customerId && mongoose.Types.ObjectId.isValid(customerId)) {
      bookingFilter.userId = customerId;
    }
    if (bookingStatus && bookingStatus !== 'ALL') {
      bookingFilter.status = bookingStatus;
    }
    if (paymentStatus && paymentStatus !== 'ALL') {
      bookingFilter.paymentStatus = paymentStatus;
    }
    if (startDate || endDate) {
      bookingFilter.createdAt = {};
      if (startDate) bookingFilter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        bookingFilter.createdAt.$lte = end;
      }
    }

    // Query bookings with populations
    let bookings = await Booking.find(bookingFilter)
      .populate('userId', 'username email firstName lastName phone role')
      .populate({
        path: 'flightInstanceId',
        populate: {
          path: 'flightId',
          populate: ['originAirportId', 'destinationAirportId', 'aircraftLayoutId']
        }
      })
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 });

    // Fetch passenger records for these bookings
    const bookingIds = bookings.map((b) => b._id);
    const [allPassengers, allPayments] = await Promise.all([
      BookingPassenger.find({ bookingId: { $in: bookingIds } }),
      Payment.find({ bookingId: { $in: bookingIds } })
    ]);

    const passengersByBookingId = new Map();
    allPassengers.forEach((p) => {
      const bId = p.bookingId.toString();
      if (!passengersByBookingId.has(bId)) passengersByBookingId.set(bId, []);
      passengersByBookingId.get(bId).push(p);
    });

    const paymentByBookingId = new Map();
    allPayments.forEach((pmt) => {
      paymentByBookingId.set(pmt.bookingId.toString(), pmt);
    });

    // Transform and apply search & flight number filters in-memory
    let formattedRows = bookings.map((b) => {
      const user = b.userId || {};
      const flightInstance = b.flightInstanceId || {};
      const flight = flightInstance.flightId || {};
      const bPassengers = passengersByBookingId.get(b._id.toString()) || [];
      const payment = paymentByBookingId.get(b._id.toString()) || null;

      const customerFullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'Customer';
      const passengerNames = bPassengers.map((p) => `${p.firstName} ${p.lastName}`).join(', ');
      const seatNumbers = bPassengers.map((p) => p.seatNumber || 'Unassigned').join(', ');

      const maskedPassengers = bPassengers.map((p) => ({
        id: p._id.toString(),
        name: `${p.firstName} ${p.lastName}`,
        type: p.type,
        seatNumber: p.seatNumber || 'Unassigned',
        maskedAadhaar: maskAadhaar(p.aadhaarNumber),
        status: p.status,
        gender: p.gender
      }));

      const isRefunded = b.paymentStatus === 'REFUNDED' || payment?.status === 'REFUNDED';

      return {
        bookingId: b._id.toString(),
        pnr: b.bookingReference,
        bookingDate: b.createdAt.toISOString(),
        customer: {
          id: user._id ? user._id.toString() : 'N/A',
          name: customerFullName,
          email: user.email || b.contactEmail || 'N/A',
          phone: maskPhone(user.phone || b.contactPhone)
        },
        flight: {
          flightNumber: flight.flightNumber || 'N/A',
          flightName: flight.flightName || 'Skynexa Flight',
          originCode: flight.originAirportId?.code || 'DEL',
          originCity: flight.originAirportId?.city || 'Delhi',
          destinationCode: flight.destinationAirportId?.code || 'BOM',
          destinationCity: flight.destinationAirportId?.city || 'Mumbai',
          departureDateTime: flightInstance.departureDateTime
            ? new Date(flightInstance.departureDateTime).toISOString()
            : null,
          departureDate: flightInstance.departureDateTime
            ? new Date(flightInstance.departureDateTime).toISOString().split('T')[0]
            : 'N/A',
          departureTime: flightInstance.departureDateTime
            ? new Date(flightInstance.departureDateTime).toTimeString().substring(0, 5)
            : 'N/A',
          aircraft: flight.aircraftLayoutId?.name || 'Airbus A320neo'
        },
        passengerCount: b.passengerCount || bPassengers.length,
        passengerNames,
        seatNumbers,
        passengers: maskedPassengers,
        bookingStatus: b.status,
        paymentStatus: b.paymentStatus,
        paymentDetails: {
          method: payment?.method || 'CARD',
          transactionId: payment?.transactionId || payment?.transactionReference || 'N/A',
          safePaymentDetails: maskPaymentDetails(payment)
        },
        financials: {
          subtotal: Math.round(b.subtotal || 0),
          taxAmount: Math.round(b.taxAmount || 0),
          discountAmount: Math.round(b.discountAmount || 0),
          totalAmount: Math.round(b.totalAmount || 0),
          refundAmount: isRefunded ? Math.round(payment?.amount || b.totalAmount || 0) : 0,
          refundStatus: isRefunded ? 'FULL_REFUND' : 'NONE'
        }
      };
    });

    // In-memory search filtering (PNR, customer name, email, flightNumber)
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      formattedRows = formattedRows.filter((row) => {
        return (
          row.pnr.toLowerCase().includes(q) ||
          row.customer.name.toLowerCase().includes(q) ||
          row.customer.email.toLowerCase().includes(q) ||
          row.flight.flightNumber.toLowerCase().includes(q) ||
          row.passengerNames.toLowerCase().includes(q)
        );
      });
    }

    if (flightNumber && flightNumber.trim()) {
      const fn = flightNumber.trim().toLowerCase();
      formattedRows = formattedRows.filter((r) => r.flight.flightNumber.toLowerCase().includes(fn));
    }

    const total = formattedRows.length;
    const paginatedItems = formattedRows.slice(skipNum, skipNum + limitNum);

    res.json({
      success: true,
      data: {
        items: paginatedItems,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum) || 1
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// ----------------------------------------------------
// 4. Export Reports to CSV with Audit Logging
// ----------------------------------------------------

/**
 * @desc    Export Flight Revenue Report to CSV
 * @route   GET /api/admin/analytics/export/flights
 * @access  Private (SUPER_ADMIN)
 */
const exportFlightRevenueCSV = async (req, res, next) => {
  try {
    const { view = 'instances' } = req.query;

    // Fetch full data using identical query logic
    const allFlights = await Flight.find({ active: true })
      .populate('originAirportId')
      .populate('destinationAirportId')
      .populate('aircraftLayoutId');

    const flightMap = new Map();
    allFlights.forEach((f) => flightMap.set(f._id.toString(), f));

    const instances = await FlightInstance.find({ flightId: { $in: Array.from(flightMap.keys()) } })
      .sort({ departureDateTime: -1 });

    const instanceIds = instances.map((inst) => inst._id);
    const bookings = await Booking.find({ flightInstanceId: { $in: instanceIds } });
    const bookingIds = bookings.map((b) => b._id);
    const payments = await Payment.find({ bookingId: { $in: bookingIds } });

    const paymentsByBookingId = new Map();
    payments.forEach((p) => {
      const bId = p.bookingId.toString();
      if (!paymentsByBookingId.has(bId)) paymentsByBookingId.set(bId, []);
      paymentsByBookingId.get(bId).push(p);
    });

    const bookingsByInstanceId = new Map();
    bookings.forEach((b) => {
      const instId = b.flightInstanceId.toString();
      if (!bookingsByInstanceId.has(instId)) bookingsByInstanceId.set(instId, []);
      bookingsByInstanceId.get(instId).push(b);
    });

    let csvContent = '';

    if (view === 'aggregated') {
      // Header for aggregated view
      const headers = [
        'Flight Number',
        'Flight Name',
        'Origin',
        'Destination',
        'Aircraft',
        'Total Departures',
        'Total Capacity',
        'Seats Booked',
        'Seats Available',
        'Total Bookings',
        'Confirmed Bookings',
        'Cancelled Bookings',
        'Gross Booking Value (INR)',
        'Successful Payments (INR)',
        'Discounts (INR)',
        'Refunds (INR)',
        'Net Collected Revenue (INR)',
        'Occupancy Rate (%)'
      ];
      csvContent += headers.map(sanitizeCsvCell).join(',') + '\r\n';

      const aggregatedMap = new Map();
      instances.forEach((inst) => {
        const flight = flightMap.get(inst.flightId.toString()) || {};
        const instBookings = bookingsByInstanceId.get(inst._id.toString()) || [];
        const fn = flight.flightNumber || 'N/A';

        if (!aggregatedMap.has(fn)) {
          aggregatedMap.set(fn, {
            flightNumber: fn,
            flightName: flight.flightName || 'Skynexa Flight',
            origin: `${flight.originAirportId?.code || 'DEL'} - ${flight.originAirportId?.city || ''}`,
            destination: `${flight.destinationAirportId?.code || 'BOM'} - ${flight.destinationAirportId?.city || ''}`,
            aircraft: flight.aircraftLayoutId?.name || 'Airbus A320neo',
            departures: 0,
            capacity: 0,
            booked: 0,
            bookings: 0,
            confirmed: 0,
            cancelled: 0,
            gross: 0,
            successful: 0,
            discounts: 0,
            refunds: 0
          });
        }

        const agg = aggregatedMap.get(fn);
        agg.departures += 1;
        agg.capacity += inst.capacity || 180;
        agg.booked += inst.bookedCount || 0;
        agg.bookings += instBookings.length;

        instBookings.forEach((b) => {
          agg.gross += b.totalAmount || 0;
          agg.discounts += b.discountAmount || 0;
          if (b.status === 'CONFIRMED') agg.confirmed += 1;
          if (b.status === 'CANCELLED' || b.status === 'PARTIALLY_CANCELLED') agg.cancelled += 1;

          const bPayments = paymentsByBookingId.get(b._id.toString()) || [];
          bPayments.forEach((p) => {
            if (p.status === 'SUCCESS') agg.successful += p.amount || 0;
            if (p.status === 'REFUNDED') agg.refunds += p.amount || 0;
          });
        });
      });

      aggregatedMap.forEach((agg) => {
        const netRev = Math.max(0, agg.successful);
        const avail = Math.max(0, agg.capacity - agg.booked);
        const occ = agg.capacity > 0 ? (agg.booked / agg.capacity) * 100 : 0;

        const row = [
          agg.flightNumber,
          agg.flightName,
          agg.origin,
          agg.destination,
          agg.aircraft,
          agg.departures,
          agg.capacity,
          agg.booked,
          avail,
          agg.bookings,
          agg.confirmed,
          agg.cancelled,
          Math.round(agg.gross),
          Math.round(agg.successful),
          Math.round(agg.discounts),
          Math.round(agg.refunds),
          Math.round(netRev),
          occ.toFixed(1) + '%'
        ];
        csvContent += row.map(sanitizeCsvCell).join(',') + '\r\n';
      });
    } else {
      // Individual departures view
      const headers = [
        'Flight Number',
        'Flight Name',
        'Origin',
        'Destination',
        'Departure Date',
        'Departure Time',
        'Aircraft',
        'Total Seat Capacity',
        'Seats Booked',
        'Seats Available',
        'Total Bookings',
        'Confirmed Bookings',
        'Cancelled Bookings',
        'Gross Booking Value (INR)',
        'Successful Payments (INR)',
        'Discounts (INR)',
        'Refunds (INR)',
        'Net Collected Revenue (INR)',
        'Occupancy Rate (%)'
      ];
      csvContent += headers.map(sanitizeCsvCell).join(',') + '\r\n';

      instances.forEach((inst) => {
        const flight = flightMap.get(inst.flightId.toString()) || {};
        const instBookings = bookingsByInstanceId.get(inst._id.toString()) || [];

        let totalGross = 0;
        let totalDiscounts = 0;
        let totalSuccessfulPayments = 0;
        let totalRefunds = 0;
        let confirmedCount = 0;
        let cancelledCount = 0;

        instBookings.forEach((b) => {
          totalGross += b.totalAmount || 0;
          totalDiscounts += b.discountAmount || 0;
          if (b.status === 'CONFIRMED') confirmedCount++;
          if (b.status === 'CANCELLED' || b.status === 'PARTIALLY_CANCELLED') cancelledCount++;

          const bPayments = paymentsByBookingId.get(b._id.toString()) || [];
          bPayments.forEach((p) => {
            if (p.status === 'SUCCESS') totalSuccessfulPayments += p.amount || 0;
            if (p.status === 'REFUNDED') totalRefunds += p.amount || 0;
          });
        });

        const netRev = Math.max(0, totalSuccessfulPayments);
        const capacity = inst.capacity || 180;
        const booked = inst.bookedCount || 0;
        const avail = Math.max(0, capacity - booked);
        const occ = capacity > 0 ? (booked / capacity) * 100 : 0;
        const depDate = inst.departureDateTime ? new Date(inst.departureDateTime) : new Date(inst.travelDate);

        const row = [
          flight.flightNumber || 'N/A',
          flight.flightName || 'Skynexa Flight',
          flight.originAirportId?.code || 'DEL',
          flight.destinationAirportId?.code || 'BOM',
          depDate.toISOString().split('T')[0],
          depDate.toTimeString().substring(0, 5),
          flight.aircraftLayoutId?.name || 'Airbus A320neo',
          capacity,
          booked,
          avail,
          instBookings.length,
          confirmedCount,
          cancelledCount,
          Math.round(totalGross),
          Math.round(totalSuccessfulPayments),
          Math.round(totalDiscounts),
          Math.round(totalRefunds),
          Math.round(netRev),
          occ.toFixed(1) + '%'
        ];
        csvContent += row.map(sanitizeCsvCell).join(',') + '\r\n';
      });
    }

    // Audit log
    await AuditLog.create({
      adminId: req.user._id,
      action: 'EXPORT_FLIGHT_REVENUE_REPORT',
      entityType: 'Report',
      entityId: null,
      details: { view, recordCount: instances.length, exportedAt: new Date() },
      ipAddress: req.ip || req.connection?.remoteAddress
    });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="skynexa-flight-revenue-${view}-${timestamp}.csv"`);
    res.send(csvContent);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Export Customer & Passenger Bookings to CSV
 * @route   GET /api/admin/analytics/export/customers
 * @access  Private (SUPER_ADMIN)
 */
const exportCustomerBookingsCSV = async (req, res, next) => {
  try {
    const bookings = await Booking.find()
      .populate('userId', 'username email firstName lastName phone')
      .populate({
        path: 'flightInstanceId',
        populate: {
          path: 'flightId',
          populate: ['originAirportId', 'destinationAirportId', 'aircraftLayoutId']
        }
      })
      .sort({ createdAt: -1 });

    const bookingIds = bookings.map((b) => b._id);
    const [passengers, payments] = await Promise.all([
      BookingPassenger.find({ bookingId: { $in: bookingIds } }),
      Payment.find({ bookingId: { $in: bookingIds } })
    ]);

    const passengersByBookingId = new Map();
    passengers.forEach((p) => {
      const bId = p.bookingId.toString();
      if (!passengersByBookingId.has(bId)) passengersByBookingId.set(bId, []);
      passengersByBookingId.get(bId).push(p);
    });

    const paymentByBookingId = new Map();
    payments.forEach((p) => {
      paymentByBookingId.set(p.bookingId.toString(), p);
    });

    const headers = [
      'PNR / Booking Ref',
      'Booking Date',
      'Customer Name',
      'Customer ID',
      'Registered Email',
      'Phone',
      'Flight Number',
      'Route',
      'Departure Date',
      'Departure Time',
      'Passenger Count',
      'Passenger Manifest',
      'Seat Allocations',
      'Booking Status',
      'Payment Status',
      'Payment Details (Masked)',
      'Subtotal (INR)',
      'Taxes (INR)',
      'Discount (INR)',
      'Total Paid (INR)',
      'Refund Status'
    ];

    let csvContent = headers.map(sanitizeCsvCell).join(',') + '\r\n';

    bookings.forEach((b) => {
      const user = b.userId || {};
      const flightInstance = b.flightInstanceId || {};
      const flight = flightInstance.flightId || {};
      const bPassengers = passengersByBookingId.get(b._id.toString()) || [];
      const payment = paymentByBookingId.get(b._id.toString()) || null;

      const customerFullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'Customer';
      const routeStr = `${flight.originAirportId?.code || 'DEL'} → ${flight.destinationAirportId?.code || 'BOM'}`;
      const depDate = flightInstance.departureDateTime
        ? new Date(flightInstance.departureDateTime).toISOString().split('T')[0]
        : 'N/A';
      const depTime = flightInstance.departureDateTime
        ? new Date(flightInstance.departureDateTime).toTimeString().substring(0, 5)
        : 'N/A';

      const manifestStr = bPassengers
        .map((p) => `${p.firstName} ${p.lastName} (${p.type}, Aadhaar: ${maskAadhaar(p.aadhaarNumber)})`)
        .join('; ');
      const seatsStr = bPassengers.map((p) => p.seatNumber || 'Unassigned').join(', ');
      const safePmt = maskPaymentDetails(payment);
      const isRefunded = b.paymentStatus === 'REFUNDED' || payment?.status === 'REFUNDED';

      const row = [
        b.bookingReference,
        b.createdAt.toISOString().split('T')[0],
        customerFullName,
        user._id ? user._id.toString() : 'N/A',
        user.email || b.contactEmail || 'N/A',
        maskPhone(user.phone || b.contactPhone),
        flight.flightNumber || 'N/A',
        routeStr,
        depDate,
        depTime,
        b.passengerCount || bPassengers.length,
        manifestStr,
        seatsStr,
        b.status,
        b.paymentStatus,
        safePmt,
        Math.round(b.subtotal || 0),
        Math.round(b.taxAmount || 0),
        Math.round(b.discountAmount || 0),
        Math.round(b.totalAmount || 0),
        isRefunded ? 'REFUNDED' : 'PAID'
      ];

      csvContent += row.map(sanitizeCsvCell).join(',') + '\r\n';
    });

    // Audit log
    await AuditLog.create({
      adminId: req.user._id,
      action: 'EXPORT_CUSTOMER_BOOKINGS_REPORT',
      entityType: 'Report',
      entityId: null,
      details: { recordCount: bookings.length, exportedAt: new Date() },
      ipAddress: req.ip || req.connection?.remoteAddress
    });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="skynexa-customer-bookings-${timestamp}.csv"`);
    res.send(csvContent);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAnalyticsSummary,
  getFlightRevenueReport,
  getCustomerBookingsReport,
  exportFlightRevenueCSV,
  exportCustomerBookingsCSV
};
