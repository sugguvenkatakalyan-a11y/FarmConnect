const User = require("../models/User");
const Farmer = require("../models/Farmer");
const Crop = require("../models/Crop");
const Purchase = require("../models/Purchase");

exports.getAllUsers = async (req, res) => {
  try {
    console.log("getAllUsers called by user:", req.user); // Debug log
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    console.error("getAllUsers error:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.getAllFarmers = async (req, res) => {
  try {
    console.log("getAllFarmers called by user:", req.user); // Debug log

    // First, let's try to get farmers without populate to see if basic query works
    const farmersCount = await Farmer.countDocuments();
    console.log("Total farmers in database:", farmersCount);

    if (farmersCount === 0) {
      console.log("No farmers found in database");
      return res.json([]);
    }

    const farmers = await Farmer.find().populate("userId", "name email");
    console.log("Farmers fetched successfully, count:", farmers.length);
    res.json(farmers);
  } catch (err) {
    console.error("getAllFarmers error:", err);
    res.status(500).json({ message: err.message, error: err.toString() });
  }
};

exports.getAllCrops = async (req, res) => {
  try {
    console.log("getAllCrops called by user:", req.user); // Debug log
    const cropsCount = await Crop.countDocuments();
    console.log("Total crops in database:", cropsCount);

    if (cropsCount === 0) {
      console.log("No crops found in database");
      return res.json([]);
    }

    // Since farmerId references User, not Farmer
    const crops = await Crop.find().populate("farmerId", "name email");
    console.log("Crops fetched successfully, count:", crops.length);
    res.json(crops);
  } catch (err) {
    console.error("getAllCrops error:", err);
    // Return empty array instead of error if no crops exist
    if (
      err.name === "CastError" ||
      err.message.includes("Cast to ObjectId failed")
    ) {
      return res.json([]);
    }
    res.status(500).json({ message: err.message, error: err.toString() });
  }
};

exports.getAllCustomers = async (req, res) => {
  try {
    console.log("getAllCustomers called by user:", req.user); // Debug log
    const customers = await User.find({ role: "customer" }).select("-password");
    console.log("Customers fetched successfully, count:", customers.length);
    res.json(customers);
  } catch (err) {
    console.error("getAllCustomers error:", err);
    res.status(500).json({ message: err.message, error: err.toString() });
  }
};

exports.getAllPurchases = async (req, res) => {
  try {
    console.log("getAllPurchases called by user:", req.user); // Debug log
    const purchasesCount = await Purchase.countDocuments();
    console.log("Total purchases in database:", purchasesCount);

    if (purchasesCount === 0) {
      console.log("No purchases found in database");
      return res.json([]);
    }

    // Both farmerId and customerId reference User model
    const purchases = await Purchase.find()
      .populate("farmerId", "name email")
      .populate("customerId", "name email");
    console.log("Purchases fetched successfully, count:", purchases.length);
    res.json(purchases);
  } catch (err) {
    console.error("getAllPurchases error:", err);
    // Return empty array instead of error if no purchases exist
    if (
      err.name === "CastError" ||
      err.message.includes("Cast to ObjectId failed")
    ) {
      return res.json([]);
    }
    res.status(500).json({ message: err.message, error: err.toString() });
  }
};

exports.getFarmerById = async (req, res) => {
  try {
    const farmer = await Farmer.findById(req.params.id).populate(
      "userId",
      "name email"
    );
    if (!farmer) return res.status(404).json({ message: "Farmer not found" });
    res.json(farmer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.approveFarmer = async (req, res) => {
  try {
    const farmer = await Farmer.findById(req.params.id);
    if (!farmer) return res.status(404).json({ message: "Farmer not found" });
    farmer.status = "approved";
    await farmer.save();
    res.json({ message: "Farmer approved" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.rejectFarmer = async (req, res) => {
  try {
    const farmer = await Farmer.findById(req.params.id);
    if (!farmer) return res.status(404).json({ message: "Farmer not found" });
    farmer.status = "rejected";
    await farmer.save();
    res.json({ message: "Farmer rejected" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    console.log("getDashboardStats called by user:", req.user);

    // Get counts
    const totalUsers = await User.countDocuments();
    const totalFarmers = await Farmer.countDocuments();
    const totalCrops = await Crop.countDocuments();
    const totalPurchases = await Purchase.countDocuments();

    // Get customers (users who are not farmers and not admins)
    const farmerUserIds = await Farmer.find().distinct("userId");
    const totalCustomers = await User.countDocuments({
      _id: { $nin: farmerUserIds },
      role: { $ne: "admin" },
    });

    // Get pending registrations
    const pendingRegistrations = await Farmer.countDocuments({
      status: "pending",
    });

    // Calculate revenue (sum of all purchases)
    const revenueAgg = await Purchase.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalPrice" },
        },
      },
    ]);

    const totalRevenue = revenueAgg.length > 0 ? revenueAgg[0].totalRevenue : 0;

    // Get recent activities (last 10 activities)
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("name email createdAt role");

    const recentPurchases = await Purchase.find()
      .populate("customerId", "name email")
      .populate("farmerId", "name email")
      .sort({ createdAt: -1 })
      .limit(5);

    // Format recent activities
    const recentActivities = [];

    // Add recent user registrations
    recentUsers.forEach((user) => {
      recentActivities.push({
        id: user._id,
        user: user.name || user.email,
        action:
          user.role === "farmer"
            ? "registered as farmer"
            : "registered as customer",
        time: getTimeAgo(user.createdAt),
      });
    });

    // Add recent purchases
    recentPurchases.forEach((purchase) => {
      recentActivities.push({
        id: purchase._id,
        user:
          purchase.customerId?.name || purchase.customerId?.email || "Unknown",
        action: `purchased ${purchase.quantity} ${purchase.unit} ${purchase.cropName}`,
        amount: `₹${purchase.totalPrice}`,
        time: getTimeAgo(purchase.createdAt),
      });
    });

    // Sort activities by most recent and limit to 8
    recentActivities.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
    const limitedActivities = recentActivities.slice(0, 8);

    // Calculate some basic stats
    const stats = [
      {
        name: "Active Farmers",
        value: await Farmer.countDocuments({ status: "approved" }),
        change: 5.2,
        positive: true,
      },
      {
        name: "Avg. Order Value",
        value:
          totalPurchases > 0
            ? `₹${Math.round(totalRevenue / totalPurchases)}`
            : "₹0",
        change: 3.1,
        positive: true,
      },
      {
        name: "Pending Actions",
        value: pendingRegistrations.toString(),
        change: -2.4,
        positive: false,
      },
    ];

    const dashboardData = {
      totalFarmers,
      totalCustomers,
      totalCrops,
      totalPurchases,
      pendingRegistrations,
      revenue: {
        currentMonth: totalRevenue,
        previousMonth: Math.round(totalRevenue * 0.8), // Mock previous month
        change: 25.0, // Mock change percentage
      },
      recentActivities: limitedActivities,
      stats,
    };

    console.log("Dashboard stats calculated successfully:", {
      totalUsers,
      totalFarmers,
      totalCustomers,
      totalCrops,
      totalPurchases,
      totalRevenue,
    });

    res.json(dashboardData);
  } catch (err) {
    console.error("getDashboardStats error:", err);
    res.status(500).json({ message: err.message, error: err.toString() });
  }
};

// Helper function to calculate time ago
function getTimeAgo(date) {
  const now = new Date();
  const diffInMs = now - new Date(date);
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInDays > 0) {
    return diffInDays === 1 ? "1 day ago" : `${diffInDays} days ago`;
  } else if (diffInHours > 0) {
    return diffInHours === 1 ? "1 hour ago" : `${diffInHours} hours ago`;
  } else {
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    return diffInMinutes < 1 ? "Just now" : `${diffInMinutes} minutes ago`;
  }
}
