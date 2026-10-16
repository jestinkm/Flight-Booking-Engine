const Airport = require('../models/Airport');
const Flight = require('../models/Flight');
const FlightSchedule = require('../models/FlightSchedule');
const FlightInstance = require('../models/FlightInstance');
const AircraftLayout = require('../models/AircraftLayout');
const Booking = require('../models/Booking');
const User = require('../models/User');
const Payment = require('../models/Payment');
const AuditLog = require('../models/AuditLog');

const DAY_NAMES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

// Parse local YYYY-MM-DD and HH:MM in Asia/Kolkata (+05:30) to UTC Date
const parseKolkataDateTime = (dateStr, timeStr) => {
  return new Date(`${dateStr}T${timeStr}:00+05:30`);
};

/* ==================== FLIGHT CRUD ==================== */

// @desc    Create a new flight with complete validation and capacity calculation
// @route   POST /api/admin/flights
// @access  Private (SUPER_ADMIN, SCHEDULE_ADMIN)
const createFlight = async (req, res, next) => {
  try {
    const {
      flightNumber,
      flightCode,
      flightName,
      originAirportId,
      destinationAirportId,
      baseFare,
      adultFare,
      childFare,
      departureDateTime,
      arrivalDateTime,
      aircraftLayoutId,
      status,
      active
    } = req.body;

    // 1. Validate Flight Number
    const rawNumber = flightNumber || flightCode;
    if (!rawNumber || !rawNumber.toString().trim()) {
      return res.status(400).json({
        success: false,
        message: 'Flight number is required (e.g. SK-501)'
      });
    }
    const normalizedFlightNumber = rawNumber.toString().toUpperCase().trim();

    // 1b. Check Flight Number uniqueness
    const existingFlight = await Flight.findOne({
      $or: [
        { flightNumber: normalizedFlightNumber },
        { flightCode: normalizedFlightNumber }
      ]
    });
    if (existingFlight) {
      return res.status(409).json({
        success: false,
        message: `Flight number ${normalizedFlightNumber} already exists in the catalog`
      });
    }

    // 2. Validate Adult and Child Fares
    const numericAdultFare = Number(adultFare ?? baseFare);
    if (isNaN(numericAdultFare) || numericAdultFare <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Adult ticket price must be a numeric value greater than zero (e.g. ₹5,000)'
      });
    }

    const numericChildFare = childFare !== undefined && childFare !== null && !isNaN(Number(childFare))
      ? Number(childFare)
      : Math.round(numericAdultFare * 0.75);

    if (numericChildFare < 0) {
      return res.status(400).json({
        success: false,
        message: 'Child ticket price cannot be negative'
      });
    }

    const numericBaseFare = numericAdultFare;

    // 3. Validate Origin & Destination Airports are different
    if (!originAirportId || !destinationAirportId) {
      return res.status(400).json({
        success: false,
        message: 'Both origin and destination airports are required'
      });
    }

    if (originAirportId.toString() === destinationAirportId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Origin and destination airports must be different'
      });
    }

    // 4. Validate Airport references exist in database
    const [originAirport, destinationAirport] = await Promise.all([
      Airport.findById(originAirportId),
      Airport.findById(destinationAirportId)
    ]);

    if (!originAirport) {
      return res.status(400).json({
        success: false,
        message: 'Selected origin airport does not exist'
      });
    }

    if (!destinationAirport) {
      return res.status(400).json({
        success: false,
        message: 'Selected destination airport does not exist'
      });
    }

    // 5. Validate Departure & Arrival Date/Times
    let depDate = departureDateTime ? new Date(departureDateTime) : null;
    let arrDate = arrivalDateTime ? new Date(arrivalDateTime) : null;

    if (depDate && isNaN(depDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid departure date and time format'
      });
    }

    if (arrDate && isNaN(arrDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid arrival date and time format'
      });
    }

    if (depDate && arrDate && arrDate <= depDate) {
      return res.status(400).json({
        success: false,
        message: 'Departure date and time must be strictly before arrival date and time'
      });
    }

    // 6. Validate Aircraft Layout and Calculate Capacity
    if (!aircraftLayoutId) {
      return res.status(400).json({
        success: false,
        message: 'Aircraft layout is required'
      });
    }

    const layout = await AircraftLayout.findById(aircraftLayoutId);
    if (!layout) {
      return res.status(400).json({
        success: false,
        message: 'Selected aircraft layout not found'
      });
    }

    // Capacity calculated from layout — not trusting client supplied capacity
    const calculatedCapacity =
      layout.seatDefinitions?.filter((s) => s.active !== false).length ||
      (layout.rows && layout.seatsPerRow ? layout.rows * layout.seatsPerRow : 180);

    const flightStatus = status || (active === false ? 'INACTIVE' : 'ACTIVE');
    const isActive = flightStatus === 'ACTIVE';

    // 7. Save Flight to MongoDB Atlas
    const newFlight = await Flight.create({
      flightNumber: normalizedFlightNumber,
      flightCode: normalizedFlightNumber,
      flightName: flightName?.trim() || `${normalizedFlightNumber} (${originAirport.code} → ${destinationAirport.code})`,
      originAirportId,
      destinationAirportId,
      baseFare: numericAdultFare,
      adultFare: numericAdultFare,
      childFare: numericChildFare,
      departureDateTime: depDate,
      arrivalDateTime: arrDate,
      aircraftLayoutId,
      totalCapacity: calculatedCapacity,
      capacity: calculatedCapacity,
      status: flightStatus,
      active: isActive,
      createdBy: req.user._id
    });

    // 8. Create Audit Log
    await AuditLog.create({
      adminId: req.user._id,
      action: 'CREATE_FLIGHT',
      entityType: 'Flight',
      entityId: newFlight._id,
      details: {
        flightNumber: newFlight.flightNumber,
        flightName: newFlight.flightName,
        origin: originAirport.code,
        destination: destinationAirport.code,
        baseFare: newFlight.baseFare,
        adultFare: newFlight.adultFare,
        childFare: newFlight.childFare,
        totalCapacity: newFlight.totalCapacity,
        status: newFlight.status
      }
    });

    // 8b. Auto-create Daily Schedule and 60 days of FlightInstances in MongoDB Atlas
    try {
      let depTimeStr = '09:00';
      let arrTimeStr = '11:30';

      if (depDate) {
        const h = depDate.getHours().toString().padStart(2, '0');
        const m = depDate.getMinutes().toString().padStart(2, '0');
        depTimeStr = `${h}:${m}`;
      }
      if (arrDate) {
        const h = arrDate.getHours().toString().padStart(2, '0');
        const m = arrDate.getMinutes().toString().padStart(2, '0');
        arrTimeStr = `${h}:${m}`;
      }

      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);

      const schedule = await FlightSchedule.create({
        flightId: newFlight._id,
        scheduleType: 'DAILY',
        operatingDays: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
        departureTime: depTimeStr,
        arrivalTime: arrTimeStr,
        adultFare: numericAdultFare,
        childFare: numericChildFare,
        status: isActive ? 'ON_TIME' : 'SCHEDULED',
        active: isActive,
        timezone: 'Asia/Kolkata',
        startDate: today,
        endDate: new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000),
        createdBy: req.user._id
      });

      const instances = [];
      for (let i = 0; i < 60; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];

        const depDT = parseKolkataDateTime(dateStr, depTimeStr);
        let arrDT = parseKolkataDateTime(dateStr, arrTimeStr);
        if (arrDT <= depDT) {
          arrDT = new Date(arrDT.getTime() + 24 * 60 * 60 * 1000);
        }

        instances.push({
          flightId: newFlight._id,
          scheduleId: schedule._id,
          travelDate: d,
          departureDateTime: depDT,
          arrivalDateTime: arrDT,
          adultFare: numericAdultFare,
          childFare: numericChildFare,
          capacity: calculatedCapacity,
          bookedCount: 0,
          status: 'SCHEDULED'
        });
      }

      if (instances.length > 0) {
        await FlightInstance.insertMany(instances, { ordered: false }).catch(() => {});
      }
    } catch (schedErr) {
      console.error('Failed to auto-generate schedule/instances on flight creation:', schedErr.message);
    }

    // 9. Return populated flight details
    const populatedFlight = await Flight.findById(newFlight._id)
      .populate('originAirportId')
      .populate('destinationAirportId')
      .populate('aircraftLayoutId')
      .populate('createdBy', 'firstName lastName email role');

    res.status(201).json({
      success: true,
      message: `Flight ${normalizedFlightNumber} created successfully`,
      data: { flight: populatedFlight }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'A flight with this number already exists'
      });
    }
    next(error);
  }
};

