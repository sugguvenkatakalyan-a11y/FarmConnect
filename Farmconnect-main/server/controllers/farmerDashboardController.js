const mongoose = require('mongoose');
const Crop = require('../models/Crop');
const Purchase = require('../models/Purchase');

exports.getFarmerDashboard = async (req, res) => {
  const { farmerId } = req.params;

  try {
    // Validate farmerId format
    if (!mongoose.Types.ObjectId.isValid(farmerId)) {
      return res.status(400).json({ message: 'Invalid farmer ID format' });
    }

    // Fetch crop data for the farmer (single document)
    const cropData = await Crop.findOne({ farmerId })
      .select('farmerName farmerDetails crops')
      .lean();

    if (!cropData) {
      return res.status(404).json({ message: 'No crop data found for this farmer' });
    }

    const crops = cropData.crops || [];

    // Fetch purchases for the farmer and populate customer details
    const purchases = await Purchase.find({ farmerId })
      .populate('customerId', 'name email')
      .sort({ createdAt: -1 });

    // Filter delivered purchases
    const deliveredPurchases = purchases.filter(purchase => purchase.status === 'delivered');

    // Aggregate summary for delivered purchases
    const summary = await Purchase.aggregate([
      {
        $match: {
          farmerId: new mongoose.Types.ObjectId(farmerId),
          status: 'delivered',
        },
      },
      {
        $group: {
          _id: '$cropName',
          totalQuantity: { $sum: '$quantity' },
          totalRevenue: { $sum: '$totalPrice' },
          purchaseCount: { $sum: 1 },
          image: { $first: '$image' }, // Include image from the first purchase
        },
      },
      {
        $sort: { totalRevenue: -1 },
      },
    ]);

    // Calculate stats
    const totalSales = deliveredPurchases.length;
    const totalRevenue = summary.reduce((sum, stat) => sum + stat.totalRevenue, 0);
    const totalQuantitySold = summary.reduce((sum, stat) => sum + stat.totalQuantity, 0);
    const cropVarietiesSold = new Set(summary.map(stat => stat._id)).size;
    const cropVarietiesListed = new Set(crops.map(crop => crop.name)).size;

    // Prepare farmer info
    const farmerInfo = {
      name: cropData.farmerName || 'Farmer',
      location: cropData.farmerDetails?.address || cropData.farmerDetails?.villageMandal || 'Unknown Location',
    };

    // Prepare response
    const response = {
      farmerInfo,
      crops: crops.map(crop => ({
        _id: crop._id,
        name: crop.name,
        type: crop.type,
        quantity: crop.quantity,
        unit: crop.unit,
        price: crop.price,
        image: crop.image,
        createdAt: crop.createdAt,
      })),
      purchases: deliveredPurchases.map(purchase => ({
        purchaseId: purchase._id,
        customerId: purchase.customerId._id,
        customerName: purchase.customerId.name,
        customerEmail: purchase.customerId.email,
        cropId: purchase.cropId,
        cropName: purchase.cropName,
        quantity: purchase.quantity,
        unit: purchase.unit,
        totalPrice: purchase.totalPrice,
        status: purchase.status,
        image: purchase.image,
        createdAt: purchase.createdAt,
      })),
      summary: summary.map(stat => ({
        cropName: stat._id,
        totalQuantity: stat.totalQuantity,
        totalRevenue: stat.totalRevenue,
        purchaseCount: stat.purchaseCount,
        image: stat.image,
      })),
      stats: {
        totalSales,
        totalRevenue,
        totalQuantitySold,
        cropVarietiesSold,
        cropVarietiesListed,
      },
    };

    res.status(200).json(response);
  } catch (err) {
    console.error('Error fetching farmer dashboard data:', err);
    res.status(500).json({ message: 'Server error' });
  }
};