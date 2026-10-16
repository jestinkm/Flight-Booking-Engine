const express = require('express');
const {
  searchFlights,
  getRecentSearches,
  getFlightInstance,
  getFlightInstanceSeats,
  getFlightDetails
} = require('../controllers/flightController');
const { listFlights, listFlightInstances } = require('../controllers/adminController');
const { optionalAuth } = require('../middleware/authenticate');

const router = express.Router();

router.get('/', listFlights);
router.get('/instances', listFlightInstances);
router.get('/search', optionalAuth, searchFlights);
router.get('/recent-searches', optionalAuth, getRecentSearches);
router.get('/instance/:id', getFlightInstance);
router.get('/instance/:id/seats', getFlightInstanceSeats);
router.get('/:id/seats', getFlightInstanceSeats);
router.get('/:id', getFlightDetails);

module.exports = router;
