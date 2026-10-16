const mongoose = require('mongoose');

const bookingSeatSchema = new mongoose.Schema(
  {
    flightInstanceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FlightInstance',
      required: [true, 'Flight instance reference is required']
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'Booking reference is required']
    },
    passengerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BookingPassenger',
      required: [true, 'Passenger reference is required']
    },
    seatNumber: {
      type: String,
      required: [true, 'Seat number is required'],
      trim: true
    },
    position: {
      type: String,
      enum: ['WINDOW', 'AISLE', 'MIDDLE'],
      required: [true, 'Seat position is required']
    },
    status: {
      type: String,
      enum: ['ASSIGNED', 'RELEASED'],
      default: 'ASSIGNED'
    }
  },
  {
    timestamps: true
  }
);

bookingSeatSchema.index({ flightInstanceId: 1, seatNumber: 1, status: 1 });
bookingSeatSchema.index(
  { flightInstanceId: 1, seatNumber: 1 },
  { unique: true, partialFilterExpression: { status: 'ASSIGNED' } }
);

module.exports = mongoose.model('BookingSeat', bookingSeatSchema);
