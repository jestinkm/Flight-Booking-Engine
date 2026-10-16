const mongoose = require('mongoose');

const flightSchema = new mongoose.Schema(
  {
    flightNumber: {
      type: String,
      required: [true, 'Flight number is required'],
      unique: true,
      uppercase: true,
      trim: true
    },
    // Backward compatibility aliases
    flightCode: {
      type: String,
      uppercase: true,
      trim: true
    },
    flightName: {
      type: String,
      trim: true
    },
    originAirportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Airport',
      required: [true, 'Origin airport is required']
    },
    destinationAirportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Airport',
      required: [true, 'Destination airport is required']
    },
    baseFare: {
      type: Number,
      required: [true, 'Base fare is required'],
      min: [1, 'Base fare must be greater than zero']
    },
    adultFare: {
      type: Number,
      min: [1, 'Adult fare must be greater than zero']
    },
    childFare: {
      type: Number,
      min: [0, 'Child fare cannot be negative']
    },
    departureDateTime: {
      type: Date,
      default: null
    },
    arrivalDateTime: {
      type: Date,
      default: null
    },
    aircraftLayoutId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AircraftLayout',
      required: [true, 'Aircraft layout is required']
    },
    totalCapacity: {
      type: Number,
      required: [true, 'Total capacity is required'],
      min: [1, 'Total capacity must be at least 1']
    },
    // Backward compatibility alias for totalCapacity
    capacity: {
      type: Number,
      min: 1
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'MAINTENANCE', 'CANCELLED'],
      default: 'ACTIVE'
    },
    active: {
      type: Boolean,
      default: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Admin reference is required']
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Synchronize backward-compatible aliases before validation
flightSchema.pre('validate', function (next) {
  if (this.flightNumber && !this.flightCode) {
    this.flightCode = this.flightNumber;
  } else if (this.flightCode && !this.flightNumber) {
    this.flightNumber = this.flightCode;
  }

  if (!this.flightName) {
    this.flightName = this.flightNumber || this.flightCode || 'Skynexa Flight';
  }

  if (this.totalCapacity && !this.capacity) {
    this.capacity = this.totalCapacity;
  } else if (this.capacity && !this.totalCapacity) {
    this.totalCapacity = this.capacity;
  }

  if (this.adultFare && !this.baseFare) {
    this.baseFare = this.adultFare;
  } else if (this.baseFare && !this.adultFare) {
    this.adultFare = this.baseFare;
  }

  if (this.childFare === undefined || this.childFare === null) {
    this.childFare = Math.round((this.adultFare || this.baseFare || 3500) * 0.75);
  }

  if (this.status) {
    this.active = this.status === 'ACTIVE';
  } else {
    this.status = this.active ? 'ACTIVE' : 'INACTIVE';
  }

  next();
});

flightSchema.index({ originAirportId: 1, destinationAirportId: 1 });

module.exports = mongoose.model('Flight', flightSchema);
