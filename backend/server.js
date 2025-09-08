require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI;

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
    quantity: { type: Number, default: 1 },
    remainingArea: { type: Number }, // Track remaining area after cutting
    originalArea: { type: Number }, // Store original total area
    quality: { type: String, default: 'Standard' },
    pattern: { type: String, default: 'Plain' },
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

// Cutting Record Schema
const cuttingSchema = new mongoose.Schema({
    cuttingId: { type: String, required: true, unique: true },
    fabricId: { type: String, required: true },
    fabricType: { type: String, required: true },
    fabricColor: { type: String, required: true },
    originalSize: {
        length: { type: Number, required: true },
        width: { type: Number, required: true },
        unit: { type: String, default: 'meters' }
    },
    pieceSize: {
        length: { type: Number, required: true },
        width: { type: Number, required: true },
        unit: { type: String, default: 'meters' }
    },
    numberOfPieces: { type: Number, required: true },
    totalPiecesGenerated: { type: Number, required: true },
    wastePercentage: { type: Number, default: 0 },
    productType: { type: String, required: true },
    productDescription: String,
    cuttingDate: { type: Date, default: Date.now },
    cuttingBy: {
        userId: String,
        userName: String,
        role: String
    },
    status: { type: String, default: 'completed' },
    notes: String,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const Cutting = mongoose.model('Cutting', cuttingSchema);

// Product Schema
const productSchema = new mongoose.Schema({
    productId: { type: String, required: true, unique: true },
    productName: { type: String, required: true },
    productType: { type: String, required: true },
    cuttingId: { type: String, required: true },
    fabricId: { type: String, required: true },
    fabricType: { type: String, required: true },
    fabricColor: { type: String, required: true },
    dimensions: {
        length: { type: Number, required: true },
        width: { type: Number, required: true },
        unit: { type: String, default: 'meters' }
    },
    quantity: { type: Number, default: 1 },
    status: { type: String, default: 'cut_pieces' },
    cuttingDate: { type: Date, default: Date.now },
    location: String,
    notes: String,
    createdBy: {
        userId: String,
        userName: String,
        role: String
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const Product = mongoose.model('Product', productSchema);

// Manufacturing Schema - for tracking manufactured products
const manufacturingSchema = new mongoose.Schema({
    manufacturingId: { type: String, required: true, unique: true },
    productId: { type: String, required: true }, // Reference to cut product
    productType: { type: String, required: true }, // Shirt, Pant, Kurta, Bikini, etc.
    productName: { type: String, required: true },
    size: { type: String, required: true }, // S, M, L, XL, XXL, Custom, etc.
    customSizeDetails: { type: String }, // Additional details for custom sizes
    quantity: { type: Number, required: true, default: 1 },
    color: { type: String, required: true },
    fabricType: { type: String, required: true },
    fabricId: { type: String, required: true }, // Original fabric ID
    tailorName: { type: String, required: true },
    qrCode: { type: String }, // QR code data URL
    manufacturingDate: { type: Date, default: Date.now },
    completionDate: { type: Date },
    qualityCheck: {
        checked: { type: Boolean, default: false },
        checkedBy: { type: String },
        checkedDate: { type: Date },
        rating: { type: Number }, // 1-5
        notes: { type: String }
    },
    notes: { type: String },
    images: [{ type: String }], // URLs to product images
    createdBy: {
        userId: { type: String },
        userName: { type: String },
        role: { type: String }
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const Manufacturing = mongoose.model('Manufacturing', manufacturingSchema);

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
        
        // Calculate total area from dimensions and quantity
        const length = req.body.size?.length || 0;
        const width = req.body.size?.width || 0;
        const quantity = req.body.quantity || 1;
        const totalArea = length * width * quantity;
        
        const fabricData = {
            ...req.body,
            fabricId,
            originalArea: totalArea,
            remainingArea: totalArea, // Initially, remaining area equals total area
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

// Cutting API Routes

// Get all cutting records
app.get('/api/cuttings', async (req, res) => {
    try {
        const cuttings = await Cutting.find().sort({ createdAt: -1 });
        res.json(cuttings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get cutting by ID
app.get('/api/cuttings/:id', async (req, res) => {
    try {
        const cutting = await Cutting.findById(req.params.id);
        if (!cutting) {
            return res.status(404).json({ error: 'Cutting record not found' });
        }
        res.json(cutting);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create new cutting record
app.post('/api/cuttings', async (req, res) => {
    try {
        // Generate unique cutting ID
        const count = await Cutting.countDocuments();
        const cuttingId = `CUT${String(count + 1).padStart(5, '0')}`;
        
        // Get fabric details
        const fabric = await Fabric.findOne({ fabricId: req.body.fabricId });
        if (!fabric) {
            return res.status(404).json({ error: 'Fabric not found' });
        }
        
        // Calculate area used for cutting
        const pieceLength = req.body.pieceSize?.length || 0;
        const pieceWidth = req.body.pieceSize?.width || 0;
        const numberOfPieces = req.body.numberOfPieces || 0;
        const totalAreaUsed = pieceLength * pieceWidth * numberOfPieces;
        
        // Check if enough area is available
        const currentRemainingArea = fabric.remainingArea || (fabric.size.length * fabric.size.width * fabric.quantity);
        if (totalAreaUsed > currentRemainingArea) {
            return res.status(400).json({ error: `Insufficient fabric area. Available: ${currentRemainingArea.toFixed(2)} m², Required: ${totalAreaUsed.toFixed(2)} m²` });
        }
        
        // Update fabric remaining area and status
        fabric.remainingArea = currentRemainingArea - totalAreaUsed;
        
        // Update status based on remaining area
        if (fabric.remainingArea > 0) {
            fabric.status = 'updated';
        } else {
            fabric.status = 'out_of_stock';
        }
        
        await fabric.save();
        
        const cuttingData = {
            ...req.body,
            cuttingId,
            totalAreaUsed, // Store the area used
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        const cutting = new Cutting(cuttingData);
        await cutting.save();
        res.status(201).json(cutting);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Product API Routes

// Get all products
app.get('/api/products', async (req, res) => {
    try {
        const products = await Product.find().sort({ createdAt: -1 });
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get product by ID
app.get('/api/products/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json(product);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create new product
app.post('/api/products', async (req, res) => {
    try {
        // Generate unique product ID
        const count = await Product.countDocuments();
        const productId = `PRD${String(count + 1).padStart(5, '0')}`;
        
        const productData = {
            ...req.body,
            productId,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        const product = new Product(productData);
        await product.save();
        res.status(201).json(product);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Update product
app.put('/api/products/:id', async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            { ...req.body, updatedAt: new Date() },
            { new: true, runValidators: true }
        );
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json(product);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Delete product
app.delete('/api/products/:id', async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get product statistics
app.get('/api/products/stats/summary', async (req, res) => {
    try {
        const totalProducts = await Product.countDocuments();
        const productsByStatus = await Product.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);
        const productsByType = await Product.aggregate([
            { $group: { _id: '$productType', count: { $sum: 1 } } }
        ]);
        
        res.json({
            totalProducts,
            productsByStatus,
            productsByType
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Manufacturing API Routes

// Get all manufactured products
app.get('/api/manufacturing', async (req, res) => {
    try {
        const products = await Manufacturing.find().sort({ createdAt: -1 });
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get manufactured product by ID
app.get('/api/manufacturing/:id', async (req, res) => {
    try {
        const product = await Manufacturing.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ error: 'Manufactured product not found' });
        }
        res.json(product);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create new manufactured product
app.post('/api/manufacturing', async (req, res) => {
    try {
        // Generate unique manufacturing ID
        const count = await Manufacturing.countDocuments();
        const manufacturingId = `MFG${String(count + 1).padStart(5, '0')}`;
        
        const manufacturingData = {
            ...req.body,
            manufacturingId,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        // Calculate profit if prices are provided
        if (manufacturingData.price?.manufacturingCost && manufacturingData.price?.sellingPrice) {
            manufacturingData.price.profit = manufacturingData.price.sellingPrice - manufacturingData.price.manufacturingCost;
        }
        
        const manufacturing = new Manufacturing(manufacturingData);
        await manufacturing.save();
        
        // Update product status if needed
        if (req.body.productId) {
            await Product.findOneAndUpdate(
                { productId: req.body.productId },
                { status: 'in_manufacturing' }
            );
        }
        
        res.status(201).json(manufacturing);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Update manufactured product
app.put('/api/manufacturing/:id', async (req, res) => {
    try {
        const manufacturing = await Manufacturing.findByIdAndUpdate(
            req.params.id,
            { ...req.body, updatedAt: new Date() },
            { new: true, runValidators: true }
        );
        if (!manufacturing) {
            return res.status(404).json({ error: 'Manufactured product not found' });
        }
        res.json(manufacturing);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Delete manufactured product
app.delete('/api/manufacturing/:id', async (req, res) => {
    try {
        const manufacturing = await Manufacturing.findByIdAndDelete(req.params.id);
        if (!manufacturing) {
            return res.status(404).json({ error: 'Manufactured product not found' });
        }
        res.json({ message: 'Manufactured product deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get manufacturing statistics
app.get('/api/manufacturing/stats/summary', async (req, res) => {
    try {
        const totalManufactured = await Manufacturing.countDocuments();
        const inProduction = await Manufacturing.countDocuments({ status: 'in_production' });
        const completed = await Manufacturing.countDocuments({ status: 'completed' });
        const delivered = await Manufacturing.countDocuments({ status: 'delivered' });
        
        const productsByType = await Manufacturing.aggregate([
            { $group: { _id: '$productType', count: { $sum: 1 } } }
        ]);
        
        const productsBySize = await Manufacturing.aggregate([
            { $group: { _id: '$size', count: { $sum: 1 } } }
        ]);
        
        res.json({
            totalManufactured,
            inProduction,
            completed,
            delivered,
            productsByType,
            productsBySize
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});