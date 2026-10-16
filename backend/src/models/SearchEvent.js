const mongoose = require('mongoose');

const searchEventSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    sessionId: {
      type: String,
      default: null
    },
    originAirportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Airport',
      default: null
    },
    destinationAirportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Airport',
      default: null
    },
    originCode: {
      type: String,
      uppercase: true,
      trim: true
    },
    destinationCode: {
      type: String,
      uppercase: true,
      trim: true
    },
    travelDate: {
      type: Date
    },
    passengerCount: {
      type: Number,
      default: 1
    },
    adults: {
      type: Number,
      default: 1
    },
    children: {
      type: Number,
      default: 0
    },
    resultCount: {
      type: Number,
      default: 0
    },
    selectedFlightInstanceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FlightInstance',
      default: null
    },
    eventType: {
      type: String,
      enum: ['SEARCH', 'SELECT', 'BOOKING_START', 'BOOKING_CONFIRM', 'CANCEL'],
      default: 'SEARCH'
    },
    promoCode: {
      type: String,
      uppercase: true,
      trim: true,
      default: null
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }
);

searchEventSchema.index({ eventType: 1, createdAt: -1 });
searchEventSchema.index({ originCode: 1, destinationCode: 1 });
searchEventSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('SearchEvent', searchEventSchema);
