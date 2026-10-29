const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const sellerMiddleware = require('../middleware/sellerMiddleware');
const vendorController = require('../controllers/vendorController');

const router = express.Router();
router.get('/summary', authMiddleware, sellerMiddleware, vendorController.getSummary);
module.exports = router;
