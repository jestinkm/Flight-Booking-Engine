const express = require('express');
const { body } = require('express-validator');
const {
  createAdmin,
  listAdmins,
  updateAdmin,
  assignFlightToAdmin,
  getAuditLogs,
  getDashboard
} = require('../controllers/superAdminController');
const authenticate = require('../middleware/authenticate');
const { allowRoles } = require('../middleware/authorize');
const validateRequest = require('../middleware/validateRequest');

const router = express.Router();

router.use(authenticate);
router.use(allowRoles('SUPER_ADMIN'));

router.post(
  '/admins',
  [
    body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
    body('email').trim().isEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').isIn(['SCHEDULE_ADMIN', 'MARKETING_ADMIN', 'SUPER_ADMIN']).withMessage('Invalid role'),
    validateRequest
  ],
  createAdmin
);

router.get('/admins', listAdmins);
router.put('/admins/:id', updateAdmin);
router.post('/assign-flight', assignFlightToAdmin);
router.get('/audit-logs', getAuditLogs);
router.get('/dashboard', getDashboard);

module.exports = router;
