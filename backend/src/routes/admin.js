const express = require('express');
const { body } = require('express-validator');
const {
  createFlight,
  listFlights,
  getFlightById,
  updateFlight,
  updateFlightPricing,
  toggleFlightStatus,
  deleteFlight,
  createSchedule,
  listSchedules,
  updateSchedule,
  deleteSchedule,
  generateInstances,
  listFlightInstances,
  updateFlightInstance,
  cancelFlightInstance,
  createLayout,
  listLayouts,
  getLayoutById,
  getAllBookings,
  getDashboardStats
} = require('../controllers/adminController');
const authenticate = require('../middleware/authenticate');
const { allowRoles } = require('../middleware/authorize');
const validateRequest = require('../middleware/validateRequest');

const router = express.Router();

router.use(authenticate);

// Dashboard stats
router.get('/stats', allowRoles('SUPER_ADMIN', 'SCHEDULE_ADMIN'), getDashboardStats);

// Bookings management
router.get('/bookings', allowRoles('SUPER_ADMIN', 'SCHEDULE_ADMIN'), getAllBookings);

// Flight CRUD
router.post(
  '/flights',
  allowRoles('SUPER_ADMIN', 'SCHEDULE_ADMIN'),
  [
    body().custom((val, { req }) => {
      const num = req.body.flightNumber || req.body.flightCode;
      if (!num || !num.toString().trim()) {
        throw new Error('Flight number is required (e.g. SK-501)');
      }
      return true;
    }),
    body('originAirportId').notEmpty().withMessage('Origin airport is required'),
    body('destinationAirportId').notEmpty().withMessage('Destination airport is required'),
    body('aircraftLayoutId').notEmpty().withMessage('Aircraft layout is required'),
    validateRequest
  ],
  createFlight
);
router.get('/flights', allowRoles('SUPER_ADMIN', 'SCHEDULE_ADMIN'), listFlights);
router.get('/flights/:id', allowRoles('SUPER_ADMIN', 'SCHEDULE_ADMIN'), getFlightById);
router.put('/flights/:id', allowRoles('SUPER_ADMIN', 'SCHEDULE_ADMIN'), updateFlight);
router.patch('/flights/:id', allowRoles('SUPER_ADMIN', 'SCHEDULE_ADMIN'), updateFlight);
router.put('/flights/:id/pricing', allowRoles('SUPER_ADMIN'), updateFlightPricing);
router.patch('/flights/:id/status', allowRoles('SUPER_ADMIN', 'SCHEDULE_ADMIN'), toggleFlightStatus);
router.delete('/flights/:id', allowRoles('SUPER_ADMIN'), deleteFlight);

// Schedule CRUD
router.post(
  '/schedules',
  allowRoles('SUPER_ADMIN', 'SCHEDULE_ADMIN'),
  [
    body('flightId').notEmpty().withMessage('Flight ID is required'),
    body('departureTime').matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Valid departureTime HH:MM is required'),
    body('arrivalTime').matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Valid arrivalTime HH:MM is required'),
    validateRequest
  ],
  createSchedule
);
router.get('/schedules', allowRoles('SUPER_ADMIN', 'SCHEDULE_ADMIN'), listSchedules);
router.put('/schedules/:id', allowRoles('SUPER_ADMIN', 'SCHEDULE_ADMIN'), updateSchedule);
router.delete('/schedules/:id', allowRoles('SUPER_ADMIN', 'SCHEDULE_ADMIN'), deleteSchedule);

// Flight Instances (Scheduled Departures)
router.get('/instances', allowRoles('SUPER_ADMIN', 'SCHEDULE_ADMIN'), listFlightInstances);
router.put('/instances/:id', allowRoles('SUPER_ADMIN', 'SCHEDULE_ADMIN'), updateFlightInstance);
router.patch('/instances/:id', allowRoles('SUPER_ADMIN', 'SCHEDULE_ADMIN'), updateFlightInstance);
router.delete('/instances/:id', allowRoles('SUPER_ADMIN', 'SCHEDULE_ADMIN'), cancelFlightInstance);

// Bulk flight instance generation
router.post(
  '/instances/generate',
  allowRoles('SUPER_ADMIN', 'SCHEDULE_ADMIN'),
  [
    body('startDate').notEmpty().withMessage('Start date is required'),
    body('endDate').notEmpty().withMessage('End date is required'),
    validateRequest
  ],
  generateInstances
);

// Aircraft Layout CRUD
router.post(
  '/layouts',
  allowRoles('SUPER_ADMIN'),
  [
    body('name').trim().notEmpty().withMessage('Layout name is required'),
    body('rows').isInt({ min: 1 }).withMessage('Rows must be at least 1'),
    validateRequest
  ],
  createLayout
);
router.get('/layouts', allowRoles('SUPER_ADMIN', 'SCHEDULE_ADMIN'), listLayouts);
router.get('/layouts/:id', allowRoles('SUPER_ADMIN', 'SCHEDULE_ADMIN'), getLayoutById);

module.exports = router;
