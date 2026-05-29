const mongoose = require('mongoose');
const Crop = require('../models/Crop');

// Function to initialize the MongoDB change stream for the Crop collection
const watchCropChanges = () => {
  // Ensure MongoDB connection is established
  if (mongoose.connection.readyState !== 1) {
    console.error('MongoDB connection not ready for change stream');
    return;
  }

  // Set up the change stream to watch for updates on the Crop collection
  const changeStream = Crop.watch([
    {
      $match: {
        'operationType': 'update', // Watch for update operations
        'updateDescription.updatedFields.crops': { $exists: true }, // Only watch for updates to the crops array
      },
    },
  ]);

  // Handle changes in the Crop collection
  changeStream.on('change', async (change) => {
    try {
      const documentId = change.documentKey._id;

      // Fetch the updated document
      const cropDoc = await Crop.findById(documentId);
      if (!cropDoc) {
        console.log('Crop document not found for ID:', documentId);
        return;
      }

      // Check if any crop in the crops array has quantity 0
      const hasZeroQuantity = cropDoc.crops.some((crop) => crop.quantity === 0);
      if (hasZeroQuantity) {
        // Remove all crops with quantity 0
        const result = await Crop.updateOne(
          { _id: documentId },
          { $pull: { crops: { quantity: 0 } } }
        );

        if (result.modifiedCount > 0) {
          console.log(`Removed ${result.modifiedCount} crop(s) with quantity 0 for document ID: ${documentId}`);
        }
      }
    } catch (err) {
      console.error('Error processing change stream:', err);
    }
  });

  // Handle errors in the change stream
  changeStream.on('error', (err) => {
    console.error('Change stream error:', err);
  });

  console.log('Crop collection change stream initialized');
};

// Export the function to be called during server startup
module.exports = watchCropChanges;