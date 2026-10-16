const express = require('express');
const { getNotifications, markNotificationRead } = require('../controllers/userController');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

router.use(authenticate);

// GET /api/notifications
router.get('/', getNotifications);

// POST /api/notifications/mark-all-read
router.post('/mark-all-read', (req, res, next) => {
  req.params.id = 'all';
  return markNotificationRead(req, res, next);
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', markNotificationRead);

// PUT /api/notifications/:id/read
router.put('/:id/read', markNotificationRead);

// POST /api/notifications/:id/read
router.post('/:id/read', markNotificationRead);

module.exports = router;
