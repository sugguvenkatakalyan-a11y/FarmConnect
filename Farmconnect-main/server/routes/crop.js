const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const cropController = require('../controllers/cropController');
const authMiddleware = require('../middleware/auth');
const nearbyCropController = require('../controllers/nearbyCropController')

router.post('/crop', authMiddleware(), cropController.postCrop);
router.post('/nearby-crops',nearbyCropController.getNearbyCrops);
router.get('/cropdata', authMiddleware(), cropController.getFarmerCrops);
router.put(
  '/:cropId',
  [
    authMiddleware(),
    body('quantity', 'Quantity is required and must be a positive number').isNumeric().toFloat().custom((value) => value > 0),
    body('price', 'Price is required and must be a positive number').isNumeric().toFloat().custom((value) => value > 0),
  ],
  cropController.updateCrop
);
router.delete('/:cropId', authMiddleware(), cropController.deleteCrop);
router.patch('/:cropId', authMiddleware(), cropController.updateCropQuantity);
router.get('/:id', authMiddleware(), cropController.getCropById);



module.exports = router;   