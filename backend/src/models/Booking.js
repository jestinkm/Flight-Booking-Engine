const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    bookingReference: {
      type: String,
      unique: true,
      uppercase: true,
      trim: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required']
    },
    flightInstanceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FlightInstance',
      required: [true, 'Flight instance reference is required']
    },
    status: {
      type: String,
      enum: ['PENDING', 'CONFIRMED', 'CANCELLED', 'PARTIALLY_CANCELLED'],
      default: 'PENDING'
    },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'],
      default: 'PENDING'
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      default: null
    },
    passengerCount: {
      type: Number,
      required: [true, 'Passenger count is required'],
      min: 0
    },
    adultCount: {
      type: Number,
      required: [true, 'Adult count is required'],
      min: 0
    },
    childCount: {
      type: Number,
      required: [true, 'Child count is required'],
      min: 0
    },
    adultFare: {
      type: Number,
      default: 0,
      min: 0
    },
    childFare: {
      type: Number,
      default: 0,
      min: 0
    },
    subtotal: {
      type: Number,
      required: [true, 'Subtotal is required'],
      min: 0
    },
    taxAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: 0
    },
    refundAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    offerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Offer',
      default: null
    },
    offerCode: {
      type: String,
      default: null,
      uppercase: true,
      trim: true
    },
    idempotencyKey: {
      type: String,
      unique: true,
      sparse: true
    },
    cancellationReason: {
      type: String,
      default: null
    },
    cancelledAt: {
      type: Date,
      default: null
    },
    contactEmail: {
      type: String,
      trim: true
    },
    contactPhone: {
      type: String,
      trim: true
    },
    emailSent: {
      type: Boolean,
      default: false,
      index: true
    },
    emailSentAt: {
      type: Date,
      default: null
    },
    emailDeliveryId: {
      type: String,
      default: null
    },
    emailDeliveryError: {
      type: String,
      default: null
    },
    emailAttempts: {
      type: Number,
      default: 0
    },
    lastEmailAttemptAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

bookingSchema.pre('save', function (next) {
  if (!this.bookingReference) {
    const year = new Date().getFullYear();
    const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
    this.bookingReference = `SKY-${year}-${randomSuffix}`;
  }
  next();
});

bookingSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Booking', bookingSchema);