// @desc    List all flights for admin management
// @route   GET /api/admin/flights
// @access  Private (SUPER_ADMIN, SCHEDULE_ADMIN)
const listFlights = async (req, res, next) => {
  try {
    const flights = await Flight.find()
      .populate('originAirportId')
      .populate('destinationAirportId')
      .populate('aircraftLayoutId')
      .populate('createdBy', 'firstName lastName email role')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { flights }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single flight details with booking stats
// @route   GET /api/admin/flights/:id
// @access  Private (SUPER_ADMIN, SCHEDULE_ADMIN)
const getFlightById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const flight = await Flight.findById(id)
      .populate('originAirportId')
      .populate('destinationAirportId')
      .populate('aircraftLayoutId')
      .populate('createdBy', 'firstName lastName email role');

    if (!flight) {
      return res.status(404).json({
        success: false,
        message: 'Flight not found'
      });
    }

    // Check count of active bookings referencing this flight or its instances
    const activeBookingsCount = await Booking.countDocuments({
      flightId: id,
      status: { $in: ['CONFIRMED', 'PENDING'] }
    });

    res.json({
      success: true,
      data: {
        flight,
        activeBookingsCount
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update an existing flight
// @route   PUT /api/admin/flights/:id, PATCH /api/admin/flights/:id
// @access  Private (SUPER_ADMIN, SCHEDULE_ADMIN)
const updateFlight = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      flightNumber,
      flightCode,
      flightName,
      originAirportId,
      destinationAirportId,
      baseFare,
      departureDateTime,
      arrivalDateTime,
      aircraftLayoutId,
      status,
      active
    } = req.body;

    const existingFlight = await Flight.findById(id);
    if (!existingFlight) {
      return res.status(404).json({
        success: false,
        message: 'Flight not found'
      });
    }

    const updates = {};

    // 1. Flight number validation
    const rawNumber = flightNumber || flightCode;
    if (rawNumber) {
      const normalized = rawNumber.toString().toUpperCase().trim();
      const duplicate = await Flight.findOne({
        _id: { $ne: id },
        $or: [{ flightNumber: normalized }, { flightCode: normalized }]
      });
      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: `Flight number ${normalized} is already assigned to another flight`
        });
      }
      updates.flightNumber = normalized;
      updates.flightCode = normalized;
    }

    if (flightName !== undefined) {
      updates.flightName = flightName.trim();
    }

    // 2. Base / Adult & Child Fare validation (Super Admin Exclusive)
    if (baseFare !== undefined || req.body.adultFare !== undefined || req.body.childFare !== undefined) {
      if (req.user.role !== 'SUPER_ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: Pricing and airfare configuration is exclusively restricted to Super Administrators. Schedule Administrators cannot modify fares.'
        });
      }

      const inputAdult = req.body.adultFare !== undefined ? req.body.adultFare : baseFare;
      if (inputAdult !== undefined) {
        const numAdultFare = Number(inputAdult);
        if (isNaN(numAdultFare) || numAdultFare <= 0) {
          return res.status(400).json({
            success: false,
            message: 'Adult ticket price must be a positive numeric value greater than ₹0'
          });
        }
        updates.adultFare = numAdultFare;
        updates.baseFare = numAdultFare;
      }

      if (req.body.childFare !== undefined) {
        const numChildFare = Number(req.body.childFare);
        if (isNaN(numChildFare) || numChildFare < 0) {
          return res.status(400).json({
            success: false,
            message: 'Child ticket price must be a non-negative numeric value'
          });
        }
        updates.childFare = numChildFare;
      } else if (updates.adultFare !== undefined) {
        updates.childFare = existingFlight.childFare !== undefined ? existingFlight.childFare : Math.round(updates.adultFare * 0.75);
      }

      // Audit log the fare update
      AuditLog.create({
        adminId: req.user._id,
        action: 'UPDATE_FLIGHT_FARE',
        entityType: 'Flight',
        entityId: existingFlight._id,
        details: {
          flightNumber: existingFlight.flightNumber || existingFlight.flightCode,
          previousBaseFare: existingFlight.baseFare,
          previousAdultFare: existingFlight.adultFare,
          previousChildFare: existingFlight.childFare,
          newAdultFare: updates.adultFare,
          newChildFare: updates.childFare
        },
        ipAddress: req.ip || req.headers['x-forwarded-for'] || null
      }).catch((err) => console.error('Failed to log fare update audit:', err.message));
    }

    // 3. Airports validation
    const targetOrigin = originAirportId || existingFlight.originAirportId;
    const targetDest = destinationAirportId || existingFlight.destinationAirportId;

    if (targetOrigin.toString() === targetDest.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Origin and destination airports must be different'
      });
    }

    if (originAirportId) {
      const orig = await Airport.findById(originAirportId);
      if (!orig) return res.status(400).json({ success: false, message: 'Invalid origin airport' });
      updates.originAirportId = originAirportId;
    }

    if (destinationAirportId) {
      const dest = await Airport.findById(destinationAirportId);
      if (!dest) return res.status(400).json({ success: false, message: 'Invalid destination airport' });
      updates.destinationAirportId = destinationAirportId;
    }

    // 4. Date validation
    const targetDep = departureDateTime ? new Date(departureDateTime) : existingFlight.departureDateTime;
    const targetArr = arrivalDateTime ? new Date(arrivalDateTime) : existingFlight.arrivalDateTime;

    if (targetDep && targetArr && targetArr <= targetDep) {
      return res.status(400).json({
        success: false,
        message: 'Departure date/time must precede arrival date/time'
      });
    }

    if (departureDateTime !== undefined) updates.departureDateTime = targetDep;
    if (arrivalDateTime !== undefined) updates.arrivalDateTime = targetArr;

    // 5. Layout & Capacity update
    if (aircraftLayoutId && aircraftLayoutId.toString() !== existingFlight.aircraftLayoutId?.toString()) {
      const layout = await AircraftLayout.findById(aircraftLayoutId);
      if (!layout) {
        return res.status(400).json({ success: false, message: 'Invalid aircraft layout' });
      }
      const calcCapacity =
        layout.seatDefinitions?.filter((s) => s.active !== false).length ||
        (layout.rows && layout.seatsPerRow ? layout.rows * layout.seatsPerRow : 180);

      updates.aircraftLayoutId = aircraftLayoutId;
      updates.totalCapacity = calcCapacity;
      updates.capacity = calcCapacity;
    }

    // 6. Status update
    if (status) {
      updates.status = status;
      updates.active = status === 'ACTIVE';
    } else if (active !== undefined) {
      updates.active = active;
      updates.status = active ? 'ACTIVE' : 'INACTIVE';
    }

    const updatedFlight = await Flight.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    )
      .populate('originAirportId')
      .populate('destinationAirportId')
      .populate('aircraftLayoutId')
      .populate('createdBy', 'firstName lastName email role');

    await AuditLog.create({
      adminId: req.user._id,
      action: 'UPDATE_FLIGHT',
      entityType: 'Flight',
      entityId: id,
      details: updates
    });

    // Synchronize updates with schedules and future instances in MongoDB Atlas
    try {
      const instanceUpdates = {};
      const scheduleUpdates = {};

      if (updates.adultFare !== undefined || updates.baseFare !== undefined || updates.childFare !== undefined) {
        const aFare = updates.adultFare !== undefined ? updates.adultFare : (updates.baseFare !== undefined ? updates.baseFare : existingFlight.adultFare || existingFlight.baseFare);
        const cFare = updates.childFare !== undefined ? updates.childFare : (existingFlight.childFare !== undefined ? existingFlight.childFare : Math.round(aFare * 0.75));
        scheduleUpdates.adultFare = aFare;
        scheduleUpdates.childFare = cFare;
        scheduleUpdates.baseFare = aFare;
        instanceUpdates.adultFare = aFare;
        instanceUpdates.childFare = cFare;
      }

      if (updates.capacity !== undefined) {
        instanceUpdates.capacity = updates.capacity;
      }

      if (updates.active !== undefined) {
        scheduleUpdates.active = updates.active;
      }

      if (Object.keys(scheduleUpdates).length > 0) {
        await FlightSchedule.updateMany({ flightId: id }, { $set: scheduleUpdates });
      }

      if (Object.keys(instanceUpdates).length > 0) {
        await FlightInstance.updateMany(
          { flightId: id, departureDateTime: { $gte: new Date() } },
          { $set: instanceUpdates }
        );
      }
    } catch (syncErr) {
      console.error('Failed to sync flight updates to schedules/instances:', syncErr.message);
    }

    res.json({
      success: true,
      message: `Flight ${updatedFlight.flightNumber} updated successfully`,
      data: { flight: updatedFlight }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle flight status between ACTIVE and INACTIVE
// @route   PATCH /api/admin/flights/:id/status
// @access  Private (SUPER_ADMIN, SCHEDULE_ADMIN)
const toggleFlightStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const flight = await Flight.findById(id);
    if (!flight) {
      return res.status(404).json({ success: false, message: 'Flight not found' });
    }

    const nextStatus = status || (flight.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE');
    flight.status = nextStatus;
    flight.active = nextStatus === 'ACTIVE';
    await flight.save();

    await AuditLog.create({
      adminId: req.user._id,
      action: nextStatus === 'ACTIVE' ? 'ACTIVATE_FLIGHT' : 'DEACTIVATE_FLIGHT',
      entityType: 'Flight',
      entityId: flight._id,
      details: { status: nextStatus }
    });

    const populated = await Flight.findById(flight._id)
      .populate('originAirportId')
      .populate('destinationAirportId')
      .populate('aircraftLayoutId');

    res.json({
      success: true,
      message: `Flight ${flight.flightNumber} marked as ${nextStatus}`,
      data: { flight: populated }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Deactivate flight (soft delete)
// @route   DELETE /api/admin/flights/:id
// @access  Private (SUPER_ADMIN)
const deleteFlight = async (req, res, next) => {
  try {
    const { id } = req.params;
    const flight = await Flight.findByIdAndUpdate(
      id,
      { $set: { status: 'INACTIVE', active: false } },
      { new: true }
    );

    if (!flight) {
      return res.status(404).json({ success: false, message: 'Flight not found' });
    }

    await AuditLog.create({
      adminId: req.user._id,
      action: 'DEACTIVATE_FLIGHT',
      entityType: 'Flight',
      entityId: flight._id
    });

    res.json({
      success: true,
      message: `Flight ${flight.flightNumber || flight.flightCode} deactivated successfully`
    });
  } catch (error) {
    next(error);
  }
};

/* ==================== SCHEDULE & INSTANCE MANAGEMENT ==================== */

// @desc    Create a flight schedule and generate departure instances atomically
// @route   POST /api/admin/schedules
// @access  Private (SUPER_ADMIN, SCHEDULE_ADMIN)
const createSchedule = async (req, res, next) => {
  try {
    const {
      flightId,
      scheduleType = 'DAILY', // 'ONE_TIME', 'DAILY', 'WEEKLY', 'MONTHLY'
      operatingDays = [],
      departureTime,
      arrivalTime,
      departureDate,
      arrivalDate,
      startDate,
      endDate,
      adultFare,
      childFare,
      status = 'SCHEDULED'
    } = req.body;

    if (!flightId) {
      return res.status(400).json({ success: false, message: 'Please select a flight' });
    }

    if (!departureTime || !arrivalTime) {
      return res.status(400).json({ success: false, message: 'Departure time and arrival time are required' });
    }

    // 1. Validate Flight
    const flight = await Flight.findById(flightId)
      .populate('originAirportId')
      .populate('destinationAirportId')
      .populate('aircraftLayoutId');

    if (!flight) {
      return res.status(404).json({ success: false, message: 'Selected flight not found' });
    }

    if (flight.status === 'INACTIVE' || flight.active === false) {
      return res.status(400).json({
        success: false,
        message: `Flight ${flight.flightNumber || flight.flightCode} is currently INACTIVE. Only ACTIVE flights can be scheduled.`
      });
    }

    // 2. Determine Capacity & Fares from Flight (Super Admin Controlled)
    if (req.user.role !== 'SUPER_ADMIN' && adultFare !== undefined && Number(adultFare) !== Number(flight.baseFare)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Pricing configuration is exclusively restricted to Super Administrators. Schedule Administrators cannot modify pricing.'
      });
    }

    const capacity =
      flight.totalCapacity ||
      flight.capacity ||
      flight.aircraftLayoutId?.totalCapacity ||
      (flight.aircraftLayoutId?.rows && flight.aircraftLayoutId?.seatsPerRow
        ? flight.aircraftLayoutId.rows * flight.aircraftLayoutId.seatsPerRow
        : 180);

    const fare = req.user.role === 'SUPER_ADMIN' && Number(adultFare) > 0 ? Number(adultFare) : (flight.baseFare || 3500);
    const chFare = req.user.role === 'SUPER_ADMIN' && Number(childFare) > 0 ? Number(childFare) : Math.round(fare * 0.75);

    // 3. Create Schedule Record
    const schedulePayload = {
      flightId: flight._id,
      scheduleType,
      operatingDays: Array.isArray(operatingDays) ? operatingDays : [],
      departureTime,
      arrivalTime,
      adultFare: fare,
      childFare: chFare,
      status: status === 'ACTIVE' || status === 'ON_TIME' ? 'ON_TIME' : status || 'SCHEDULED',
      active: true,
      timezone: 'Asia/Kolkata',
      createdBy: req.user._id,
      assignedAdmins: [req.user._id]
    };

    if (scheduleType === 'ONE_TIME') {
      if (!departureDate) {
        return res.status(400).json({ success: false, message: 'Departure date is required for One Time schedule' });
      }
      schedulePayload.departureDate = new Date(departureDate);
      schedulePayload.arrivalDate = new Date(arrivalDate || departureDate);
    } else {
      if (!startDate || !endDate) {
        return res.status(400).json({ success: false, message: 'Start date and End date are required for recurring schedule' });
      }
      schedulePayload.startDate = new Date(startDate);
      schedulePayload.endDate = new Date(endDate);
    }

    const schedule = await FlightSchedule.create(schedulePayload);

    // 4. Generate Departures (FlightInstances)
    const instancesToCreate = [];
    const skippedInstances = [];

    if (scheduleType === 'ONE_TIME') {
      const depDT = parseKolkataDateTime(departureDate, departureTime);
      let arrDT = parseKolkataDateTime(arrivalDate || departureDate, arrivalTime);

      if (arrDT <= depDT) {
        arrDT = new Date(arrDT.getTime() + 24 * 60 * 60 * 1000);
      }

      const travelDate = new Date(departureDate);
      travelDate.setUTCHours(0, 0, 0, 0);

      const existing = await FlightInstance.findOne({
        flightId: flight._id,
        departureDateTime: depDT
      });

      if (!existing) {
        instancesToCreate.push({
          flightId: flight._id,
          scheduleId: schedule._id,
          travelDate,
          departureDateTime: depDT,
          arrivalDateTime: arrDT,
          adultFare: fare,
          childFare: chFare,
          capacity,
          bookedCount: 0,
          status: schedulePayload.status
        });
      } else {
        skippedInstances.push(depDT);
      }
    } else {
      // Recurring schedule: DAILY, WEEKLY, MONTHLY
      const start = new Date(startDate);
      const end = new Date(endDate);

      const current = new Date(start);
      while (current <= end) {
        const dateStr = current.toISOString().split('T')[0];
        const dayName = DAY_NAMES[current.getDay()];

        let shouldSchedule = false;
        if (scheduleType === 'DAILY') {
          shouldSchedule = true;
        } else if (scheduleType === 'WEEKLY') {
          shouldSchedule = operatingDays.length === 0 || operatingDays.includes(dayName);
        } else if (scheduleType === 'MONTHLY') {
          shouldSchedule = current.getDate() === start.getDate();
        }

        if (shouldSchedule) {
          const depDT = parseKolkataDateTime(dateStr, departureTime);
          let arrDT = parseKolkataDateTime(dateStr, arrivalTime);

          if (arrDT <= depDT) {
            arrDT = new Date(arrDT.getTime() + 24 * 60 * 60 * 1000);
          }

          const travelDate = new Date(dateStr);
          travelDate.setUTCHours(0, 0, 0, 0);

          const existing = await FlightInstance.findOne({
            flightId: flight._id,
            departureDateTime: depDT
          });

          if (!existing) {
            instancesToCreate.push({
              flightId: flight._id,
              scheduleId: schedule._id,
              travelDate,
              departureDateTime: depDT,
              arrivalDateTime: arrDT,
              adultFare: fare,
              childFare: chFare,
              capacity,
              bookedCount: 0,
              status: schedulePayload.status
            });
          } else {
            skippedInstances.push(depDT);
          }
        }

        current.setDate(current.getDate() + 1);
      }
    }

    let createdInstances = [];
    if (instancesToCreate.length > 0) {
      createdInstances = await FlightInstance.insertMany(instancesToCreate);
    }

    await AuditLog.create({
      adminId: req.user._id,
      action: 'CREATE_SCHEDULE',
      entityType: 'FlightSchedule',
      entityId: schedule._id,
      details: {
        flightNumber: flight.flightNumber || flight.flightCode,
        scheduleType,
        createdDepartures: createdInstances.length,
        skippedDepartures: skippedInstances.length
      }
    });

    res.status(201).json({
      success: true,
      message: `Flight schedule created successfully with ${createdInstances.length} departures generated in MongoDB Atlas.`,
      data: {
        schedule,
        createdDeparturesCount: createdInstances.length,
        skippedDeparturesCount: skippedInstances.length
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    List all schedules
// @route   GET /api/admin/schedules
// @access  Private (SUPER_ADMIN, SCHEDULE_ADMIN)
const listSchedules = async (req, res, next) => {
  try {
    const query = {};
    if (req.query.flightId) query.flightId = req.query.flightId;

    const schedules = await FlightSchedule.find(query)
      .populate({
        path: 'flightId',
        populate: [
          { path: 'originAirportId', model: 'Airport' },
          { path: 'destinationAirportId', model: 'Airport' },
          { path: 'aircraftLayoutId', model: 'AircraftLayout' }
        ]
      })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { schedules }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update schedule
// @route   PUT /api/admin/schedules/:id
// @access  Private (SUPER_ADMIN, SCHEDULE_ADMIN)
const updateSchedule = async (req, res, next) => {
  try {
    const { id } = req.params;
    const schedule = await FlightSchedule.findById(id);
    if (!schedule) {
      return res.status(404).json({ success: false, message: 'Schedule not found' });
    }

    if (req.user.role !== 'SUPER_ADMIN' && (req.body.adultFare !== undefined || req.body.childFare !== undefined)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Pricing configuration is exclusively restricted to Super Administrators. Schedule Administrators cannot modify pricing.'
      });
    }

    Object.assign(schedule, req.body);
    await schedule.save();

    res.json({
      success: true,
      message: 'Schedule updated successfully',
      data: { schedule }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Deactivate schedule
// @route   DELETE /api/admin/schedules/:id
// @access  Private (SUPER_ADMIN, SCHEDULE_ADMIN)
const deleteSchedule = async (req, res, next) => {
  try {
    const { id } = req.params;
    const schedule = await FlightSchedule.findById(id);
    if (!schedule) {
      return res.status(404).json({ success: false, message: 'Schedule not found' });
    }

    schedule.active = false;
    await schedule.save();

    res.json({
      success: true,
      message: 'Schedule deactivated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    List all scheduled departures (FlightInstances)
// @route   GET /api/admin/instances
// @access  Private (SUPER_ADMIN, SCHEDULE_ADMIN)
const listFlightInstances = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.flightId) filter.flightId = req.query.flightId;
    if (req.query.status && req.query.status !== 'ALL') {
      if (req.query.status === 'ON_TIME') {
        filter.status = { $in: ['ON_TIME', 'SCHEDULED'] };
      } else {
        filter.status = req.query.status;
      }
    }

    const instances = await FlightInstance.find(filter)
      .populate({
        path: 'flightId',
        populate: [
          { path: 'originAirportId', model: 'Airport' },
          { path: 'destinationAirportId', model: 'Airport' },
          { path: 'aircraftLayoutId', model: 'AircraftLayout' }
        ]
      })
      .populate('scheduleId')
      .sort({ departureDateTime: 1 });

    res.json({
      success: true,
      data: {
        instances,
        count: instances.length
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update single scheduled departure
// @route   PUT /api/admin/instances/:id
// @access  Private (SUPER_ADMIN, SCHEDULE_ADMIN)
const updateFlightInstance = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { departureDateTime, arrivalDateTime, adultFare, status } = req.body;

    const instance = await FlightInstance.findById(id).populate('flightId');
    if (!instance) {
      return res.status(404).json({ success: false, message: 'Scheduled departure not found' });
    }

    if (req.user.role !== 'SUPER_ADMIN' && (adultFare !== undefined || req.body.childFare !== undefined || req.body.baseFare !== undefined)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Pricing configuration is exclusively restricted to Super Administrators. Schedule Administrators cannot modify pricing.'
      });
    }

    const updates = {};
    if (departureDateTime) updates.departureDateTime = new Date(departureDateTime);
    if (arrivalDateTime) updates.arrivalDateTime = new Date(arrivalDateTime);
    if (adultFare !== undefined && Number(adultFare) > 0) updates.adultFare = Number(adultFare);
    if (req.body.childFare !== undefined && Number(req.body.childFare) > 0) updates.childFare = Number(req.body.childFare);
    if (status) updates.status = status;

    const updated = await FlightInstance.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    )
      .populate({
        path: 'flightId',
        populate: [
          { path: 'originAirportId', model: 'Airport' },
          { path: 'destinationAirportId', model: 'Airport' },
          { path: 'aircraftLayoutId', model: 'AircraftLayout' }
        ]
      })
      .populate('scheduleId');

    await AuditLog.create({
      adminId: req.user._id,
      action: 'UPDATE_INSTANCE',
      entityType: 'FlightInstance',
      entityId: id,
      details: updates
    });

    res.json({
      success: true,
      message: 'Scheduled departure updated successfully in MongoDB Atlas',
      data: { instance: updated }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel scheduled departure (preserves customer bookings)
// @route   DELETE /api/admin/instances/:id
// @access  Private (SUPER_ADMIN, SCHEDULE_ADMIN)
const cancelFlightInstance = async (req, res, next) => {
  try {
    const { id } = req.params;
    const instance = await FlightInstance.findById(id);
    if (!instance) {
      return res.status(404).json({ success: false, message: 'Scheduled departure not found' });
    }

    instance.status = 'CANCELLED';
    await instance.save();

    await AuditLog.create({
      adminId: req.user._id,
      action: 'CANCEL_INSTANCE',
      entityType: 'FlightInstance',
      entityId: id,
      details: { status: 'CANCELLED' }
    });

    res.json({
      success: true,
      message: 'Scheduled departure cancelled. Customer reservations preserved.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk generate flight instances from active schedules
// @route   POST /api/admin/instances/generate
// @access  Private (SUPER_ADMIN, SCHEDULE_ADMIN)
const generateInstances = async (req, res, next) => {
  try {
    const { startDate, endDate, flightId } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate and endDate are required (YYYY-MM-DD)'
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      return res.status(400).json({
        success: false,
        message: 'startDate must be before or equal to endDate'
      });
    }

    const scheduleQuery = { active: true };
    if (flightId) scheduleQuery.flightId = flightId;

    const schedules = await FlightSchedule.find(scheduleQuery).populate('flightId');
    if (schedules.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No active schedules found matching criteria'
      });
    }

    let createdCount = 0;
    let skippedCount = 0;

    const currentDate = new Date(start);
    while (currentDate <= end) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayName = DAY_NAMES[currentDate.getDay()];

      for (const sched of schedules) {
        if (!sched.flightId || !sched.flightId.active) continue;

        let shouldSchedule = false;
        if (sched.scheduleType === 'DAILY') {
          shouldSchedule = true;
        } else if (sched.scheduleType === 'WEEKLY') {
          shouldSchedule = !sched.operatingDays?.length || sched.operatingDays.includes(dayName);
        } else if (sched.scheduleType === 'MONTHLY') {
          shouldSchedule = currentDate.getDate() === start.getDate();
        } else if (sched.scheduleType === 'ONE_TIME') {
          shouldSchedule = sched.departureDate && sched.departureDate.toISOString().split('T')[0] === dateStr;
        }

        if (shouldSchedule) {
          const depDT = parseKolkataDateTime(dateStr, sched.departureTime);
          let arrDT = parseKolkataDateTime(dateStr, sched.arrivalTime);

          if (arrDT <= depDT) {
            arrDT = new Date(arrDT.getTime() + 24 * 60 * 60 * 1000);
          }

          const travelDate = new Date(dateStr);
          travelDate.setUTCHours(0, 0, 0, 0);

          const existing = await FlightInstance.findOne({
            flightId: sched.flightId._id,
            departureDateTime: depDT
          });

          if (existing) {
            skippedCount++;
            continue;
          }

          const capacity =
            sched.flightId.totalCapacity ||
            sched.flightId.capacity ||
            180;

          await FlightInstance.create({
            flightId: sched.flightId._id,
            scheduleId: sched._id,
            travelDate,
            departureDateTime: depDT,
            arrivalDateTime: arrDT,
            adultFare: sched.adultFare || sched.flightId.baseFare || 3500,
            childFare: sched.childFare || Math.round((sched.adultFare || sched.flightId.baseFare || 3500) * 0.75),
            capacity,
            bookedCount: 0,
            status: sched.status || 'SCHEDULED'
          });

          createdCount++;
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    res.json({
      success: true,
      message: `Generated ${createdCount} flight instances (${skippedCount} already existed in MongoDB Atlas)`,
      data: { createdCount, skippedCount }
    });
  } catch (error) {
    next(error);
  }
};

/* ==================== AIRCRAFT LAYOUT CRUD ==================== */

const createLayout = async (req, res, next) => {
  try {
    const { name, type, rows, seatsPerRow, seatDefinitions } = req.body;

    let defs = seatDefinitions;

    // Auto-generate seatDefinitions if not provided
    if (!defs || defs.length === 0) {
      defs = [];
      const columns = type === '2-2' ? ['A', 'B', 'C', 'D'] : ['A', 'B', 'C', 'D', 'E', 'F'];

      for (let r = 1; r <= rows; r++) {
        for (const col of columns) {
          let position = 'MIDDLE';
          if (type === '2-2') {
            position = col === 'A' || col === 'D' ? 'WINDOW' : 'AISLE';
          } else {
            if (col === 'A' || col === 'F') position = 'WINDOW';
            else if (col === 'C' || col === 'D') position = 'AISLE';
            else position = 'MIDDLE';
          }

          defs.push({
            seatNumber: `${r}${col}`,
            row: r,
            column: col,
            position,
            active: true
          });
        }
      }
    }

    const layout = await AircraftLayout.create({
      name,
      type: type || '3-3',
      rows,
      seatsPerRow: seatsPerRow || (type === '2-2' ? 4 : 6),
      seatDefinitions: defs,
      createdBy: req.user._id
    });

    res.status(201).json({
      success: true,
      message: 'Aircraft layout created successfully',
      data: { layout }
    });
  } catch (error) {
    next(error);
  }
};

const listLayouts = async (req, res, next) => {
  try {
    const layouts = await AircraftLayout.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      data: { layouts }
    });
  } catch (error) {
    next(error);
  }
};

const getLayoutById = async (req, res, next) => {
  try {
    const layout = await AircraftLayout.findById(req.params.id);
    if (!layout) {
      return res.status(404).json({ success: false, message: 'Layout not found' });
    }
    res.json({
      success: true,
      data: { layout }
    });
  } catch (error) {
    next(error);
  }
};

/* ==================== ADMIN BOOKINGS VIEW ==================== */

const getAllBookings = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status) filter.status = req.query.status.toUpperCase();
    if (req.query.flightInstanceId) filter.flightInstanceId = req.query.flightInstanceId;

    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .populate('userId', 'username email firstName lastName phone')
        .populate({
          path: 'flightInstanceId',
          populate: {
            path: 'flightId',
            populate: [
              { path: 'originAirportId', model: 'Airport' },
              { path: 'destinationAirportId', model: 'Airport' }
            ]
          }
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Booking.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        bookings,
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

/* ==================== DASHBOARD STATS ==================== */

const getDashboardStats = async (req, res, next) => {
  try {
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setUTCHours(23, 59, 59, 999);

    const [
      totalUsers,
      totalFlights,
      todayDepartures,
      confirmedBookings,
      revenueResult
    ] = await Promise.all([
      User.countDocuments({ role: 'CUSTOMER' }),
      Flight.countDocuments({ active: true }),
      FlightInstance.countDocuments({
        departureDateTime: { $gte: todayStart, $lte: todayEnd },
        status: { $ne: 'CANCELLED' }
      }),
      Booking.countDocuments({ status: 'CONFIRMED' }),
      Payment.aggregate([
        { $match: { status: 'SUCCESS' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);

    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

    res.json({
      success: true,
      data: {
        totalUsers,
        totalFlights,
        todayDepartures,
        confirmedBookings,
        totalRevenue
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update flight pricing (Super Admin exclusive)
// @route   PUT /api/admin/flights/:id/pricing
// @access  Private (SUPER_ADMIN only)
const updateFlightPricing = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { baseFare, adultFare, childFare, syncFutureInstances = true } = req.body;

    const inputAdult = adultFare !== undefined ? adultFare : baseFare;
    const newAdultFare = Number(inputAdult);
    if (isNaN(newAdultFare) || newAdultFare <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Adult ticket price must be a positive numeric value greater than ₹0'
      });
    }

    let newChildFare;
    if (childFare !== undefined && childFare !== null && childFare !== '') {
      newChildFare = Number(childFare);
      if (isNaN(newChildFare) || newChildFare < 0) {
        return res.status(400).json({
          success: false,
          message: 'Child ticket price must be a non-negative numeric value'
        });
      }
    } else {
      newChildFare = Math.round(newAdultFare * 0.75);
    }

    const flight = await Flight.findById(id);
    if (!flight) {
      return res.status(404).json({ success: false, message: 'Flight not found in catalog' });
    }

    const previousBaseFare = flight.baseFare;
    const previousAdultFare = flight.adultFare;
    const previousChildFare = flight.childFare;

    flight.baseFare = newAdultFare;
    flight.adultFare = newAdultFare;
    flight.childFare = newChildFare;
    await flight.save();

    let updatedInstancesCount = 0;
    if (syncFutureInstances) {
      const updateResult = await FlightInstance.updateMany(
        {
          flightId: flight._id,
          departureDateTime: { $gte: new Date() }
        },
        {
          $set: {
            adultFare: newAdultFare,
            childFare: newChildFare
          }
        }
      );
      updatedInstancesCount = updateResult.modifiedCount || 0;

      // Sync active schedules as well
      await FlightSchedule.updateMany(
        { flightId: flight._id },
        {
          $set: {
            adultFare: newAdultFare,
            childFare: newChildFare,
            baseFare: newAdultFare
          }
        }
      );
    }

    // Record audit log
    await AuditLog.create({
      adminId: req.user._id,
      action: 'UPDATE_FLIGHT_FARE',
      entityType: 'Flight',
      entityId: flight._id,
      details: {
        flightNumber: flight.flightNumber || flight.flightCode,
        previousBaseFare,
        previousAdultFare,
        previousChildFare,
        newAdultFare,
        newChildFare,
        updatedInstancesCount
      },
      ipAddress: req.ip || req.headers['x-forwarded-for'] || null
    });

    res.json({
      success: true,
      message: `Pricing updated for flight ${flight.flightNumber || flight.flightCode}: Adult ₹${newAdultFare.toLocaleString('en-IN')}, Child ₹${newChildFare.toLocaleString('en-IN')}. Updated ${updatedInstancesCount} future flight instances.`,
      data: {
        flight,
        baseFare: newAdultFare,
        adultFare: newAdultFare,
        childFare: newChildFare,
        updatedInstancesCount
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createFlight,
  listFlights,
  getFlightById,
  updateFlight,
  updateFlightPricing,
  toggleFlightStatus,
  deleteFlight,
  createSchedule,
  listSchedules,
  updateSchedule,
  deleteSchedule,
  generateInstances,
  listFlightInstances,
  updateFlightInstance,
  cancelFlightInstance,
  createLayout,
  listLayouts,
  getLayoutById,
  getAllBookings,
  getDashboardStats
};
