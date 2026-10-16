const express = require('express');
const { body } = require('express-validator');
const {
  register,
  login,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  googleAuth,
  forgotPasswordOtp,
  verifyOtp,
  resetPasswordOtp
} = require('../controllers/authController');
const authenticate = require('../middleware/authenticate');
const validateRequest = require('../middleware/validateRequest');

const router = express.Router();

router.post(
  '/register',
  [
    body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
    body('email').trim().isEmail().withMessage('Please provide a valid email address'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    validateRequest
  ],
  register
);

router.post(
  '/login',
  [
    body().custom((value, { req }) => {
      const id = req.body.identifier || req.body.email || req.body.username;
      if (!id || !id.toString().trim()) {
        throw new Error('Email or username is required');
      }
      return true;
    }),
    body('password').notEmpty().withMessage('Password is required'),
    validateRequest
  ],
  login
);

// Google Sign-In / OAuth
router.post('/google', googleAuth);

// OTP-based Forgot Password Flow
router.post(
  '/forgot-password-otp',
  [
    body('email').trim().isEmail().withMessage('Valid email is required'),
    validateRequest
  ],
  forgotPasswordOtp
);

router.post(
  '/verify-otp',
  [
    body('email').trim().isEmail().withMessage('Valid email is required'),
    body('otp').trim().isLength({ min: 6, max: 6 }).withMessage('6-digit OTP code is required'),
    validateRequest
  ],
  verifyOtp
);

router.post(
  '/reset-password-otp',
  [
    body('email').trim().isEmail().withMessage('Valid email is required'),
    body('otp').trim().isLength({ min: 6, max: 6 }).withMessage('6-digit OTP is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
    validateRequest
  ],
  resetPasswordOtp
);

router.post('/logout', logout);

router.get('/me', authenticate, getMe);

router.post(
  '/forgot-password',
  [
    body('email').trim().isEmail().withMessage('Valid email is required'),
    validateRequest
  ],
  forgotPassword
);

router.post(
  '/reset-password',
  [
    body('token').notEmpty().withMessage('Token is required'),
    body('email').trim().isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    validateRequest
  ],
  resetPassword
);

module.exports = router;
