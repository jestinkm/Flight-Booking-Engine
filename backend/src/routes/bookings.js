const express = require('express');
const { body } = require('express-validator');
const {
  createBooking,
  confirmPayment,
  processPayment,
  getPaymentStatus,
  getMyBookings,
  getBookingById,
  cancelBooking,
  resendETicket
} = require('../controllers/bookingController');
const authenticate = require('../middleware/authenticate');
const validateRequest = require('../middleware/validateRequest');

const router = express.Router();

router.use(authenticate);

router.post(
  '/',
  [
    body('flightInstanceId').notEmpty().withMessage('Flight instance ID is required'),
    body('passengers').isArray({ min: 1 }).withMessage('At least one passenger is required'),
    body('passengers.*.firstName').trim().notEmpty().withMessage('Passenger first name is required'),
    body('passengers.*.lastName').trim().notEmpty().withMessage('Passenger last name is required'),
    body('passengers.*.type').isIn(['ADULT', 'CHILD']).withMessage('Passenger type must be ADULT or CHILD'),
    validateRequest
  ],
  createBooking
);

router.post('/:id/confirm-payment', confirmPayment);
router.post('/:id/payment', processPayment);
router.get('/:id/payment-status', getPaymentStatus);
router.post('/:id/resend-ticket', resendETicket);
router.post('/:id/retry-email', resendETicket);
router.get('/my-bookings', getMyBookings);
router.get('/my', getMyBookings);
router.get('/:id', getBookingById);
router.post('/:id/cancel', cancelBooking);
router.patch('/:id/cancel', cancelBooking);

module.exports = router;
