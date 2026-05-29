// controllers/cropController.js
const { body, validationResult } = require('express-validator');
const Crop = require('../models/Crop');

// Haversine formula to calculate distance between two points (in kilometers)
const getDistance = (lat1, lon1, lat2, lon2) => {
  const toRad = (value) => (value * Math.PI) / 180;
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

exports.getNearbyCrops = [
  body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude is required'),
  body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude is required'),
  body('maxDistance').optional().isInt({ min: 1 }).withMessage('Max distance must be a positive integer (in kilometers)'),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { latitude, longitude, maxDistance = 50 } = req.body; // Default maxDistance to 50km

    try {
      // Fetch all crops where farmer status is 'approved'
      const crops = await Crop.find({ 'farmerDetails.status': 'approved' });

      // Filter crops by distance and enrich with distance data
      const nearbyCrops = crops
        .map((cropDoc) => {
          const farmerLat = cropDoc.farmerDetails.latitude;
          const farmerLon = cropDoc.farmerDetails.longitude;

          // Skip if farmer's coordinates are missing or invalid
          if (!farmerLat || !farmerLon) return null;

          // Calculate distance
          const distance = getDistance(
            parseFloat(latitude),
            parseFloat(longitude),
            parseFloat(farmerLat),
            parseFloat(farmerLon)
          );

          // Return crops within maxDistance
          if (distance <= maxDistance) {
            return {
              farmerId: cropDoc.farmerId,
              farmerName: cropDoc.farmerName,
              farmerDetails: cropDoc.farmerDetails,
              crops: cropDoc.crops.map((crop) => ({
                ...crop.toObject(),
                distance: distance.toFixed(2) // Add distance to each crop
              }))
            };
          }
          return null;
        })
        .filter((crop) => crop !== null) // Remove null entries
        .sort((a, b) => {
          // Sort by shortest distance (using the minimum distance of crops for each farmer)
          const minDistanceA = Math.min(...a.crops.map((c) => parseFloat(c.distance)));
          const minDistanceB = Math.min(...b.crops.map((c) => parseFloat(c.distance)));
          return minDistanceA - minDistanceB;
        });

      res.json({ crops: nearbyCrops });
    } catch (err) {
      console.error('Error fetching nearby crops:', err);
      res.status(500).json({ message: 'Server error' });
    }
  }
];