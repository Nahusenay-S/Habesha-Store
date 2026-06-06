const express = require('express');
const {
  createTelebirrPayment,
  verifyTelebirrPayment,
  handleTelebirrCallback,
  handleTelebirrWebhook,
  getTelebirrPaymentStatus,
} = require('../controllers/telebirrController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

// Create Telebirr payment (requires authentication)
router.post('/create', authenticate, createTelebirrPayment);

// Verify Telebirr payment status (requires authentication)
router.post('/verify', authenticate, verifyTelebirrPayment);

// Get Telebirr payment status by reference (requires authentication)
router.get('/status/:referenceId', authenticate, getTelebirrPaymentStatus);

// Telebirr callback (no auth - called by Telebirr)
router.post('/callback', handleTelebirrCallback);

// Telebirr webhook for async notifications (no auth - called by Telebirr)
router.post('/webhook', handleTelebirrWebhook);

module.exports = router;
