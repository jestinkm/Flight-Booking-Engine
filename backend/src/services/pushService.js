const webpush = require('web-push');
const PushSubscription = require('../models/PushSubscription');

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BGiLufKfnhQys6LK-Hdmnm_6X-iAIxX6iYaCT0dFmpRA90qIvXpSs0AD09-Wlk75tZpjQYmqlbyca6liCQgEqVs';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'v9t6t4SRzd-0xpWtr-Wh4uC8EiSbu6x3gqQlERQVj4c';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@skynexa.com';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  try {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  } catch (err) {
    console.warn('[WebPush] VAPID initialization notice:', err.message);
  }
}

/**
 * Send browser push notification to all subscribed devices for a given user
 */
async function sendPushToUser(userId, notification) {
  try {
    const subscriptions = await PushSubscription.find({ userId });
    if (!subscriptions || subscriptions.length === 0) {
      return [];
    }

    const payload = JSON.stringify({
      title: notification.title || 'SKYNEXA Airlines',
      body: notification.body || 'Flight booking update',
      url: notification.url || '/my-bookings',
      icon: notification.icon || '/favicon.ico',
      badge: notification.badge || '/favicon.ico'
    });

    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          return await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: sub.keys
            },
            payload,
            { TTL: 60 * 60 }
          );
        } catch (error) {
          // If subscription has expired or unsubscribed (404/410), delete it
          if (error.statusCode === 404 || error.statusCode === 410) {
            await PushSubscription.deleteOne({ _id: sub._id });
          }
          throw error;
        }
      })
    );

    return results;
  } catch (err) {
    console.error('[WebPush] Error sending push to user:', err.message);
    return [];
  }
}

module.exports = {
  sendPushToUser,
  VAPID_PUBLIC_KEY
};
