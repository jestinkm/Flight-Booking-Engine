const mongoose = require('mongoose');

const eligibleRouteSchema = new mongoose.Schema(
  {
    originCode: {
      type: String,
      uppercase: true,
      trim: true
    },
    destinationCode: {
      type: String,
      uppercase: true,
      trim: true
    }
  },
  { _id: false }
);

const offerSchema = new mongoose.Schema(
  {
    promoCode: {
      type: String,
      required: [true, 'Promo code is required'],
      unique: true,
      uppercase: true,
      trim: true
    },
    title: {
      type: String,
      required: [true, 'Offer title is required'],
      trim: true
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    discountType: {
      type: String,
      enum: ['FIXED', 'PERCENTAGE'],
      required: true
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0
    },
    maxDiscount: {
      type: Number,
      default: null
    },
    minimumBookingAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    eligibleRoutes: [eligibleRouteSchema],
    startAt: {
      type: Date,
      required: [true, 'Start date is required']
    },
    endAt: {
      type: Date,
      required: [true, 'End date is required']
    },
    maxRedemptions: {
      type: Number,
      default: null
    },
    redemptionCount: {
      type: Number,
      default: 0,
      min: 0
    },
    status: {
      type: String,
      enum: ['DRAFT', 'SCHEDULED', 'ACTIVE', 'PAUSED', 'EXPIRED'],
      default: 'DRAFT'
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

offerSchema.index({ status: 1, startAt: 1, endAt: 1 });

module.exports = mongoose.model('Offer', offerSchema);
