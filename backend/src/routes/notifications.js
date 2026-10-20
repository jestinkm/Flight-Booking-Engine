const express = require('express');
const { getNotifications, markNotificationRead } = require('../controllers/userController');
const authenticate = require('../middleware/authenticate');
const PushSubscription = require('../models/PushSubscription');
const { sendPushToUser, VAPID_PUBLIC_KEY } = require('../services/pushService');

const router = express.Router();

// GET /api/notifications/public-key (Public so frontend can subscribe before or after login)
router.get('/public-key', (req, res) => {
  res.json({
    success: true,
    publicKey: VAPID_PUBLIC_KEY
  });
});

// Authenticated routes
router.use(authenticate);

// GET /api/notifications - List user's in-app notifications
router.get('/', getNotifications);

// POST /api/notifications/subscribe - Save or update browser push subscription
router.post('/subscribe', async (req, res) => {
  try {
    const { endpoint, keys } = req.body;
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({
        success: false,
        message: 'Invalid push subscription payload'
      });
    }

    await PushSubscription.findOneAndUpdate(
      { endpoint },
      {
        $set: {
          userId: req.user._id,
          endpoint,
          keys
        }
      },
      { upsert: true, new: true, runValidators: true }
    );

    res.status(201).json({
      success: true,
      message: 'Browser push notifications enabled successfully'
    });
  } catch (error) {
    console.error('[Push Subscription Error]:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to register push subscription'
    });
  }
});

// DELETE /api/notifications/unsubscribe - Remove subscription
router.delete('/unsubscribe', async (req, res) => {
  try {
    const { endpoint } = req.body;
    await PushSubscription.deleteOne({
      endpoint,
      userId: req.user._id
    });
    res.json({
      success: true,
      message: 'Browser push subscription removed'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to unsubscribe from push'
    });
  }
});

// POST /api/notifications/test-push - Send test push to currently logged in user
router.post('/test-push', async (req, res) => {
  try {
    const results = await sendPushToUser(req.user._id, {
      title: 'SKYNEXA Notifications Active ✈️',
      body: 'Your browser is successfully connected to SKYNEXA flight alerts!',
      url: '/my-bookings'
    });
    res.json({
      success: true,
      message: 'Push test message dispatched',
      deliveredCount: results.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to dispatch test push notification'
    });
  }
});

// POST /api/notifications/mark-all-read
router.post('/mark-all-read', (req, res, next) => {
  req.params.id = 'all';
  return markNotificationRead(req, res, next);
});

// PATCH / PUT / POST /api/notifications/:id/read
router.patch('/:id/read', markNotificationRead);
router.put('/:id/read', markNotificationRead);
router.post('/:id/read', markNotificationRead);

module.exports = router;
