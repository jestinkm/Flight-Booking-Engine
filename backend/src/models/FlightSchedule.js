const mongoose = require('mongoose');

const flightScheduleSchema = new mongoose.Schema(
  {
    flightId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Flight',
      required: [true, 'Flight reference is required']
    },
    scheduleType: {
      type: String,
      enum: ['ONE_TIME', 'DAILY', 'WEEKLY', 'MONTHLY'],
      default: 'DAILY'
    },
    operatingDays: [
      {
        type: String,
        enum: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
      }
    ],
    dayOfWeek: {
      type: Number,
      min: 0,
      max: 6
    },
    departureTime: {
      type: String,
      required: [true, 'Departure time is required'],
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Departure time must be in HH:MM format']
    },
    arrivalTime: {
      type: String,
      required: [true, 'Arrival time is required'],
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Arrival time must be in HH:MM format']
    },
    arrivalDayOffset: {
      type: Number,
      enum: [0, 1],
      default: 0
    },
    departureDate: {
      type: Date
    },
    arrivalDate: {
      type: Date
    },
    startDate: {
      type: Date
    },
    endDate: {
      type: Date
    },
    timezone: {
      type: String,
      default: 'Asia/Kolkata'
    },
    adultFare: {
      type: Number,
      min: 0
    },
    childFare: {
      type: Number,
      min: 0
    },
    status: {
      type: String,
      enum: ['SCHEDULED', 'ACTIVE', 'ON_TIME', 'DELAYED', 'CANCELLED'],
      default: 'SCHEDULED'
    },
    active: {
      type: Boolean,
      default: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    assignedAdmins: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ]
  },
  {
    timestamps: true
  }
);

flightScheduleSchema.index({ flightId: 1, active: 1 });

module.exports = mongoose.model('FlightSchedule', flightScheduleSchema);
