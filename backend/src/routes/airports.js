const express = require('express');
const { body } = require('express-validator');
const {
  listAirports,
  getAirport,
  createAirport,
  updateAirport
} = require('../controllers/airportController');
const authenticate = require('../middleware/authenticate');
const { allowRoles } = require('../middleware/authorize');
const validateRequest = require('../middleware/validateRequest');

const router = express.Router();

router.get('/', listAirports);
router.get('/:codeOrId', getAirport);

router.post(
  '/',
  authenticate,
  allowRoles('SUPER_ADMIN'),
  [
    body('code').trim().isLength({ min: 3, max: 4 }).withMessage('Airport code must be 3-4 letters'),
    body('name').trim().notEmpty().withMessage('Airport name is required'),
    body('city').trim().notEmpty().withMessage('City is required'),
    body('country').trim().notEmpty().withMessage('Country is required'),
    validateRequest
  ],
  createAirport
);

router.put(
  '/:id',
  authenticate,
  allowRoles('SUPER_ADMIN'),
  updateAirport
);

module.exports = router;
