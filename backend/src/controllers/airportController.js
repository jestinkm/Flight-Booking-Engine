const Airport = require('../models/Airport');

// @desc    List all airports
// @route   GET /api/airports
// @access  Public
const listAirports = async (req, res, next) => {
  try {
    const filter = req.query.all === 'true' ? {} : { active: true };
    const airports = await Airport.find(filter).sort({ city: 1, name: 1 });

    res.json({
      success: true,
      data: { airports }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get airport by code or ID
// @route   GET /api/airports/:codeOrId
// @access  Public
const getAirport = async (req, res, next) => {
  try {
    const { codeOrId } = req.params;
    let airport;

    if (codeOrId.length === 3) {
      airport = await Airport.findOne({ code: codeOrId.toUpperCase() });
    } else {
      airport = await Airport.findById(codeOrId);
    }

    if (!airport) {
      return res.status(404).json({
        success: false,
        message: 'Airport not found'
      });
    }

    res.json({
      success: true,
      data: { airport }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new airport
// @route   POST /api/airports
// @access  Private (SUPER_ADMIN)
const createAirport = async (req, res, next) => {
  try {
    const { code, name, city, country, timezone, active } = req.body;

    const existing = await Airport.findOne({ code: code.toUpperCase() });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Airport with code ${code.toUpperCase()} already exists`
      });
    }

    const airport = await Airport.create({
      code: code.toUpperCase(),
      name,
      city,
      country,
      timezone: timezone || 'Asia/Kolkata',
      active: active !== undefined ? active : true
    });

    res.status(201).json({
      success: true,
      message: 'Airport created successfully',
      data: { airport }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update an airport
// @route   PUT /api/airports/:id
// @access  Private (SUPER_ADMIN)
const updateAirport = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, city, country, timezone, active } = req.body;

    const airport = await Airport.findByIdAndUpdate(
      id,
      { $set: { name, city, country, timezone, active } },
      { new: true, runValidators: true }
    );

    if (!airport) {
      return res.status(404).json({
        success: false,
        message: 'Airport not found'
      });
    }

    res.json({
      success: true,
      message: 'Airport updated successfully',
      data: { airport }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listAirports,
  getAirport,
  createAirport,
  updateAirport
};
