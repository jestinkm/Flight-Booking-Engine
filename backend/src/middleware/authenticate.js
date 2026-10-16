const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticate = async (req, res, next) => {
  try {
    let token = null;

    // 1. Support HTTP Basic Authentication (e.g. for Admin API workflows / interviewer tests)
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Basic ')
    ) {
      try {
        const base64Credentials = req.headers.authorization.split(' ')[1];
        const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
        const [usernameOrEmail, ...passwordParts] = credentials.split(':');
        const password = passwordParts.join(':');

        if (usernameOrEmail && password) {
          const user = await User.findOne({
            $or: [
              { email: usernameOrEmail.toLowerCase().trim() },
              { username: usernameOrEmail.toLowerCase().trim() }
            ]
          });

          if (user && (await user.comparePassword(password))) {
            if (user.status !== 'ACTIVE') {
              return res.status(401).json({
                success: false,
                message: 'Account is deactivated. Please contact support.'
              });
            }
            req.user = user;
            return next();
          }
        }
      } catch (basicErr) {
        // Fall through to token verification
      }
    }

    // 2. Support Cookies and Bearer Tokens
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    } else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token missing. Please log in.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'skynexa_secret_key');
    const user = await User.findById(decoded.id).select('-passwordHash');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists.'
      });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact support.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token. Please log in again.'
      });
    }
    return next(error);
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Basic ')) {
      try {
        const base64Credentials = req.headers.authorization.split(' ')[1];
        const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
        const [usernameOrEmail, ...passwordParts] = credentials.split(':');
        const password = passwordParts.join(':');

        if (usernameOrEmail && password) {
          const user = await User.findOne({
            $or: [
              { email: usernameOrEmail.toLowerCase().trim() },
              { username: usernameOrEmail.toLowerCase().trim() }
            ]
          });
          if (user && (await user.comparePassword(password)) && user.status === 'ACTIVE') {
            req.user = user;
            return next();
          }
        }
      } catch (err) {
        // Ignore basic auth failure in optional mode
      }
    }

    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'skynexa_secret_key');
    const user = await User.findById(decoded.id).select('-passwordHash');
    if (user && user.status === 'ACTIVE') {
      req.user = user;
    }
  } catch (error) {
    // In optional auth, invalid token simply means anonymous user
  }
  next();
};

authenticate.authenticate = authenticate;
authenticate.optionalAuth = optionalAuth;

module.exports = authenticate;
module.exports.authenticate = authenticate;
module.exports.optionalAuth = optionalAuth;
