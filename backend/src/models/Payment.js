const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'Booking reference is required']
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required']
    },
    amount: {
      type: Number,
      required: [true, 'Payment amount is required'],
      min: 0
    },
    currency: {
      type: String,
      default: 'INR'
    },
    method: {
      type: String,
      enum: ['DEMO_CARD', 'DEMO_UPI', 'CARD', 'UPI', 'NET_BANKING', 'WALLET'],
      default: 'DEMO_CARD'
    },
    status: {
      type: String,
      enum: ['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED'],
      default: 'PENDING'
    },
    transactionReference: {
      type: String,
      trim: true
    },
    transactionId: {
      type: String,
      trim: true
    },
    providerOrderId: {
      type: String,
      trim: true,
      default: null
    },
    demoCardLast4: {
      type: String,
      trim: true,
      default: null
    },
    safePaymentDetails: {
      type: String,
      trim: true,
      default: null
    },
    failureReason: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

paymentSchema.virtual('isPaid').get(function () {
  return this.status === 'SUCCESS';
});

paymentSchema.index({ bookingId: 1 });
paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ transactionReference: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
