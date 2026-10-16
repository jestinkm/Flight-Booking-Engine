const mongoose = require('mongoose');

const flightInstanceSchema = new mongoose.Schema(
  {
    flightId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Flight',
      required: [true, 'Flight reference is required']
    },
    scheduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FlightSchedule',
      required: false
    },
    travelDate: {
      type: Date,
      required: [true, 'Travel date is required']
    },
    departureDateTime: {
      type: Date,
      required: [true, 'Departure date and time is required']
    },
    arrivalDateTime: {
      type: Date,
      required: [true, 'Arrival date and time is required']
    },
    adultFare: {
      type: Number,
      required: [true, 'Adult fare is required'],
      min: 0
    },
    childFare: {
      type: Number,
      required: [true, 'Child fare is required'],
      min: 0
    },
    capacity: {
      type: Number,
      required: [true, 'Capacity is required'],
      min: 1
    },
    bookedCount: {
      type: Number,
      default: 0,
      min: 0
    },
    status: {
      type: String,
      enum: ['SCHEDULED', 'ON_TIME', 'DELAYED', 'CANCELLED', 'COMPLETED'],
      default: 'SCHEDULED'
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

flightInstanceSchema.virtual('availableSeats').get(function () {
  return Math.max(0, (this.capacity || 0) - (this.bookedCount || 0));
});

flightInstanceSchema.index({ flightId: 1, departureDateTime: 1 }, { unique: true });
flightInstanceSchema.index({ travelDate: 1, status: 1 });

module.exports = mongoose.model('FlightInstance', flightInstanceSchema);
