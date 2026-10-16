const mongoose = require('mongoose');

const bookingPassengerSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'Booking reference is required']
    },
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true
    },
    type: {
      type: String,
      enum: ['ADULT', 'CHILD'],
      required: [true, 'Passenger type is required']
    },
    seatNumber: {
      type: String,
      trim: true,
      default: null
    },
    aadhaarNumber: {
      type: String,
      trim: true,
      default: null
    },
    gender: {
      type: String,
      enum: ['MALE', 'FEMALE', 'OTHER'],
      default: 'MALE'
    },
    dateOfBirth: {
      type: String,
      trim: true,
      default: null
    },
    status: {
      type: String,
      enum: ['CONFIRMED', 'CANCELLED'],
      default: 'CONFIRMED'
    },
    cancelledAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

bookingPassengerSchema.index({ bookingId: 1 });

module.exports = mongoose.model('BookingPassenger', bookingPassengerSchema);
