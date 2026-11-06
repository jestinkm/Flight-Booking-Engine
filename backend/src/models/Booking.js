const mongoose = require('mongoose');
const crypto = require('crypto');

const generateSecurePNR = () => {
  const year = new Date().getFullYear();
  const hexPart = crypto.randomBytes(3).toString('hex').toUpperCase(); // 6 chars
  const timePart = Date.now().toString(36).slice(-3).toUpperCase(); // 3 chars
  return `SKY-${year}-${hexPart}${timePart}`;
};

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
    emailDeliveredTo: {
      type: String,
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
    this.bookingReference = generateSecurePNR();
  }
  next();
});

bookingSchema.statics.generateUniquePNR = async function () {
  let pnr;
  let exists = true;
  let attempts = 0;
  while (exists && attempts < 10) {
    attempts++;
    pnr = generateSecurePNR();
    const found = await this.findOne({ bookingReference: pnr });
    if (!found) exists = false;
  }
  return pnr;
};

bookingSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Booking', bookingSchema);
