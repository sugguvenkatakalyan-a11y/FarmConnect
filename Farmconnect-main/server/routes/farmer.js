const express = require('express');
const router = express.Router();
const farmerDashboardController = require('../controllers/farmerDashboardController');
const authMiddleware = require('../middleware/auth');

router.get('/:farmerId',authMiddleware(), farmerDashboardController.getFarmerDashboard);

module.exports = router;