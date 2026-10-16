const express = require('express');
const { body } = require('express-validator');
const {
  createTicket,
  getMyTickets,
  getTicketById,
  addMessage,
  updateTicketStatus
} = require('../controllers/supportController');
const authenticate = require('../middleware/authenticate');
const { allowRoles } = require('../middleware/authorize');
const validateRequest = require('../middleware/validateRequest');

const router = express.Router();

router.use(authenticate);

router.post(
  '/tickets',
  [
    body('category').isIn(['BOOKING', 'SEAT', 'PAYMENT', 'CANCELLATION', 'LOGIN', 'OTHER']).withMessage('Valid category required'),
    body('subject').trim().notEmpty().withMessage('Subject is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    validateRequest
  ],
  createTicket
);

router.get('/tickets', getMyTickets);
router.get('/tickets/my', getMyTickets);
router.get('/tickets/:id', getTicketById);

router.post(
  '/tickets/:id/messages',
  [
    body('message').trim().notEmpty().withMessage('Message is required'),
    validateRequest
  ],
  addMessage
);

router.put(
  '/tickets/:id/status',
  allowRoles('SUPER_ADMIN', 'SCHEDULE_ADMIN', 'MARKETING_ADMIN'),
  updateTicketStatus
);

router.patch(
  '/tickets/:id',
  allowRoles('SUPER_ADMIN', 'SCHEDULE_ADMIN', 'MARKETING_ADMIN'),
  updateTicketStatus
);

router.patch(
  '/tickets/:id/status',
  allowRoles('SUPER_ADMIN', 'SCHEDULE_ADMIN', 'MARKETING_ADMIN'),
  updateTicketStatus
);

module.exports = router;
