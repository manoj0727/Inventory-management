const mongoose = require('mongoose');

const fabricSchema = new mongoose.Schema({
    fabricId: {
        type: String,
        required: true,
        unique: true,
        default: () => 'FAB-' + Date.now()
    },
    name: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: ['Cotton', 'Silk', 'Wool', 'Polyester', 'Linen', 'Denim', 'Velvet', 'Other']
    },
    color: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 0
    },
    unit: {
        type: String,
        default: 'meters',
        enum: ['meters', 'yards', 'rolls', 'pieces']
    },
    pricePerUnit: {
        type: Number,
        required: true,
        min: 0
    },
    supplier: {
        type: String,
        required: true
    },
    enteredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true
    },
    status: {
        type: String,
        default: 'available',
        enum: ['available', 'in_cutting', 'cut', 'assigned', 'completed']
    },
    location: {
        type: String,
        default: 'Warehouse'
    },
    minStockLevel: {
        type: Number,
        default: 10
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

fabricSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Fabric', fabricSchema);