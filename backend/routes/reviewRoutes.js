const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const authMiddleware = require('../middleware/authMiddleware');

// Public routes
router.get('/product/:productId', reviewController.getProductReviews);

// Protected routes
router.get('/user/my-reviews', authMiddleware, reviewController.getUserReviews);
router.post('/', authMiddleware, reviewController.createReview);
router.put('/:id', authMiddleware, reviewController.updateReview);
router.delete('/:id', authMiddleware, reviewController.deleteReview);

module.exports = router;