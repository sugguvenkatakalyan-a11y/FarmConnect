const mongoose = require('mongoose');
const Purchase = require('../models/Purchase');


exports.getFarmerPurchases = async (req, res) => {
  const { farmerId } = req.params;

  try {
    // Validate farmerId format
    if (!mongoose.Types.ObjectId.isValid(farmerId)) {
      return res.status(400).json({ message: 'Invalid farmer ID format' });
    }

    // Fetch all purchases for the farmerId and populate customer details
    const purchases = await Purchase.find({ farmerId })
      .populate('customerId', 'name email');

    // Generate summary statistics with image
    const summary = await Purchase.aggregate([
      { $match: { farmerId: new mongoose.Types.ObjectId(farmerId) } },
      {
        $group: {
          _id: '$cropName',
          totalQuantity: { $sum: '$quantity' },
          totalRevenue: { $sum: '$totalPrice' },
          purchaseCount: { $sum: 1 },
          image: { $first: '$image' }, // Include image from Purchase document
        },
      },
      { $sort: { totalRevenue: -1 } },
    ]);

    // Prepare response
    const response = {
      purchases: purchases.map(purchase => ({
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
        createdAt: purchase.createdAt,
        image: purchase.image,
      })),
      summary: summary.map(stat => ({
        cropName: stat._id,
        totalQuantity: stat.totalQuantity,
        totalRevenue: stat.totalRevenue,
        purchaseCount: stat.purchaseCount,
        image: stat.image, // Include image in summary
      })),
      totalPurchases: purchases.length,
    };

    res.status(200).json(response);
  } catch (err) {
    console.error('Error fetching farmer purchases:', err);
    res.status(500).json({ message: 'Server error' });
  }
};


exports.updatePurchaseStatus = async (req, res) => {
  const { purchaseId } = req.params;
  const { status } = req.body;

  try {
    // Validate purchaseId format
    if (!mongoose.Types.ObjectId.isValid(purchaseId)) {
      return res.status(400).json({ message: 'Invalid purchase ID format' });
    }

    // Validate status
    if (!['confirmed', 'delivered'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be "confirmed" or "delivered"' });
    }

    // Find the purchase
    const purchase = await Purchase.findById(purchaseId);
    if (!purchase) {
      return res.status(404).json({ message: 'Purchase not found' });
    }

    // Prevent updating status backward (e.g., from delivered to confirmed or pending)
    if (purchase.status === 'delivered' || 
        (purchase.status === 'confirmed' && status === 'pending')) {
      return res.status(400).json({ message: 'Cannot revert purchase status' });
    }

    // Update the status
    purchase.status = status;
    await purchase.save();

    res.status(200).json({ 
      message: 'Purchase status updated successfully',
      purchase: {
        purchaseId: purchase._id,
        status: purchase.status
      }
    });
  } catch (err) {
    console.error('Error updating purchase status:', err);
    res.status(500).json({ message: 'Server error' });
  }
};