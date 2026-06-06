const express = require('express');
const router = express.Router();
const paypalController = require('../controllers/paypalController');
const authMiddleware = require('../middleware/authMiddleware');

// Protected routes (require authentication)
router.post('/create-order', authMiddleware, paypalController.createPayPalOrder);
router.post('/capture', authMiddleware, paypalController.capturePayPalPayment);
router.post('/refund', authMiddleware, paypalController.refundPayPalPayment);

module.exports = router;