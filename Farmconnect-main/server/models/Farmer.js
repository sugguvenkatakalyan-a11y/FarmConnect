const mongoose = require('mongoose');

const farmerSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  aadhaarNumber: { type: String, required: true, unique: true, match: /^\d{12}$/ }, 
  address: { type: String, required: true },
  state: { type: String, required: true },
  district: { type: String, required: true },
  villageMandal: { type: String, required: true },
  pincode: { type: String, required: true, match: /^\d{6}$/ },
  landSize: { type: Number, default: null },
  cropsGrown: { type: [String], required: true },
  irrigationAvailable: { type: Boolean, required: true },
  ownTransport: { type: Boolean, default: null },
  upiId: { type: String, required: true, match: /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/ },
  landProofDocument: { type: String, required: true }, // Cloudinary URL
  latitude: { type: Number, default: null },
  longitude: { type: Number, default: null },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Farmer', farmerSchema);