const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// MongoDB connection
const MONGODB_URI = 'mongodb+srv://manojkumawat2465_db_user:8kGMjjM66wh3w19s@server.ze020oi.mongodb.net/inventory_management?retryWrites=true&w=majority&appName=server';

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Fabric Schema
const fabricSchema = new mongoose.Schema({
    fabricId: { type: String, required: true, unique: true },
    fabricType: { type: String, required: true },
    color: { type: String, required: true },
    size: {
        length: { type: Number, required: true },
        width: { type: Number, required: true },
        unit: { type: String, default: 'meters' }
    },
    quantity: { type: Number, required: true },
    quality: { type: String, required: true },
    pattern: String,
    supplier: String,
    purchaseDate: { type: Date, default: Date.now },
    pricePerMeter: Number,
    totalPrice: Number,
    location: String,
    status: { type: String, default: 'available' },
    registeredBy: {
        userId: String,
        userName: String,
        role: String
    },
    notes: String,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const Fabric = mongoose.model('Fabric', fabricSchema);

// API Routes

// Get all fabrics
app.get('/api/fabrics', async (req, res) => {
    try {
        const fabrics = await Fabric.find().sort({ createdAt: -1 });
        res.json(fabrics);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get fabric by ID
app.get('/api/fabrics/:id', async (req, res) => {
    try {
        const fabric = await Fabric.findById(req.params.id);
        if (!fabric) {
            return res.status(404).json({ error: 'Fabric not found' });
        }
        res.json(fabric);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Register new fabric
app.post('/api/fabrics', async (req, res) => {
    try {
        // Generate unique fabric ID
        const count = await Fabric.countDocuments();
        const fabricId = `FAB${String(count + 1).padStart(5, '0')}`;
        
        const fabricData = {
            ...req.body,
            fabricId,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        const fabric = new Fabric(fabricData);
        await fabric.save();
        res.status(201).json(fabric);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Update fabric
app.put('/api/fabrics/:id', async (req, res) => {
    try {
        const fabric = await Fabric.findByIdAndUpdate(
            req.params.id,
            { ...req.body, updatedAt: new Date() },
            { new: true, runValidators: true }
        );
        if (!fabric) {
            return res.status(404).json({ error: 'Fabric not found' });
        }
        res.json(fabric);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Delete fabric
app.delete('/api/fabrics/:id', async (req, res) => {
    try {
        const fabric = await Fabric.findByIdAndDelete(req.params.id);
        if (!fabric) {
            return res.status(404).json({ error: 'Fabric not found' });
        }
        res.json({ message: 'Fabric deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get fabric statistics
app.get('/api/fabrics/stats/summary', async (req, res) => {
    try {
        const totalFabrics = await Fabric.countDocuments();
        const totalQuantity = await Fabric.aggregate([
            { $group: { _id: null, total: { $sum: '$quantity' } } }
        ]);
        const fabricsByType = await Fabric.aggregate([
            { $group: { _id: '$fabricType', count: { $sum: 1 } } }
        ]);
        const fabricsByColor = await Fabric.aggregate([
            { $group: { _id: '$color', count: { $sum: 1 } } }
        ]);
        
        res.json({
            totalFabrics,
            totalQuantity: totalQuantity[0]?.total || 0,
            fabricsByType,
            fabricsByColor
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});