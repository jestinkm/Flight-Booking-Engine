const mongoose = require('mongoose');

const seatDefinitionSchema = new mongoose.Schema(
  {
    seatNumber: {
      type: String,
      required: true,
      trim: true
    },
    row: {
      type: Number,
      required: true
    },
    column: {
      type: String,
      required: true,
      trim: true
    },
    position: {
      type: String,
      enum: ['WINDOW', 'AISLE', 'MIDDLE'],
      required: true
    },
    active: {
      type: Boolean,
      default: true
    }
  },
  { _id: false }
);

const aircraftLayoutSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Layout name is required'],
      trim: true
    },
    type: {
      type: String,
      enum: ['3-3', '2-2', 'custom'],
      required: true
    },
    rows: {
      type: Number,
      required: true,
      min: 1
    },
    seatsPerRow: {
      type: Number,
      required: true,
      min: 1
    },
    seatDefinitions: [seatDefinitionSchema],
    version: {
      type: Number,
      default: 1
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

module.exports = mongoose.model('AircraftLayout', aircraftLayoutSchema);
