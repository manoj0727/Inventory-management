const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
    employeeId: {
        type: String,
        required: true,
        unique: true,
        default: () => 'EMP-' + Date.now()
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    phone: {
        type: String,
        required: true
    },
    role: {
        type: String,
        required: true,
        enum: ['admin', 'manager', 'cutter', 'tailor', 'quality_checker', 'warehouse']
    },
    department: {
        type: String,
        required: true,
        enum: ['Fabric Entry', 'Cutting', 'Tailoring', 'Quality', 'Warehouse', 'Management']
    },
    skills: [{
        type: String
    }],
    experience: {
        type: Number,
        default: 0
    },
    joiningDate: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        default: 'active',
        enum: ['active', 'inactive', 'on_leave', 'terminated']
    },
    workingHours: {
        start: { type: String, default: '09:00' },
        end: { type: String, default: '18:00' }
    },
    performance: {
        tasksCompleted: { type: Number, default: 0 },
        averageQuality: { type: Number, default: 0, min: 0, max: 5 },
        punctuality: { type: Number, default: 0, min: 0, max: 5 }
    },
    address: {
        street: String,
        city: String,
        state: String,
        zipCode: String
    },
    emergencyContact: {
        name: String,
        relationship: String,
        phone: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Employee', employeeSchema);