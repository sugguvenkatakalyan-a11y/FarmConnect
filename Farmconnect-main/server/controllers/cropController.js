const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Farmer = require('../models/Farmer');
const Crop = require('../models/Crop');

exports.postCrop = [
  body('cropName').notEmpty().withMessage('Crop name is required'),
  body('quantity').isNumeric().withMessage('Quantity must be a number').custom((value) => value >= 0).withMessage('Quantity must be non-negative'),
  body('unit').isIn(['kg', 'dozen', 'unit']).withMessage('Unit must be "kg", "dozen", or "unit"'),
  body('price').isNumeric().withMessage('Price must be a number').custom((value) => value >= 0).withMessage('Price must be non-negative'),
  body('image').notEmpty().withMessage('Image URL is required'),
  body('type').isIn(['vegetables', 'fruits']).withMessage('Type must be "vegetables" or "fruits"'),
  body('farmerId').notEmpty().withMessage('Farmer ID is required'),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { cropName, quantity, unit, price, image, type, farmerId } = req.body;

    try {
      // Validate farmerId in User collection
      const user = await User.findById(farmerId);
      if (!user || user.role !== 'farmer') {
        return res.status(400).json({ message: 'Invalid or non-farmer ID' });
      }

      // Fetch farmer details from Farmer collection
      const farmer = await Farmer.findOne({ userId: farmerId });
      if (!farmer) {
        return res.status(400).json({ message: 'Farmer details not found' });
      }

      // Find or create Crop document
      let cropDoc = await Crop.findOne({ farmerId });
      if (!cropDoc) {
        cropDoc = new Crop({
          farmerId,
          farmerName: user.name,
          farmerDetails: {
            aadhaarNumber: farmer.aadhaarNumber,
            address: farmer.address,
            state: farmer.state,
            district: farmer.district,
            villageMandal: farmer.villageMandal,
            pincode: farmer.pincode,
            landSize: farmer.landSize,
            cropsGrown: farmer.cropsGrown,
            irrigationAvailable: farmer.irrigationAvailable,
            ownTransport: farmer.ownTransport,
            upiId: farmer.upiId,
            landProofDocument: farmer.landProofDocument,
            status: farmer.status,
            latitude: farmer.latitude,
            longitude: farmer.longitude,
          },
          crops: [],
        });
      }

      // Add new crop to crops array
      cropDoc.crops.push({
        name: cropName,
        unit,
        quantity,
        price,
        image,
        type,
      });


      await cropDoc.save();
      res.status(201).json({ message: 'Crop posted successfully', crop: cropDoc.crops[cropDoc.crops.length - 1] });
    } catch (err) {
      console.error('Error posting crop:', err);
      res.status(500).json({ message: 'Server error' });
    }
  },
];

exports.getFarmerCrops = async (req, res) => {
  try {
    // req.user.id should be set by your auth middleware
    const cropDoc = await Crop.findOne({ farmerId: req.user.id });

    if (!cropDoc || cropDoc.crops.length === 0) {
      return res.status(200).json([]); // Return empty array if no crops
    }

    res.json(cropDoc.crops);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Controller to update a crop
exports.updateCrop = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { cropId } = req.params;
  const { quantity, price } = req.body;

  try {
    const cropDoc = await Crop.findOne({ "crops._id": cropId, farmerId: req.user.id });

    if (!cropDoc) {
      return res.status(404).json({ msg: 'Crop not found or you are not authorized' });
    }

    // Find the specific crop in the array using Mongoose's id() method
    const cropToUpdate = cropDoc.crops.id(cropId);
    if (!cropToUpdate) {
        return res.status(404).json({ msg: 'Sub-document crop not found' });
    }

    // Update fields
    cropToUpdate.quantity = quantity;
    cropToUpdate.price = price;

    await cropDoc.save(); // Save the parent document
    res.json({ message: 'Crop updated successfully', crops: cropDoc.crops });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Controller to delete a crop
exports.deleteCrop = async (req, res) => {
  const { cropId } = req.params;

  try {
    const cropDoc = await Crop.findOneAndUpdate(
      { "crops._id": cropId, farmerId: req.user.id },
      { $pull: { crops: { _id: cropId } } }, // Use $pull to remove from array
      { new: true }
    );

    if (!cropDoc) {
      return res.status(404).json({ msg: 'Crop not found or you are not authorized to delete' });
    }

    res.json({ message: 'Crop deleted successfully', crops: cropDoc.crops });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};


exports.updateCropQuantity = async (req, res) => {
  try {
    const { cropId } = req.params;
    const { quantity } = req.body;

    // Validate quantity
    if (quantity === undefined || quantity < 0) {
      return res.status(400).json({ message: 'Invalid quantity' });
    }

    // Find Crop document containing the subdocument with cropId
    const cropDoc = await Crop.findOne({ 'crops._id': cropId });
    if (!cropDoc) {
      return res.status(404).json({ message: 'Crop not found' });
    }

    // Find and update the specific crop subdocument
    const subCrop = cropDoc.crops.id(cropId);
    if (!subCrop) {
      return res.status(404).json({ message: 'Crop subdocument not found' });
    }

    subCrop.quantity = quantity;
    subCrop.updatedAt = Date.now(); // Update timestamp
    await cropDoc.save();

    res.json({ message: 'Crop quantity updated', crop: subCrop });
  } catch (err) {
    console.error('Update crop quantity error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getCropById = async (req, res) => {
  try {
    const cropId = req.params.id;

    // Find the parent document that contains the crop sub-document
    const cropDoc = await Crop.findOne({ 'crops._id': cropId });

    if (!cropDoc) {
      return res.status(404).json({ message: 'Crop not found.' });
    }

    // Extract the specific crop from the 'crops' array
    const singleCrop = cropDoc.crops.id(cropId);

    if (!singleCrop) {
      return res.status(404).json({ message: 'Crop sub-document not found.' });
    }

    // Combine data from the sub-document and parent document for the response
    const response = {
      _id: singleCrop._id,
      name: singleCrop.name,
      quantity: singleCrop.quantity,
      unit: singleCrop.unit,
      price: singleCrop.price,
      image: singleCrop.image,
      type: singleCrop.type,
      farmerInfo: {
        id: cropDoc.farmerId,
        name: cropDoc.farmerName,
        village: cropDoc.farmerDetails.villageMandal,
        district: cropDoc.farmerDetails.district,
      },
    };

    res.json(response);

  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
        return res.status(404).json({ message: 'Crop not found (invalid ID format).' });
    }
    res.status(500).send('Server Error');
  }
};