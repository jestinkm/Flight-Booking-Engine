const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Check for MongoDB / Mongoose duplicate key error (E11000)
  const isDuplicateKey =
    err.code === 11000 ||
    err.name === 'MongoServerError' && err.message?.includes('E11000') ||
    (Array.isArray(err.writeErrors) && err.writeErrors.some((we) => we.code === 11000));

  if (isDuplicateKey) {
    statusCode = 409;

    // Comprehensive extraction of keyValue, keyPattern, and raw message
    const writeErr = Array.isArray(err.writeErrors) ? err.writeErrors.find((we) => we.code === 11000) : null;
    const rawMsg = writeErr?.errmsg || err.errmsg || err.message || '';
    const keyValue =
      err.keyValue ||
      err.errorResponse?.keyValue ||
      writeErr?.err?.keyValue ||
      writeErr?.keyValue ||
      {};
    const keyPattern =
      err.keyPattern ||
      err.errorResponse?.keyPattern ||
      writeErr?.err?.keyPattern ||
      writeErr?.keyPattern ||
      {};

    // Extract seatNumber if present in keyValue or raw error message
    let seatNumber = keyValue.seatNumber;
    if (!seatNumber && /seatNumber:\s*["']?([^"',}\s]+)/i.test(rawMsg)) {
      const match = rawMsg.match(/seatNumber:\s*["']?([^"',}\s]+)/i);
      seatNumber = match ? match[1] : null;
    }

    // 1. Seat duplication / double-booking conflict
    if (
      seatNumber ||
      keyValue.seatNumber !== undefined ||
      keyPattern.seatNumber ||
      rawMsg.includes('flightInstanceId_1_seatNumber_1') ||
      rawMsg.includes('bookingseats')
    ) {
      message = seatNumber
        ? `This seat (${seatNumber}) has already been booked or reserved. Please select another seat.`
        : 'This seat has already been booked. Please select another seat.';
    }
    // 2. Booking reference (PNR) collision
    else if (
      keyValue.bookingReference !== undefined ||
      keyPattern.bookingReference ||
      rawMsg.includes('bookingReference')
    ) {
      message = 'This booking already exists. Please check your booking details.';
    }
    // 3. Idempotency key collision (duplicate submission)
    else if (
      keyValue.idempotencyKey !== undefined ||
      keyPattern.idempotencyKey ||
      rawMsg.includes('idempotencyKey')
    ) {
      message = 'This booking request has already been processed. Please check your booking details in My Bookings.';
    }
    // 4. User email collision
    else if (keyValue.email !== undefined || keyPattern.email || rawMsg.includes('email_1')) {
      message = 'An account with this email address already exists. Please use another email or sign in.';
    }
    // 5. User username collision
    else if (keyValue.username !== undefined || keyPattern.username || rawMsg.includes('username_1')) {
      message = 'This username is already taken. Please choose another username.';
    }
    // 6. Flight departure instance collision
    else if (rawMsg.includes('flightId_1_departureDateTime_1')) {
      message = 'A flight departure instance already exists for this route and scheduled time.';
    }
    // 7. General fallback - parse clean field name if possible, never show raw "field 'field'"
    else {
      const fieldNames = Object.keys(keyValue).filter((k) => k !== 'flightInstanceId');
      const firstField = fieldNames[0] || Object.keys(keyPattern)[0];
      const val = firstField && keyValue[firstField] ? keyValue[firstField] : '';

      if (firstField && val) {
        message = `A record with ${firstField} '${val}' already exists. Please use another value.`;
      } else {
        message = 'Another user has just submitted a conflicting reservation. Please refresh and select an available seat.';
      }
    }
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    const errors = Object.values(err.errors).map((e) => e.message);
    message = errors.join(', ');
  }

  // Handle Mongoose invalid ObjectId (CastError)
  if (err.name === 'CastError') {
    statusCode = 404;
    message = `Resource not found with identifier '${err.value}'`;
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token expired';
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;
