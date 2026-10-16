import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/axios';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  // Check auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await api.get('/auth/me');
        if (response.data?.user || response.data?.data?.user) {
          const userData = response.data.user || response.data.data.user;
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
        } else if (response.data && !response.data.error) {
          setUser(response.data);
          localStorage.setItem('user', JSON.stringify(response.data));
        }
      } catch (err) {
        // Session invalid or not logged in
        setUser(null);
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (identifier, password) => {
    try {
      const response = await api.post('/auth/login', { identifier, password });
      const userData = response.data?.user || response.data?.data?.user || response.data;
      const token = response.data?.token || response.data?.data?.token;
      if (token) localStorage.setItem('token', token);
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      toast.success('Welcome back!');
      return { success: true, user: userData };
    } catch (error) {
      const message = error.response?.data?.message || error.response?.data?.error || 'Login failed. Please check your credentials.';
      toast.error(message);
      return { success: false, error: message };
    }
  };


  const adminLogin = async (identifier, password) => {
    try {
      // Use the same /auth/login endpoint with identifier (email or username)
      const response = await api.post('/auth/login', { identifier, password });

      const userData = response.data?.user || response.data?.data?.user || response.data;
      const token = response.data?.token || response.data?.data?.token;
      const adminRoles = ['SUPER_ADMIN', 'SCHEDULE_ADMIN', 'MARKETING_ADMIN'];
      if (userData && !adminRoles.includes(userData.role)) {
        throw new Error('Access denied. Administrator privileges required.');
      }

      if (token) localStorage.setItem('token', token);
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      toast.success(`Admin logged in as ${userData.role}`);
      return { success: true, user: userData };
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Admin authentication failed.';
      toast.error(message);
      return { success: false, error: message };
    }
  };


  const register = async (registrationData) => {
    try {
      const response = await api.post('/auth/register', registrationData);
      const userData = response.data?.user || response.data?.data?.user || response.data;
      const token = response.data?.token || response.data?.data?.token;
      if (token) localStorage.setItem('token', token);
      if (userData && userData.email) {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      }
      toast.success('Registration successful! Welcome to Skynexa.');
      return { success: true, user: userData };
    } catch (error) {
      const message = error.response?.data?.message || error.response?.data?.error || 'Registration failed.';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore network errors on logout
    } finally {
      setUser(null);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      toast.success('Logged out successfully');
    }
  };

  const loginWithGoogle = async (googleData) => {
    try {
      const response = await api.post('/auth/google', googleData);
      const userData = response.data?.user || response.data?.data?.user || response.data;
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      toast.success(`Welcome, ${userData.firstName || userData.name || 'Traveler'}! Signed in with Google.`);
      return { success: true, user: userData };
    } catch (error) {
      const message = error.response?.data?.message || 'Google authentication failed.';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const sendPasswordResetOtp = async (email) => {
    try {
      const response = await api.post('/auth/forgot-password-otp', { email });
      toast.success(response.data?.message || `6-digit OTP sent to ${email}`);
      return { success: true, data: response.data?.data || response.data };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to send verification OTP.';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const verifyPasswordResetOtp = async (email, otp) => {
    try {
      const response = await api.post('/auth/verify-otp', { email, otp });
      toast.success('Verification code confirmed!');
      return { success: true, data: response.data };
    } catch (error) {
      const message = error.response?.data?.message || 'Invalid or expired OTP code.';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const resetPasswordWithOtp = async (email, otp, newPassword) => {
    try {
      const response = await api.post('/auth/reset-password-otp', { email, otp, newPassword });
      toast.success(response.data?.message || 'Password reset successfully!');
      return { success: true, data: response.data };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to reset password.';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const updateUser = (userData) => {
    const updated = { ...user, ...userData };
    setUser(updated);
    localStorage.setItem('user', JSON.stringify(updated));
  };

  const value = {
    user,
    loading,
    login,
    adminLogin,
    loginWithGoogle,
    sendPasswordResetOtp,
    verifyPasswordResetOtp,
    resetPasswordWithOtp,
    register,
    logout,
    updateUser,
    isAuthenticated: !!user,
    isAdmin: user ? ['SUPER_ADMIN', 'SCHEDULE_ADMIN', 'MARKETING_ADMIN'].includes(user.role) : false
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
