const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const authMiddleware = require('../middleware/authMiddleware');
const sellerMiddleware = require('../middleware/sellerMiddleware');

// Public routes
router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);

// Protected routes (sellers only)
router.post('/', authMiddleware, sellerMiddleware, productController.createProduct);
router.put('/:id', authMiddleware, sellerMiddleware, productController.updateProduct);
router.delete('/:id', authMiddleware, sellerMiddleware, productController.deleteProduct);

// Inquiries
router.post('/:id/inquire', authMiddleware, productController.inquireProduct);

module.exports = router;