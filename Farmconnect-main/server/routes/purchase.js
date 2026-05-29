// routes/purchase.js
const express = require('express');
const router = express.Router();
const getFarmer  = require('../controllers/getFarmerCrops');
const purchaseController = require('../controllers/purchaseController');
const authMiddleware = require('../middleware/auth');

router.post('/', authMiddleware(['customer']), purchaseController.postPurchase);
router.get('/', authMiddleware(['customer']), purchaseController.getPurchases);
router.get('/farmer/:farmerId', getFarmer.getFarmerPurchases);
router.patch('/:purchaseId/status', getFarmer.updatePurchaseStatus);

module.exports = router;