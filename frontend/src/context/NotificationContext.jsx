import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../lib/axios';
import { useAuth } from './AuthContext';
import { registerServiceWorker } from '../lib/pushNotifications';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    setLoading(true);
    try {
      let res;
      try {
        res = await api.get('/users/me/notifications');
      } catch (err) {
        if (err.response?.status === 404) {
          res = await api.get('/notifications');
        } else {
          throw err;
        }
      }

      const list = res.data?.notifications || res.data?.data?.notifications || (Array.isArray(res.data) ? res.data : []);
      setNotifications(list);
      const unread = list.filter((n) => !n.isRead && !n.read).length;
      setUnreadCount(unread);
    } catch {
      // Backend may not have notifications populated yet
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
    registerServiceWorker();
  }, [fetchNotifications]);

  const markAsRead = async (notificationId) => {
    try {
      try {
        await api.patch(`/notifications/${notificationId}/read`);
      } catch (e) {
        if (e.response?.status === 404) {
          await api.patch(`/users/me/notifications/${notificationId}/read`);
        }
      }

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId || n._id === notificationId ? { ...n, isRead: true, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      try {
        await api.post('/notifications/mark-all-read');
      } catch (e) {
        if (e.response?.status === 404) {
          await api.post('/users/me/notifications/mark-all-read');
        }
      }

      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read', error);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        markAsRead,
        markAllAsRead
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext;
