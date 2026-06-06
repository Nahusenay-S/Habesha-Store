const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authMiddleware = require('../middleware/authMiddleware');

// Protected routes (require authentication)
router.post('/stripe/create-intent', authMiddleware, paymentController.createStripePaymentIntent);
router.post('/stripe/confirm', authMiddleware, paymentController.confirmStripePayment);
router.post('/refund', authMiddleware, paymentController.processRefund);
router.get('/history', authMiddleware, paymentController.getPaymentHistory);
router.get('/:id', authMiddleware, paymentController.getPaymentById);

// Webhook (no auth needed)
router.post('/webhook/stripe', express.raw({ type: 'application/json' }), paymentController.handleStripeWebhook);

module.exports = router;