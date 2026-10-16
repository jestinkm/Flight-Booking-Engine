const mongoose = require('mongoose');

const customerInteractionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    searchEventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SearchEvent',
      default: null
    },
    marketAdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Market Administrator reference is required']
    },
    customerName: {
      type: String,
      trim: true,
      default: 'Guest Traveler'
    },
    customerEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: null
    },
    customerPhone: {
      type: String,
      trim: true,
      default: null
    },
    route: {
      type: String,
      trim: true,
      default: null
    },
    status: {
      type: String,
      enum: ['PENDING', 'CONTACTED', 'RESOLVED', 'NOT_INTERESTED'],
      default: 'PENDING'
    },
    channel: {
      type: String,
      enum: ['EMAIL', 'PHONE', 'WHATSAPP', 'IN_APP', 'OTHER'],
      default: 'EMAIL'
    },
    notes: {
      type: String,
      trim: true,
      default: ''
    },
    contactedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

customerInteractionSchema.index({ marketAdminId: 1, createdAt: -1 });
customerInteractionSchema.index({ userId: 1 });
customerInteractionSchema.index({ status: 1 });

module.exports = mongoose.model('CustomerInteraction', customerInteractionSchema);
