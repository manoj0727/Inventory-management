const mongoose = require('mongoose');

const tailorAssignmentSchema = new mongoose.Schema({
    assignmentId: {
        type: String,
        required: true,
        unique: true,
        default: () => 'TAILOR-' + Date.now()
    },
    tailorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true
    },
    cuttingRecordId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CuttingRecord',
        required: true
    },
    productType: {
        type: String,
        required: true,
        enum: ['Shirt', 'Pant', 'Dress', 'Suit', 'Jacket', 'Skirt', 'Other']
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    deadline: {
        type: Date,
        required: true
    },
    priority: {
        type: String,
        default: 'normal',
        enum: ['low', 'normal', 'high', 'urgent']
    },
    status: {
        type: String,
        default: 'assigned',
        enum: ['assigned', 'in_progress', 'completed', 'delayed', 'rejected']
    },
    startedAt: Date,
    completedAt: Date,
    completedQuantity: {
        type: Number,
        default: 0
    },
    qualityCheck: {
        checked: { type: Boolean, default: false },
        checkedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
        checkedAt: Date,
        status: { type: String, enum: ['passed', 'failed', 'rework'] },
        notes: String
    },
    payment: {
        ratePerPiece: { type: Number, default: 0 },
        totalAmount: { type: Number, default: 0 },
        paid: { type: Boolean, default: false },
        paidAt: Date
    },
    notes: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

tailorAssignmentSchema.methods.calculatePayment = function() {
    this.payment.totalAmount = this.completedQuantity * this.payment.ratePerPiece;
    return this.payment.totalAmount;
};

module.exports = mongoose.model('TailorAssignment', tailorAssignmentSchema);