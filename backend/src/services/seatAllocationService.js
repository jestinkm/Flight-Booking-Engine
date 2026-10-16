const FlightInstance = require('../models/FlightInstance');
const Flight = require('../models/Flight');
const AircraftLayout = require('../models/AircraftLayout');
const BookingSeat = require('../models/BookingSeat');

/**
 * Priority order for seat allocation:
 * 1. WINDOW
 * 2. AISLE
 * 3. MIDDLE
 */
const POSITION_PRIORITY = {
  WINDOW: 1,
  AISLE: 2,
  MIDDLE: 3
};

/**
 * Allocate seats based on policy (GROUP_PREFERENCE or STRICT_PRIORITY)
 * @param {string|ObjectId} flightInstanceId
 * @param {number} count
 * @param {string} policy 'GROUP_PREFERENCE' | 'STRICT_PRIORITY'
 * @param {ClientSession} session
 * @returns {Promise<Array<{seatNumber: string, position: string}>>}
 */
const allocateSeats = async (flightInstanceId, count, policy = 'GROUP_PREFERENCE', session = null) => {
  if (count <= 0) {
    return [];
  }

  // 1. Fetch flight instance
  const flightInstance = await FlightInstance.findById(flightInstanceId).session(session);
  if (!flightInstance) {
    throw new Error('Flight instance not found');
  }

  // 2. Fetch flight and layout
  const flight = await Flight.findById(flightInstance.flightId).session(session);
  if (!flight) {
    throw new Error('Associated flight not found');
  }

  const layout = await AircraftLayout.findById(flight.aircraftLayoutId).session(session);
  if (!layout) {
    throw new Error('Aircraft layout not found');
  }

  // 3. Get all active seat definitions
  const activeDefinitions = layout.seatDefinitions.filter((s) => s.active !== false);

  // 4. Get currently assigned seats
  const assignedSeats = await BookingSeat.find({
    flightInstanceId,
    status: 'ASSIGNED'
  }).session(session).select('seatNumber');

  const assignedSet = new Set(assignedSeats.map((s) => s.seatNumber));

  // 5. Filter available seats
  const availableSeats = activeDefinitions.filter((s) => !assignedSet.has(s.seatNumber));

  if (availableSeats.length < count) {
    throw new Error(`Not enough seats available. Requested: ${count}, Available: ${availableSeats.length}`);
  }

  let selectedSeats = [];

  // Helper sorting function for STRICT_PRIORITY
  const strictSort = (a, b) => {
    const pA = POSITION_PRIORITY[a.position] || 99;
    const pB = POSITION_PRIORITY[b.position] || 99;
    if (pA !== pB) return pA - pB;
    if (a.row !== b.row) return a.row - b.row;
    return a.column.localeCompare(b.column);
  };

  if (policy === 'GROUP_PREFERENCE' && count > 1) {
    // Group available seats by row
    const rowMap = new Map();
    for (const seat of availableSeats) {
      if (!rowMap.has(seat.row)) {
        rowMap.set(seat.row, []);
      }
      rowMap.get(seat.row).push(seat);
    }

    // Try finding contiguous adjacent seats in the same row
    for (const [, seatsInRow] of rowMap) {
      // Sort by column
      seatsInRow.sort((a, b) => a.column.localeCompare(b.column));

      // Find contiguous sequences
      for (let i = 0; i <= seatsInRow.length - count; i++) {
        let isContiguous = true;
        for (let j = 0; j < count - 1; j++) {
          const charCodeCurrent = seatsInRow[i + j].column.charCodeAt(0);
          const charCodeNext = seatsInRow[i + j + 1].column.charCodeAt(0);
          if (charCodeNext - charCodeCurrent !== 1) {
            isContiguous = false;
            break;
          }
        }
        if (isContiguous) {
          selectedSeats = seatsInRow.slice(i, i + count);
          break;
        }
      }
      if (selectedSeats.length === count) break;
    }

    // If no contiguous seats found, try finding any 'count' seats in the same row
    if (selectedSeats.length < count) {
      for (const [, seatsInRow] of rowMap) {
        if (seatsInRow.length >= count) {
          // Sort by strict priority within the row
          seatsInRow.sort(strictSort);
          selectedSeats = seatsInRow.slice(0, count);
          break;
        }
      }
    }
  }

  // Fallback to STRICT_PRIORITY if GROUP_PREFERENCE could not find a block or policy is STRICT_PRIORITY
  if (selectedSeats.length < count) {
    const sorted = [...availableSeats].sort(strictSort);
    selectedSeats = sorted.slice(0, count);
  }

  return selectedSeats.map((s) => ({
    seatNumber: s.seatNumber,
    position: s.position
  }));
};

/**
 * Get full seat map with status (AVAILABLE, ASSIGNED, BLOCKED)
 * @param {string|ObjectId} flightInstanceId
 */
const getSeatMap = async (flightInstanceId) => {
  const flightInstance = await FlightInstance.findById(flightInstanceId);
  if (!flightInstance) {
    throw new Error('Flight instance not found');
  }

  const flight = await Flight.findById(flightInstance.flightId);
  if (!flight) {
    throw new Error('Flight not found');
  }

  const layout = await AircraftLayout.findById(flight.aircraftLayoutId);
  if (!layout) {
    throw new Error('Aircraft layout not found');
  }

  const assignedSeats = await BookingSeat.find({
    flightInstanceId,
    status: 'ASSIGNED'
  }).select('seatNumber passengerId position');

  const assignedMap = new Map();
  assignedSeats.forEach((s) => assignedMap.set(s.seatNumber, s));

  const seats = layout.seatDefinitions.map((def) => {
    let status = 'AVAILABLE';
    if (def.active === false) {
      status = 'BLOCKED';
    } else if (assignedMap.has(def.seatNumber)) {
      status = 'ASSIGNED';
    }

    return {
      seatNumber: def.seatNumber,
      row: def.row,
      column: def.column,
      position: def.position,
      status
    };
  });

  return {
    layout: {
      name: layout.name,
      type: layout.type,
      rows: layout.rows,
      seatsPerRow: layout.seatsPerRow
    },
    seats
  };
};

module.exports = {
  allocateSeats,
  getSeatMap
};
