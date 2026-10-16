const mongoose = require('mongoose');

const airportSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Airport code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      minlength: 3,
      maxlength: 4
    },
    name: {
      type: String,
      required: [true, 'Airport name is required'],
      trim: true
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true
    },
    timezone: {
      type: String,
      default: 'Asia/Kolkata'
    },
    active: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Airport', airportSchema);
