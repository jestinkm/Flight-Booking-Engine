const express = require('express');
const { body } = require('express-validator');
const {
  getProfile,
  updateProfile,
  changePassword,
  getIdentityStatus,
  getNotifications,
  markNotificationRead
} = require('../controllers/userController');
const authenticate = require('../middleware/authenticate');
const validateRequest = require('../middleware/validateRequest');

const router = express.Router();

router.use(authenticate);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);

router.put(
  '/change-password',
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
    validateRequest
  ],
  changePassword
);

router.get('/identity-status', getIdentityStatus);
router.get('/notifications', getNotifications);
router.get('/me/notifications', getNotifications);
router.put('/notifications/:id/read', markNotificationRead);
router.patch('/notifications/:id/read', markNotificationRead);
router.post('/notifications/mark-all-read', (req, res, next) => {
  req.params.id = 'all';
  return markNotificationRead(req, res, next);
});
router.put('/me/notifications/:id/read', markNotificationRead);
router.patch('/me/notifications/:id/read', markNotificationRead);
router.post('/me/notifications/mark-all-read', (req, res, next) => {
  req.params.id = 'all';
  return markNotificationRead(req, res, next);
});

module.exports = router;
