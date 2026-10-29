const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const authMiddleware = require('../middleware/authMiddleware');
const buyerMiddleware = require('../middleware/buyerMiddleware');
const sellerMiddleware = require('../middleware/sellerMiddleware');

// All routes require authentication
router.post('/', authMiddleware, buyerMiddleware, orderController.createOrder);
router.get('/', authMiddleware, buyerMiddleware, orderController.getUserOrders);
router.get('/:id', authMiddleware, buyerMiddleware, orderController.getOrderById);
router.put('/:id/status', authMiddleware, buyerMiddleware, orderController.updateOrderStatus);
router.get('/seller/fulfillment', authMiddleware, sellerMiddleware, orderController.getSellerOrders);
router.put('/seller/:id/status', authMiddleware, sellerMiddleware, orderController.updateSellerOrder);

module.exports = router;