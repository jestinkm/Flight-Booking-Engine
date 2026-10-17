import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import api from '../lib/axios';
import toast from 'react-hot-toast';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged
} from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from '../firebase';

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
  const isSyncingGoogle = useRef(false);

  // Maintain user login sessions across page reloads with Firebase & Backend
  useEffect(() => {
    let isMounted = true;

    const checkBackendSession = async () => {
      try {
        const response = await api.get('/auth/me');
        const userData = response.data?.user || response.data?.data?.user;
        if (userData && !userData.error) {
          if (isMounted) {
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
          }
        } else {
          if (isMounted) {
            setUser(null);
            localStorage.removeItem('user');
          }
        }
      } catch {
        if (isMounted) {
          setUser(null);
          localStorage.removeItem('user');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (!isFirebaseConfigured()) {
      // If Firebase API key not configured yet, verify backend session directly
      checkBackendSession();
      return () => {
        isMounted = false;
      };
    }

    // Check if user just returned from a Firebase redirect sign-in
    getRedirectResult(auth)
      .then(async (result) => {
        if (!isMounted || !result || !result.user) return;
        const fbUser = result.user;
        const idToken = await fbUser.getIdToken();
        const extractedEmail = fbUser.email || fbUser.providerData?.[0]?.email || `google_${fbUser.uid.replace(/[^a-zA-Z0-9]/g, '').slice(0, 15)}@gmail.com`;
        const extractedName = fbUser.displayName || fbUser.providerData?.[0]?.displayName || extractedEmail.split('@')[0];

        const syncRes = await api.post('/auth/google', {
          email: extractedEmail,
          name: extractedName,
          picture: fbUser.photoURL || fbUser.providerData?.[0]?.photoURL || '',
          googleId: fbUser.uid,
          credential: idToken
        }).catch(() => null);

        const syncedUser = syncRes?.data?.data?.user || syncRes?.data?.user || {
          email: extractedEmail,
          firstName: extractedName.split(' ')[0] || 'Traveler',
          lastName: extractedName.split(' ').length > 1 ? extractedName.split(' ').slice(1).join(' ') : '',
          role: 'CUSTOMER',
          avatar: fbUser.photoURL || ''
        };
        const jwt = syncRes?.data?.data?.token || syncRes?.data?.token;
        if (jwt) localStorage.setItem('token', jwt);
        setUser(syncedUser);
        localStorage.setItem('user', JSON.stringify(syncedUser));
        toast.success(`Welcome, ${syncedUser.firstName || 'Traveler'}! Signed in with Google.`);

        const savedRedirect = sessionStorage.getItem('auth_redirect_to') || '/';
        sessionStorage.removeItem('auth_redirect_to');
        if (savedRedirect !== window.location.pathname) {
          window.location.replace(savedRedirect);
        } else if (window.location.pathname === '/login' || window.location.pathname === '/register') {
          window.location.replace('/');
        }
      })
      .catch((err) => {
        console.warn('Redirect auth result warning:', err.code, err.message);
      });

    let unsubscribe = () => {};
    try {
      unsubscribe = onAuthStateChanged(
        auth,
        async (firebaseUser) => {
          if (!isMounted) return;

          if (firebaseUser) {
            if (isSyncingGoogle.current) {
              if (isMounted) setLoading(false);
              return;
            }

            try {
              // Check backend session
              const response = await api.get('/auth/me');
              const userData = response.data?.user || response.data?.data?.user || response.data;
              if (userData && !userData.error) {
                setUser(userData);
                localStorage.setItem('user', JSON.stringify(userData));
              } else if (!isSyncingGoogle.current) {
                // If backend session missing, sync with Firebase user credentials
                isSyncingGoogle.current = true;
                const idToken = await firebaseUser.getIdToken();
                const extractedEmail = firebaseUser.email || firebaseUser.providerData?.[0]?.email || `google_${firebaseUser.uid.replace(/[^a-zA-Z0-9]/g, '').slice(0, 15)}@gmail.com`;
                const extractedName = firebaseUser.displayName || firebaseUser.providerData?.[0]?.displayName || extractedEmail.split('@')[0];

                const syncRes = await api.post('/auth/google', {
                  email: extractedEmail,
                  name: extractedName,
                  picture: firebaseUser.photoURL || firebaseUser.providerData?.[0]?.photoURL || '',
                  googleId: firebaseUser.uid,
                  credential: idToken
                }).catch(() => null);

                const syncedUser = syncRes?.data?.data?.user || syncRes?.data?.user || {
                  email: extractedEmail,
                  firstName: extractedName.split(' ')[0] || 'Traveler',
                  lastName: extractedName.split(' ').length > 1 ? extractedName.split(' ').slice(1).join(' ') : '',
                  role: 'CUSTOMER',
                  avatar: firebaseUser.photoURL || ''
                };
                const jwt = syncRes?.data?.data?.token || syncRes?.data?.token;
                if (jwt) localStorage.setItem('token', jwt);
                setUser(syncedUser);
                localStorage.setItem('user', JSON.stringify(syncedUser));
              }
            } catch (err) {
              // Fallback to Firebase user profile if backend is unreachable or rate limited
              const fallbackUser = {
                email: firebaseUser.email,
                firstName: firebaseUser.displayName ? firebaseUser.displayName.split(' ')[0] : 'Traveler',
                lastName: firebaseUser.displayName && firebaseUser.displayName.split(' ').length > 1 ? firebaseUser.displayName.split(' ').slice(1).join(' ') : '',
                role: 'CUSTOMER',
                avatar: firebaseUser.photoURL || ''
              };
              setUser(fallbackUser);
              localStorage.setItem('user', JSON.stringify(fallbackUser));
            } finally {
              isSyncingGoogle.current = false;
              if (isMounted) setLoading(false);
            }
          } else {
            await checkBackendSession();
          }
        },
        (error) => {
          console.warn('Firebase Auth State Notice:', error.message);
          checkBackendSession();
        }
      );
    } catch (err) {
      console.warn('Firebase onAuthStateChanged init notice:', err.message);
      checkBackendSession();
    }

    return () => {
      isMounted = false;
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Login using email/password (supporting Firebase and backend sync)
  const login = async (identifier, password) => {
    const isEmail = identifier.includes('@');
    let firebaseUser = null;
    let firebaseToken = null;

    // 1. Try Firebase Authentication if user entered an email
    if (isEmail) {
      try {
        const cred = await signInWithEmailAndPassword(auth, identifier.trim().toLowerCase(), password);
        firebaseUser = cred.user;
        firebaseToken = await firebaseUser.getIdToken();
      } catch (fbErr) {
        console.warn('Firebase email sign-in fallback to backend:', fbErr.code);
      }
    }

    // 2. Authenticate or sync with backend
    try {
      const response = await api.post('/auth/login', { identifier, password });
      const userData = response.data?.user || response.data?.data?.user || response.data;
      const token = response.data?.token || response.data?.data?.token;
      if (token) localStorage.setItem('token', token);
      else if (firebaseToken) localStorage.setItem('token', firebaseToken);

      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      toast.success('Welcome back!');
      return { success: true, user: userData };
    } catch (error) {
      // If backend login failed but Firebase succeeded, sync user into backend
      if (firebaseUser) {
        try {
          const syncRes = await api.post('/auth/google', {
            email: firebaseUser.email,
            name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
            googleId: firebaseUser.uid,
            credential: firebaseToken
          });
          const userData = syncRes.data?.data?.user || syncRes.data?.user || {
            email: firebaseUser.email,
            firstName: firebaseUser.displayName ? firebaseUser.displayName.split(' ')[0] : 'Traveler',
            role: 'CUSTOMER'
          };
          const jwt = syncRes.data?.data?.token || syncRes.data?.token || firebaseToken;
          if (jwt) localStorage.setItem('token', jwt);
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
          toast.success('Welcome back!');
          return { success: true, user: userData };
        } catch (syncErr) {
          console.error('Backend sync error:', syncErr);
        }
      }

      const message = error.response?.data?.message || error.response?.data?.error || 'Login failed. Please check your credentials.';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // Admin Login via Backend (Super Admin, Schedule Admin, Marketing Admin)
  const adminLogin = async (identifier, password) => {
    try {
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

  // Sign up using email and password with Firebase & Backend
  const register = async (registrationData) => {
    const { email, password, firstName, lastName, phone, username } = registrationData;

    try {
      // 1. Create account in Firebase Auth
      let firebaseUser = null;
      let idToken = null;
      try {
        const cred = await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
        firebaseUser = cred.user;
        const displayName = `${firstName || ''} ${lastName || ''}`.trim() || username || email.split('@')[0];
        await updateProfile(firebaseUser, { displayName });
        idToken = await firebaseUser.getIdToken();
      } catch (fbErr) {
        console.warn('Firebase createUser warning:', fbErr.code);
        if (fbErr.code === 'auth/email-already-in-use') {
          // If already in Firebase, attempt backend registration
        } else if (fbErr.code === 'auth/weak-password') {
          toast.error('Password is too weak. Please use at least 6 characters.');
          return { success: false, error: fbErr.message };
        }
      }

      // 2. Register in application backend (MongoDB)
      const response = await api.post('/auth/register', registrationData);
      const userData = response.data?.user || response.data?.data?.user || response.data;
      const token = response.data?.token || response.data?.data?.token || idToken;
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

  // Logout from Firebase & Backend
  const logout = async () => {
    try {
      await signOut(auth);
    } catch (fbErr) {
      console.warn('Firebase signOut error:', fbErr);
    }

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

  // Login with Google via Firebase
  const loginWithGoogle = async (googleData) => {
    isSyncingGoogle.current = true;
    try {
      let payload = googleData;

      // If called without payload, trigger Firebase popup
      if (!payload) {
        const result = await signInWithPopup(auth, googleProvider);
        const fbUser = result.user;
        const idToken = await fbUser.getIdToken();
        const extractedEmail = fbUser.email || fbUser.providerData?.[0]?.email || `google_${fbUser.uid.replace(/[^a-zA-Z0-9]/g, '').slice(0, 15)}@gmail.com`;
        const extractedName = fbUser.displayName || fbUser.providerData?.[0]?.displayName || extractedEmail.split('@')[0];
        payload = {
          email: extractedEmail,
          name: extractedName,
          firstName: extractedName.split(' ')[0] || 'Traveler',
          lastName: extractedName.split(' ').length > 1 ? extractedName.split(' ').slice(1).join(' ') : '',
          picture: fbUser.photoURL || fbUser.providerData?.[0]?.photoURL || '',
          googleId: fbUser.uid,
          credential: idToken
        };
      }

      // Ensure payload.email is never empty
      if (!payload.email && payload.googleId) {
        payload.email = `google_${payload.googleId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 15)}@gmail.com`;
      }

      const response = await api.post('/auth/google', payload);
      const userData = response.data?.data?.user || response.data?.user || response.data;
      const token = response.data?.data?.token || response.data?.token;

      if (token) localStorage.setItem('token', token);
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      toast.success(`Welcome, ${userData.firstName || userData.name || 'Traveler'}! Signed in with Google.`);
      return { success: true, user: userData };
    } catch (error) {
      console.error('Google login error:', error);
      let message = error.response?.data?.message || error.message || 'Google authentication failed.';
      if (error.response?.status === 429) {
        message = 'Server is currently receiving too many requests. Please wait a few moments and try again.';
      }
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setTimeout(() => {
        isSyncingGoogle.current = false;
      }, 1000);
    }
  };

  // Firebase Password Reset Email
  const sendFirebasePasswordReset = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email.trim().toLowerCase());
      toast.success(`Password reset email sent to ${email}. Check your inbox!`);
      return { success: true };
    } catch (error) {
      console.error('Firebase sendPasswordResetEmail error:', error);
      let message = 'Failed to send password reset email.';
      if (error.code === 'auth/user-not-found') {
        message = 'No registered user found with this email.';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Please provide a valid email address.';
      }
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // OTP-based Password Reset functions
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
    sendFirebasePasswordReset,
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
