const Offer = require('../models/Offer');

/**
 * Validates an offer promo code against order details
 * @param {string} promoCode
 * @param {number} totalAmount
 * @param {string|ObjectId} userId
 * @param {{originCode?: string, destinationCode?: string}} [route]
 */
const validateOffer = async (promoCode, totalAmount, userId = null, route = null) => {
  if (!promoCode || typeof promoCode !== 'string') {
    return null;
  }

  const code = promoCode.trim().toUpperCase();
  const offer = await Offer.findOne({ promoCode: code });

  if (!offer) {
    throw new Error(`Promo code '${code}' not found`);
  }

  const now = new Date();

  // Auto-expire offer if end date has passed
  if (offer.status === 'ACTIVE' && offer.endAt < now) {
    offer.status = 'EXPIRED';
    await offer.save();
    throw new Error(`Promo code '${code}' has expired`);
  }

  if (offer.status !== 'ACTIVE') {
    throw new Error(`Promo code '${code}' is currently ${offer.status.toLowerCase()}`);
  }

  if (now < offer.startAt) {
    throw new Error(`Promo code '${code}' is not active yet`);
  }

  if (offer.minimumBookingAmount && totalAmount < offer.minimumBookingAmount) {
    throw new Error(`Minimum booking amount of ₹${offer.minimumBookingAmount} required for promo code '${code}'`);
  }

  if (offer.maxRedemptions && offer.redemptionCount >= offer.maxRedemptions) {
    throw new Error(`Promo code '${code}' redemption limit has been reached`);
  }

  if (route && offer.eligibleRoutes && offer.eligibleRoutes.length > 0) {
    const isEligible = offer.eligibleRoutes.some(
      (r) =>
        (!r.originCode || r.originCode === route.originCode) &&
        (!r.destinationCode || r.destinationCode === route.destinationCode)
    );
    if (!isEligible) {
      throw new Error(`Promo code '${code}' is not valid for this route`);
    }
  }

  return offer;
};

/**
 * Calculate the discount amount based on offer rules
 * @param {Object} offer
 * @param {number} totalAmount
 * @returns {number}
 */
const calculateDiscount = (offer, totalAmount) => {
  if (!offer || !totalAmount) return 0;

  let discount = 0;
  if (offer.discountType === 'FIXED') {
    discount = offer.discountValue;
  } else if (offer.discountType === 'PERCENTAGE') {
    discount = (totalAmount * offer.discountValue) / 100;
  }

  if (offer.maxDiscount && discount > offer.maxDiscount) {
    discount = offer.maxDiscount;
  }

  discount = Math.min(discount, totalAmount);
  return Math.round(discount * 100) / 100;
};

/**
 * Increment redemption count within transaction
 * @param {string|ObjectId} offerId
 * @param {ClientSession} session
 */
const applyOffer = async (offerId, session = null) => {
  if (!offerId) return null;
  return Offer.findByIdAndUpdate(
    offerId,
    { $inc: { redemptionCount: 1 } },
    { session, new: true }
  );
};

module.exports = {
  validateOffer,
  calculateDiscount,
  applyOffer
};
