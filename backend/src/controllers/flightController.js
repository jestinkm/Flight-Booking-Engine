const mongoose = require('mongoose');
const FlightInstance = require('../models/FlightInstance');
const FlightSchedule = require('../models/FlightSchedule');
const Flight = require('../models/Flight');
const Airport = require('../models/Airport');
const SearchEvent = require('../models/SearchEvent');
const { getSeatMap } = require('../services/seatAllocationService');

const formatInstanceWithHelpers = (inst) => {
  if (!inst) return null;
  const obj = inst.toObject ? inst.toObject({ virtuals: true }) : { ...inst };
  const flight = obj.flightId || {};
  obj.flightNumber = flight.flightNumber || flight.flightCode || 'SK-101';
  obj.flightName = flight.flightName || 'Skynexa Flight';
  obj.airline = flight.airline || 'Skynexa Airways';
  obj.aircraft = flight.aircraftLayoutId?.name || 'Airbus A320neo';
  obj.layoutType = flight.aircraftLayoutId?.type || '3-3';
  obj.rowCount = flight.aircraftLayoutId?.rows || 12;
  obj.origin = flight.originAirportId?.code || 'DEL';
  obj.originCode = flight.originAirportId?.code || 'DEL';
  obj.destination = flight.destinationAirportId?.code || 'BOM';
  obj.destinationCode = flight.destinationAirportId?.code || 'BOM';
  obj.originCity = flight.originAirportId?.city || 'New Delhi';
  obj.destinationCity = flight.destinationAirportId?.city || 'Mumbai';
  obj.originAirport = flight.originAirportId;
  obj.destinationAirport = flight.destinationAirportId;
  obj.baseFare = obj.adultFare;
  obj.price = obj.adultFare;
  obj.stops = 0;

  if (obj.departureDateTime) {
    const depDate = new Date(obj.departureDateTime);
    obj.departureTime = depDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata'
    });
    const istHourStr = depDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      hour12: false,
      timeZone: 'Asia/Kolkata'
    });
    obj.departureHour = parseInt(istHourStr, 10);
  }

  if (obj.arrivalDateTime) {
    const arrDate = new Date(obj.arrivalDateTime);
    obj.arrivalTime = arrDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata'
    });
  }

  if (obj.departureDateTime && obj.arrivalDateTime) {
    const durationMs = new Date(obj.arrivalDateTime) - new Date(obj.departureDateTime);
    const totalMins = Math.max(0, Math.round(durationMs / (1000 * 60)));
    obj.durationMinutes = totalMins;
    const hrs = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    obj.duration = `${hrs}h ${mins}m`;
  }

  return obj;
};

