const mongoose = require('mongoose');

const cropSubSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  unit: {
    type: String,
    required: true,
    enum: ['kg', 'dozen', 'unit'],
  },
  quantity: {
    type: Number,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['vegetables', 'fruits'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const cropSchema = new mongoose.Schema({
  farmerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  farmerName: {
    type: String,
    required: true,
  },
  farmerDetails: {
    aadhaarNumber: { type: String },
    address: { type: String },
    state: { type: String },
    district: { type: String },
    villageMandal: { type: String },
    pincode: { type: String },
    landSize: { type: Number },
    cropsGrown: [{ type: String }],
    irrigationAvailable: { type: Boolean },
    ownTransport: { type: Boolean },
    upiId: { type: String },
    landProofDocument: { type: String },
    status: { type: String, enum: ['pending', 'approved', 'rejected'] },
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
  },
  crops: [cropSubSchema],
});

cropSchema.pre('save', function (next) {
  this.crops.forEach((crop) => {
    crop.updatedAt = Date.now();
  });
  next();
});

module.exports = mongoose.model('Crop', cropSchema);