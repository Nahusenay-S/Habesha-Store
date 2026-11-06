const express = require('express');
const {
  initializeChapaPayment,
  verifyChapaPayment,
  handleChapaWebhook,
} = require('../controllers/chapaController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

// Initialize Chapa Checkout (requires login)
router.post('/initialize', authenticate, initializeChapaPayment);

// Verify Chapa Transaction by reference (requires login or callback reference)
router.get('/verify/:txRef', authenticate, verifyChapaPayment);
router.post('/verify', authenticate, (req, res) => {
  req.params.txRef = req.body.txRef || req.body.referenceId;
  return verifyChapaPayment(req, res);
});

// Chapa Webhook callback (public endpoint with signature check)
router.post('/webhook', handleChapaWebhook);

module.exports = router;