// @desc    Search flight instances with rich filters and sorting
// @route   GET /api/flights/search
// @access  Public
const searchFlights = async (req, res, next) => {
  try {
    const {
      origin,
      destination,
      date,
      adults = 1,
      children = 0,
      fareMin,
      fareMax,
      departureTimeFrom,
      departureTimeTo,
      sortBy = 'fare_asc'
    } = req.query;

    const adultCount = parseInt(adults, 10) || 1;
    const childCount = parseInt(children, 10) || 0;
    const totalPassengers = adultCount + childCount;

    // Business Rule: Origin and destination must differ
    if (origin && destination && origin.toUpperCase().trim() === destination.toUpperCase().trim()) {
      return res.status(400).json({
        success: false,
        message: 'Origin and destination airports must be different.',
        data: { flights: [], count: 0 }
      });
    }

    // Resolve Origin Airport
    let originAirport = null;
    if (origin) {
      originAirport = await Airport.findOne({
        $or: [{ code: origin.toUpperCase() }, { _id: origin.match(/^[0-9a-fA-F]{24}$/) ? origin : null }]
      });
      if (!originAirport) {
        SearchEvent.create({
          userId: req.user ? req.user._id : null,
          sessionId: req.headers['x-session-id'] || null,
          originCode: origin ? origin.toUpperCase() : null,
          destinationCode: destination ? destination.toUpperCase() : null,
          travelDate: date ? new Date(date) : null,
          passengerCount: totalPassengers,
          adults: adultCount,
          children: childCount,
          resultCount: 0,
          eventType: 'SEARCH'
        }).catch(() => {});

        return res.json({
          success: true,
          flights: [],
          message: `No flights found. Origin airport '${origin}' was not found.`,
          data: {
            flights: [],
            count: 0,
            criteria: { origin: null, destination: null, date, passengers: { adults: adultCount, children: childCount, total: totalPassengers } }
          }
        });
      }
    }

    // Resolve Destination Airport
    let destAirport = null;
    if (destination) {
      destAirport = await Airport.findOne({
        $or: [{ code: destination.toUpperCase() }, { _id: destination.match(/^[0-9a-fA-F]{24}$/) ? destination : null }]
      });
      if (!destAirport) {
        SearchEvent.create({
          userId: req.user ? req.user._id : null,
          sessionId: req.headers['x-session-id'] || null,
          originAirportId: originAirport ? originAirport._id : null,
          originCode: origin ? origin.toUpperCase() : null,
          destinationCode: destination ? destination.toUpperCase() : null,
          travelDate: date ? new Date(date) : null,
          passengerCount: totalPassengers,
          adults: adultCount,
          children: childCount,
          resultCount: 0,
          eventType: 'SEARCH'
        }).catch(() => {});

        return res.json({
          success: true,
          flights: [],
          message: `No flights found. Destination airport '${destination}' was not found.`,
          data: {
            flights: [],
            count: 0,
            criteria: { origin: originAirport, destination: null, date, passengers: { adults: adultCount, children: childCount, total: totalPassengers } }
          }
        });
      }
    }

    // Find Flights matching origin and destination
    const flightFilter = { active: true };
    if (originAirport) flightFilter.originAirportId = originAirport._id;
    if (destAirport) flightFilter.destinationAirportId = destAirport._id;

    const matchingFlights = await Flight.find(flightFilter).populate('aircraftLayoutId');
    const matchingFlightIds = matchingFlights.map((f) => f._id);

    if (matchingFlightIds.length === 0) {
      SearchEvent.create({
        userId: req.user ? req.user._id : null,
        sessionId: req.headers['x-session-id'] || null,
        originAirportId: originAirport ? originAirport._id : null,
        destinationAirportId: destAirport ? destAirport._id : null,
        originCode: origin ? origin.toUpperCase() : null,
        destinationCode: destination ? destination.toUpperCase() : null,
        travelDate: date ? new Date(date) : null,
        passengerCount: totalPassengers,
        adults: adultCount,
        children: childCount,
        resultCount: 0,
        eventType: 'SEARCH'
      }).catch(() => {});

      return res.json({
        success: true,
        flights: [],
        message: 'No flights are scheduled for this route and date. Please select another date or destination.',
        data: {
          flights: [],
          count: 0,
          criteria: {
            origin: originAirport,
            destination: destAirport,
            date,
            passengers: { adults: adultCount, children: childCount, total: totalPassengers }
          }
        }
      });
    }

    // Auto-heal / Ensure FlightInstance exists in MongoDB Atlas for all matching flights
    const targetDateStr = date || new Date().toISOString().split('T')[0];
    const [tYear, tMonth, tDay] = targetDateStr.split('-').map(Number);
    const startCheck = new Date(Date.UTC(tYear, tMonth - 1, tDay, 0, 0, 0) - (5.5 * 3600 * 1000));
    const endCheck = new Date(Date.UTC(tYear, tMonth - 1, tDay, 23, 59, 59, 999) + (5.5 * 3600 * 1000));

    const DAY_NAMES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const targetTravelDate = new Date(targetDateStr);
    targetTravelDate.setUTCHours(0, 0, 0, 0);
    const dayOfWeekName = DAY_NAMES[targetTravelDate.getDay()];

    for (const flightDoc of matchingFlights) {
      try {
        const hasInstance = await FlightInstance.findOne({
          flightId: flightDoc._id,
          $or: [
            { departureDateTime: { $gte: startCheck, $lte: endCheck } },
            { travelDate: targetTravelDate }
          ]
        });

        if (!hasInstance) {
          let sched = await FlightSchedule.findOne({ flightId: flightDoc._id, active: true });

          if (!sched) {
            // Auto-create active Daily FlightSchedule for this flight in MongoDB Atlas
            sched = await FlightSchedule.create({
              flightId: flightDoc._id,
              scheduleType: 'DAILY',
              operatingDays: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
              departureTime: '09:00',
              arrivalTime: '11:30',
              adultFare: flightDoc.baseFare || 3500,
              childFare: Math.round((flightDoc.baseFare || 3500) * 0.75),
              status: 'ON_TIME',
              active: true,
              timezone: 'Asia/Kolkata',
              startDate: targetTravelDate,
              endDate: new Date(targetTravelDate.getTime() + 60 * 24 * 60 * 60 * 1000)
            }).catch(() => null);
          }

          // If weekly, respect operating days
          if (sched && sched.scheduleType === 'WEEKLY' && Array.isArray(sched.operatingDays) && sched.operatingDays.length > 0) {
            if (!sched.operatingDays.includes(dayOfWeekName)) {
              continue;
            }
          }

          const depTime = sched?.departureTime || '09:00';
          const arrTime = sched?.arrivalTime || '11:30';
          const depDT = new Date(`${targetDateStr}T${depTime}:00+05:30`);
          let arrDT = new Date(`${targetDateStr}T${arrTime}:00+05:30`);
          if (arrDT <= depDT) {
            arrDT = new Date(arrDT.getTime() + 24 * 60 * 60 * 1000);
          }

          const fare = sched?.adultFare || flightDoc.baseFare || 3500;
          const chFare = sched?.childFare || Math.round(fare * 0.75);
          const cap = flightDoc.totalCapacity || flightDoc.capacity || flightDoc.aircraftLayoutId?.totalCapacity || 180;

          await FlightInstance.create({
            flightId: flightDoc._id,
            scheduleId: sched ? sched._id : null,
            travelDate: targetTravelDate,
            departureDateTime: depDT,
            arrivalDateTime: arrDT,
            adultFare: fare,
            childFare: chFare,
            capacity: cap,
            bookedCount: 0,
            status: 'SCHEDULED'
          }).catch((err) => {
            if (err.code !== 11000) console.error('Error auto-creating instance:', err.message);
          });
        }
      } catch (checkErr) {
        // Continue silently if check fails
      }
    }

    // Build FlightInstance filter
    const instanceFilter = {
      flightId: { $in: matchingFlightIds },
      status: { $in: ['SCHEDULED', 'ON_TIME', 'DELAYED'] }
    };

    // Filter by travel date
    if (date) {
      const [year, month, day] = date.split('-').map(Number);
      const startOfIstDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0) - (5.5 * 3600 * 1000));
      const endOfIstDay = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999) - (5.5 * 3600 * 1000));
      const startOfUtcDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
      const endOfUtcDay = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));

      instanceFilter.$or = [
        { departureDateTime: { $gte: startOfIstDay, $lte: endOfIstDay } },
        { departureDateTime: { $gte: startOfUtcDay, $lte: endOfUtcDay } },
        { travelDate: { $gte: startOfUtcDay, $lte: endOfUtcDay } },
        { travelDate: { $gte: startOfIstDay, $lte: endOfIstDay } }
      ];
    } else {
      // Future flights only by default
      instanceFilter.departureDateTime = { $gte: new Date() };
    }

    // Fare range filter
    if (fareMin || fareMax) {
      instanceFilter.adultFare = {};
      if (fareMin) instanceFilter.adultFare.$gte = Number(fareMin);
      if (fareMax) instanceFilter.adultFare.$lte = Number(fareMax);
    }

    // Query DB
    let instances = await FlightInstance.find(instanceFilter)
      .populate({
        path: 'flightId',
        populate: [
          { path: 'originAirportId', model: 'Airport' },
          { path: 'destinationAirportId', model: 'Airport' },
          { path: 'aircraftLayoutId', model: 'AircraftLayout', select: 'name type rows seatsPerRow' }
        ]
      })
      .populate('scheduleId');

    // Filter by capacity (availableSeats >= totalPassengers)
    instances = instances.filter((inst) => inst.availableSeats >= totalPassengers);

    // Business Rule: Show flights only on configured operating days for weekly schedules
    if (date) {
      const DAY_NAMES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
      instances = instances.filter((inst) => {
        const sched = inst.scheduleId;
        if (sched && sched.scheduleType === 'WEEKLY' && Array.isArray(sched.operatingDays) && sched.operatingDays.length > 0) {
          const depDay = DAY_NAMES[new Date(inst.departureDateTime).getDay()];
          if (!sched.operatingDays.includes(depDay)) return false;
        }
        return true;
      });
    }

    // Filter by departure time range (HH:MM string comparison on local departure time)
    if (departureTimeFrom || departureTimeTo) {
      instances = instances.filter((inst) => {
        const depDate = new Date(inst.departureDateTime);
        const hours = depDate.getHours().toString().padStart(2, '0');
        const minutes = depDate.getMinutes().toString().padStart(2, '0');
        const timeStr = `${hours}:${minutes}`;

        if (departureTimeFrom && timeStr < departureTimeFrom) return false;
        if (departureTimeTo && timeStr > departureTimeTo) return false;
        return true;
      });
    }

    // Add helper fields
    const formattedInstances = instances.map((inst) => formatInstanceWithHelpers(inst));

    // Apply Sorting
    formattedInstances.sort((a, b) => {
      switch (sortBy) {
        case 'fare_asc':
          return a.adultFare - b.adultFare;
        case 'fare_desc':
          return b.adultFare - a.adultFare;
        case 'departure_asc':
          return new Date(a.departureDateTime) - new Date(b.departureDateTime);
        case 'departure_desc':
          return new Date(b.departureDateTime) - new Date(a.departureDateTime);
        case 'duration_asc':
          return a.durationMinutes - b.durationMinutes;
        case 'duration_desc':
          return b.durationMinutes - a.durationMinutes;
        default:
          return a.adultFare - b.adultFare;
      }
    });

    // Record SearchEvent asynchronously
    SearchEvent.create({
      userId: req.user ? req.user._id : null,
      sessionId: req.headers['x-session-id'] || null,
      originAirportId: originAirport ? originAirport._id : null,
      destinationAirportId: destAirport ? destAirport._id : null,
      originCode: origin ? origin.toUpperCase() : null,
      destinationCode: destination ? destination.toUpperCase() : null,
      travelDate: date ? new Date(date) : null,
      passengerCount: totalPassengers,
      adults: adultCount,
      children: childCount,
      resultCount: formattedInstances.length,
      eventType: 'SEARCH'
    }).catch((err) => console.error('Failed to log search event:', err.message));

    res.json({
      success: true,
      flights: formattedInstances,
      message: formattedInstances.length > 0 ? 'Flights found' : 'No flights are scheduled for this route and date. Please select another date or destination.',
      data: {
        flights: formattedInstances,
        count: formattedInstances.length,
        criteria: {
          origin: originAirport,
          destination: destAirport,
          date,
          passengers: { adults: adultCount, children: childCount, total: totalPassengers }
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get flight instance by ID
// @route   GET /api/flights/instance/:id
// @access  Public
const getFlightInstance = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: 'Flight instance not found'
      });
    }

    const instance = await FlightInstance.findById(id)
      .populate({
        path: 'flightId',
        populate: [
          { path: 'originAirportId', model: 'Airport' },
          { path: 'destinationAirportId', model: 'Airport' },
          { path: 'aircraftLayoutId', model: 'AircraftLayout' }
        ]
      })
      .populate('scheduleId');

    if (!instance) {
      return res.status(404).json({
        success: false,
        message: 'Flight instance not found'
      });
    }

    const formatted = formatInstanceWithHelpers(instance);
    try {
      const seatMap = await getSeatMap(instance._id);
      formatted.seats = seatMap.seats || [];
      formatted.layout = seatMap.layout;
      if (seatMap.layout?.rows) formatted.rowCount = seatMap.layout.rows;
      if (seatMap.layout?.type) formatted.layoutType = seatMap.layout.type;
    } catch {
      // Seat map unavailable
    }

    res.json({
      success: true,
      flightInstance: formatted,
      data: {
        flightInstance: formatted
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get full seat map for a flight instance
// @route   GET /api/flights/instance/:id/seats
// @access  Public
const getFlightInstanceSeats = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: 'Flight instance not found'
      });
    }

    try {
      const seatMap = await getSeatMap(id);
      return res.json({
        success: true,
        data: seatMap
      });
    } catch (err) {
      return res.status(404).json({
        success: false,
        message: err.message || 'Seat map could not be loaded'
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get flight details with upcoming instances (or direct instance lookup)
// @route   GET /api/flights/:id
// @access  Public
const getFlightDetails = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: 'Flight not found'
      });
    }

    // Try finding as FlightInstance first (frontend /flights/:instanceId route points here)
    const instance = await FlightInstance.findById(id)
      .populate({
        path: 'flightId',
        populate: [
          { path: 'originAirportId', model: 'Airport' },
          { path: 'destinationAirportId', model: 'Airport' },
          { path: 'aircraftLayoutId', model: 'AircraftLayout' }
        ]
      })
      .populate('scheduleId');

    if (instance) {
      const formatted = formatInstanceWithHelpers(instance);
      try {
        const seatMap = await getSeatMap(instance._id);
        formatted.seats = seatMap.seats || [];
        formatted.layout = seatMap.layout;
        if (seatMap.layout?.rows) formatted.rowCount = seatMap.layout.rows;
        if (seatMap.layout?.type) formatted.layoutType = seatMap.layout.type;
      } catch {
        // Seat map fallback
      }
      return res.json({
        success: true,
        flight: formatted,
        flightInstance: formatted,
        data: {
          flight: formatted,
          flightInstance: formatted,
          upcomingInstances: [formatted]
        }
      });
    }

    // Otherwise try finding as Flight definition
    const flight = await Flight.findById(id)
      .populate('originAirportId')
      .populate('destinationAirportId')
      .populate('aircraftLayoutId');

    if (!flight) {
      return res.status(404).json({
        success: false,
        message: 'Flight not found'
      });
    }

    const upcomingInstances = await FlightInstance.find({
      flightId: flight._id,
      departureDateTime: { $gte: new Date() },
      status: { $in: ['SCHEDULED', 'ON_TIME', 'DELAYED'] }
    })
      .sort({ departureDateTime: 1 })
      .limit(10);

    const formattedInstances = upcomingInstances.map((inst) => formatInstanceWithHelpers(inst));

    res.json({
      success: true,
      flight,
      data: {
        flight,
        upcomingInstances: formattedInstances
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get recently searched flights for authenticated customer
// @route   GET /api/flights/recent-searches
// @access  Public (Optional Auth)
const getRecentSearches = async (req, res, next) => {
  try {
    const query = {
      eventType: 'SEARCH',
      originCode: { $ne: null },
      destinationCode: { $ne: null }
    };

    if (req.user && req.user._id) {
      query.userId = req.user._id;
    } else if (req.headers['x-session-id']) {
      query.sessionId = req.headers['x-session-id'];
    } else {
      // Return general recent searches if unauthenticated and no session
      // limited to 4
    }

    const rawSearches = await SearchEvent.find(query)
      .sort({ createdAt: -1 })
      .limit(15)
      .populate('originAirportId', 'name city code country')
      .populate('destinationAirportId', 'name city code country');

    // Deduplicate by origin, destination and travel date
    const seen = new Set();
    const uniqueSearches = [];

    for (const s of rawSearches) {
      const dateStr = s.travelDate
        ? new Date(s.travelDate).toISOString().split('T')[0]
        : s.createdAt
        ? new Date(s.createdAt).toISOString().split('T')[0]
        : '';
      const key = `${s.originCode}_${s.destinationCode}_${dateStr}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueSearches.push({
          id: s._id,
          origin: s.originCode,
          destination: s.destinationCode,
          originCity: s.originAirportId?.city || s.originCode,
          destinationCity: s.destinationAirportId?.city || s.destinationCode,
          originAirportName: s.originAirportId?.name,
          destinationAirportName: s.destinationAirportId?.name,
          date: dateStr,
          adults: s.adults || s.passengerCount || 1,
          children: s.children || 0,
          passengerCount: s.passengerCount || 1,
          resultCount: s.resultCount || 0,
          searchedAt: s.createdAt
        });
      }
      if (uniqueSearches.length >= 6) break;
    }

    res.json({
      success: true,
      searches: uniqueSearches,
      data: {
        searches: uniqueSearches,
        count: uniqueSearches.length
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  searchFlights,
  getRecentSearches,
  getFlightInstance,
  getFlightInstanceSeats,
  getFlightDetails
};
