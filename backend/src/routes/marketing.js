const express = require('express');
const { body } = require('express-validator');
const {
  getSearchAnalytics,
  getRouteAnalytics,
  getConversionRate,
  getMarketDemandAnalytics,
  listSearchEvents,
  listCustomerInteractions,
  createCustomerInteraction,
  updateCustomerInteraction,
  createOffer,
  listOffers,
  getOfferById,
  updateOffer,
  deleteOffer,
  sendCampaign,
  getTargetedRouteUsers,
  sendTargetedRouteEmail
} = require('../controllers/marketingController');
const authenticate = require('../middleware/authenticate');
const { allowRoles } = require('../middleware/authorize');
const validateRequest = require('../middleware/validateRequest');

const router = express.Router();

// Public / Authenticated offers browsing
router.get('/offers', (req, res, next) => {
  // Optional authenticate
  if (req.cookies?.token || req.headers.authorization) {
    return authenticate(req, res, () => listOffers(req, res, next));
  }
  listOffers(req, res, next);
});

router.get('/offers/:id', getOfferById);

// Admin-only Analytics routes
router.get(
  '/analytics/demand',
  authenticate,
  allowRoles('MARKETING_ADMIN', 'SUPER_ADMIN'),
  getMarketDemandAnalytics
);

router.get(
  '/searches',
  authenticate,
  allowRoles('MARKETING_ADMIN', 'SUPER_ADMIN'),
  listSearchEvents
);

router.get(
  '/interactions',
  authenticate,
  allowRoles('MARKETING_ADMIN', 'SUPER_ADMIN'),
  listCustomerInteractions
);

router.post(
  '/interactions',
  authenticate,
  allowRoles('MARKETING_ADMIN', 'SUPER_ADMIN'),
  createCustomerInteraction
);

router.patch(
  '/interactions/:id',
  authenticate,
  allowRoles('MARKETING_ADMIN', 'SUPER_ADMIN'),
  updateCustomerInteraction
);

router.put(
  '/interactions/:id',
  authenticate,
  allowRoles('MARKETING_ADMIN', 'SUPER_ADMIN'),
  updateCustomerInteraction
);

router.get(
  '/analytics/searches',
  authenticate,
  allowRoles('MARKETING_ADMIN', 'SUPER_ADMIN'),
  getSearchAnalytics
);

router.get(
  '/analytics/routes',
  authenticate,
  allowRoles('MARKETING_ADMIN', 'SUPER_ADMIN'),
  getRouteAnalytics
);

router.get(
  '/analytics/conversion',
  authenticate,
  allowRoles('MARKETING_ADMIN', 'SUPER_ADMIN'),
  getConversionRate
);

// High-intent targeted users by route
router.get(
  '/targeted-users',
  authenticate,
  allowRoles('MARKETING_ADMIN', 'SUPER_ADMIN'),
  getTargetedRouteUsers
);

router.post(
  '/targeted-users/send',
  authenticate,
  allowRoles('MARKETING_ADMIN', 'SUPER_ADMIN'),
  sendTargetedRouteEmail
);

// Admin-only Offer CRUD
router.post(
  '/offers',
  authenticate,
  allowRoles('MARKETING_ADMIN', 'SUPER_ADMIN'),
  [
    body('promoCode').trim().notEmpty().withMessage('Promo code is required'),
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('discountType').isIn(['FIXED', 'PERCENTAGE']).withMessage('discountType must be FIXED or PERCENTAGE'),
    body('discountValue').isNumeric().withMessage('discountValue must be a number'),
    body('startAt').notEmpty().withMessage('startAt date is required'),
    body('endAt').notEmpty().withMessage('endAt date is required'),
    validateRequest
  ],
  createOffer
);

router.put(
  '/offers/:id',
  authenticate,
  allowRoles('MARKETING_ADMIN', 'SUPER_ADMIN'),
  updateOffer
);

router.delete(
  '/offers/:id',
  authenticate,
  allowRoles('MARKETING_ADMIN', 'SUPER_ADMIN'),
  deleteOffer
);

// Campaign dispatch
router.post(
  '/campaigns/send',
  authenticate,
  allowRoles('MARKETING_ADMIN', 'SUPER_ADMIN'),
  sendCampaign
);

module.exports = router;

