// models/Purchase.js
const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  cropId: { type: mongoose.Schema.Types.ObjectId, required: true },
  cropName: { type: String, required: true },
   image: {
    type: String,
    required: true,
  },
  quantity: { type: Number, required: true, min: 1 },
  unit: { type: String, required: true, enum: ['kg', 'dozen', 'unit'] },
  totalPrice: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['pending', 'confirmed', 'delivered'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Purchase', purchaseSchema);