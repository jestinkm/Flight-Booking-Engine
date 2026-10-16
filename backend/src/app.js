const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

// Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const airportRoutes = require('./routes/airports');
const flightRoutes = require('./routes/flights');
const bookingRoutes = require('./routes/bookings');
const adminRoutes = require('./routes/admin');
const superAdminRoutes = require('./routes/superAdmin');
const analyticsRoutes = require('./routes/analytics');
const marketingRoutes = require('./routes/marketing');
const supportRoutes = require('./routes/support');
const notificationRoutes = require('./routes/notifications');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Security
// Dynamic CORS handling for production (Vercel) and development
const rawClientUrls = process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',').map((u) => u.trim().replace(/\/$/, '')) : ['http://localhost:5173'];
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const cleanOrigin = origin.replace(/\/$/, '');
      if (
        rawClientUrls.includes(cleanOrigin) ||
        cleanOrigin === 'http://localhost:5173' ||
        cleanOrigin === 'http://localhost:3000' ||
        /\.vercel\.app$/.test(cleanOrigin)
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true
  })
);

// Rate limiting
const isTest = process.env.NODE_ENV === 'test';
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: isTest ? 10000 : 500 });
app.use('/api/', limiter);
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: isTest ? 1000 : 100 });
app.use('/api/auth/', authLimiter);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/airports', airportRoutes);
app.use('/api/flights', flightRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/analytics', analyticsRoutes);
app.use('/api/super-admin', superAdminRoutes);
app.use('/api/super-admin/analytics', analyticsRoutes);
app.use('/api/marketing', marketingRoutes);
app.use('/api/support', supportRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'Skynexa API' }));

// 404 handler for unhandled API routes
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Not Found - ${req.originalUrl}`
  });
});

app.use(errorHandler);

module.exports = app;
