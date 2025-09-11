const mongoose = require('mongoose');

const tailorSchema = new mongoose.Schema({
  tailorId: {
    type: String,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  mobile: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  work: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    default: 'active',
    enum: ['active', 'inactive']
  },
  joiningDate: {
    type: Date,
    default: Date.now
  },
  totalOrders: {
    type: Number,
    default: 0
  },
  completedOrders: {
    type: Number,
    default: 0
  },
  pendingOrders: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Generate tailor ID
tailorSchema.pre('save', async function(next) {
  if (!this.tailorId) {
    try {
      const count = await this.constructor.countDocuments();
      this.tailorId = `TLR${String(count + 1).padStart(4, '0')}`;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

module.exports = mongoose.model('Tailor', tailorSchema);