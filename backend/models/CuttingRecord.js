const mongoose = require('mongoose');

const cuttingRecordSchema = new mongoose.Schema({
    cuttingId: {
        type: String,
        required: true,
        unique: true,
        default: () => 'CUT-' + Date.now()
    },
    fabricId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Fabric',
        required: true
    },
    employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true
    },
    quantityCut: {
        type: Number,
        required: true,
        min: 0
    },
    numberOfPieces: {
        type: Number,
        required: true,
        min: 1
    },
    pieceSize: {
        length: { type: Number, required: true },
        width: { type: Number, required: true },
        unit: { type: String, default: 'cm' }
    },
    pattern: {
        type: String,
        required: true
    },
    wastage: {
        type: Number,
        default: 0,
        min: 0
    },
    status: {
        type: String,
        default: 'cut',
        enum: ['cutting', 'cut', 'assigned_to_tailor', 'completed']
    },
    notes: String,
    cuttingDate: {
        type: Date,
        default: Date.now
    },
    assignedToTailor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tailor',
        default: null
    }
});

module.exports = mongoose.model('CuttingRecord', cuttingRecordSchema);