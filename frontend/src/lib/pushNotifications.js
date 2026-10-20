import api from './axios';

/**
 * Convert a base64 string to a Uint8Array for VAPID applicationServerKey
 */
export function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Check if browser supports Service Worker and Push Manager
 */
export function isPushSupported() {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

/**
 * Register the Service Worker (if not already registered)
 */
export async function registerServiceWorker() {
  if (!isPushSupported()) return null;
  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    });
    return registration;
  } catch (error) {
    console.warn('[Push] Service worker registration failed:', error);
    return null;
  }
}

/**
 * Get current push subscription, if one exists
 */
export async function getExistingSubscription() {
  if (!isPushSupported()) return null;
  try {
    const reg = await navigator.serviceWorker.ready;
    return await reg.pushManager.getSubscription();
  } catch (err) {
    console.warn('[Push] Error getting subscription:', err);
    return null;
  }
}

/**
 * Subscribe current device to Web Push
 */
export async function subscribeToPush() {
  if (!isPushSupported()) {
    throw new Error('Push notifications are not supported in this browser.');
  }

  // 1. Request user permission
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Notification permission was denied or dismissed.');
  }

  // 2. Ensure Service Worker is registered and ready
  await registerServiceWorker();
  const registration = await navigator.serviceWorker.ready;

  // 3. Fetch server VAPID public key
  const { data } = await api.get('/notifications/public-key');
  if (!data?.publicKey) {
    throw new Error('Failed to retrieve VAPID public key from SKYNEXA server.');
  }

  const convertedVapidKey = urlBase64ToUint8Array(data.publicKey);

  // 4. Subscribe with PushManager
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: convertedVapidKey
  });

  // 5. Send subscription to SKYNEXA backend
  const subJSON = subscription.toJSON();
  await api.post('/notifications/subscribe', {
    endpoint: subJSON.endpoint,
    keys: subJSON.keys
  });

  return subscription;
}

/**
 * Unsubscribe current device from Web Push
 */
export async function unsubscribeFromPush() {
  if (!isPushSupported()) return;

  const subscription = await getExistingSubscription();
  if (subscription) {
    const endpoint = subscription.endpoint;
    try {
      await api.delete('/notifications/unsubscribe', {
        data: { endpoint }
      });
    } catch (err) {
      console.warn('[Push] Server unsubscribe notice:', err.message);
    }
    await subscription.unsubscribe();
  }
}

/**
 * Trigger a test push notification to verify end-to-end receipt
 */
export async function sendTestPush() {
  const { data } = await api.post('/notifications/test-push');
  return data;
}
