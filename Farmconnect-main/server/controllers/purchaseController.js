// controllers/purchaseController.js
const { body, validationResult } = require('express-validator');
const Crop = require('../models/Crop');
const Purchase = require('../models/Purchase');

exports.postPurchase = [
  body('cropId').notEmpty().withMessage('Crop ID is required'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
  body('farmerId').notEmpty().withMessage('Farmer ID is required'),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { cropId, quantity, farmerId } = req.body;
    const customerId = req.user.id; // From authMiddleware

    try {
      // Find the crop document for the farmer
      const cropDoc = await Crop.findOne({ farmerId, 'crops._id': cropId });
      if (!cropDoc) {
        return res.status(404).json({ message: 'Crop or farmer not found' });
      }

      // Find the specific crop in the crops array
      const crop = cropDoc.crops.id(cropId);
      if (!crop) {
        return res.status(404).json({ message: 'Crop not found' });
      }

      // Check if enough quantity is available
      if (crop.quantity < quantity) {
        return res.status(400).json({ message: 'Insufficient crop quantity' });
      }

      // Calculate total price
      const totalPrice = crop.price * quantity;

      // Update crop quantity
      crop.quantity -= quantity;
      await cropDoc.save();

      // Create purchase record
      const purchase = new Purchase({
        customerId,
        farmerId,
        cropId,
        cropName: crop.name,
        image:crop.image,
        quantity,
        unit: crop.unit,
        totalPrice,
        status: 'pending'
      });
      await purchase.save();

      res.status(201).json({ message: 'Purchase successful', purchase });
    } catch (err) {
      console.error('Error creating purchase:', err);
      res.status(500).json({ message: 'Server error' });
    }
  }
];

exports.getPurchases = async (req, res) => {
  try {
    const purchases = await Purchase.find({ customerId: req.user.id })
      .populate('farmerId', 'name email')
      .sort({ createdAt: -1 });
    res.json(purchases);
  } catch (err) {
    console.error('Error fetching purchases:', err);
    res.status(500).json({ message: 'Server error' });
  }
};