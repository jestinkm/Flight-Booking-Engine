const express = require('express');
const authenticate = require('../middleware/authenticate');
const { allowRoles } = require('../middleware/authorize');
const {
  getAnalyticsSummary,
  getFlightRevenueReport,
  getCustomerBookingsReport,
  exportFlightRevenueCSV,
  exportCustomerBookingsCSV
} = require('../controllers/analyticsController');

const router = express.Router();

// Strict Super Admin RBAC Gatekeeper
router.use(authenticate);
router.use(allowRoles('SUPER_ADMIN'));

// Analytics Summary
router.get('/summary', getAnalyticsSummary);

// Flight-Wise Revenue & Occupancy Report
router.get('/flights', getFlightRevenueReport);

// Customer & Passenger Details Report
router.get('/customers', getCustomerBookingsReport);

// CSV Export Endpoints with Audit Logging
router.get('/export/flights', exportFlightRevenueCSV);
router.get('/export/customers', exportCustomerBookingsCSV);

module.exports = router;
