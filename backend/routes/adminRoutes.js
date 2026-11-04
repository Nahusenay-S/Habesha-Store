const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const adminController = require('../controllers/adminController');

const router = express.Router();
router.use(authMiddleware, adminMiddleware);
router.get('/overview', adminController.getOverview);
router.get('/payment-config', adminController.getPaymentConfig);
router.put('/payment-config', adminController.updatePaymentConfig);
router.get('/users', adminController.getAllUsers);
router.put('/users/:id/status', adminController.toggleUserStatus);
router.get('/products', adminController.getAllProductsAdmin);
router.put('/products/:id/status', adminController.toggleProductStatus);

module.exports = router;
