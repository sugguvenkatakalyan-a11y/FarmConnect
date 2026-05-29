const express = require("express");
const {
  getAllUsers,
  getAllFarmers,
  getFarmerById,
  approveFarmer,
  rejectFarmer,
  getAllCrops,
  getAllCustomers,
  getAllPurchases,
  getDashboardStats,
} = require("../controllers/adminController");

const auth = require("../middleware/auth");

const router = express.Router();

// Test route
router.get("/test", auth(["admin"]), (req, res) => {
  res.json({ message: "Admin test route working", user: req.user });
});

// Database test route
router.get("/db-test", auth(["admin"]), async (req, res) => {
  try {
    const User = require("../models/User");
    const Farmer = require("../models/Farmer");

    const userCount = await User.countDocuments();
    const farmerCount = await Farmer.countDocuments();

    res.json({
      message: "Database test successful",
      userCount,
      farmerCount,
      user: req.user,
    });
  } catch (error) {
    res.status(500).json({
      message: "Database test failed",
      error: error.message,
    });
  }
});

// Admin routes - using auth middleware with 'admin' role
router.get("/users", auth(["admin"]), getAllUsers);
router.get("/farmers", auth(["admin"]), getAllFarmers);
router.get("/farmer/:id", auth(["admin"]), getFarmerById);
router.post("/farmer/:id/approve", auth(["admin"]), approveFarmer);
router.post("/farmer/:id/reject", auth(["admin"]), rejectFarmer);

// Additional admin routes
router.get("/dashboard", auth(["admin"]), getDashboardStats);
router.get("/crops", auth(["admin"]), getAllCrops);
router.get("/customers", auth(["admin"]), getAllCustomers);
router.get("/purchases", auth(["admin"]), getAllPurchases);

module.exports = router;
