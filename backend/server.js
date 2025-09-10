require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from frontend directory
app.use(express.static(path.join(__dirname, '../frontend')));

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

// Transaction Schema - for tracking all inventory transactions
const transactionSchema = new mongoose.Schema({
    transactionId: { type: String, required: true, unique: true },
    type: { type: String, required: true, enum: ['stock_in', 'stock_out', 'manufacturing', 'adjustment'] },
    itemType: { type: String, required: true, enum: ['fabric', 'product', 'manufactured'] },
    itemId: { type: String, required: true },
    itemName: { type: String, required: true },
    quantity: { type: Number, required: true },
    previousQuantity: { type: Number, required: true },
    newQuantity: { type: Number, required: true },
    reason: { type: String, required: true },
    performedBy: {
        userId: String,
        userName: String,
        role: String
    },
    timestamp: { type: Date, default: Date.now },
    notes: String,
    relatedItemDetails: {
        fabricType: String,
        color: String,
        size: String,
        productType: String
    }
});

const Transaction = mongoose.model('Transaction', transactionSchema);

// Employee Schema - for employee management
const employeeSchema = new mongoose.Schema({
    employeeId: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    email: String,
    phone: String,
    department: String,
    position: String,
    joinDate: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
    faceDescriptor: [Number], // Store face encoding data
    profilePhoto: String, // Base64 encoded image
    createdAt: { type: Date, default: Date.now },
    createdBy: {
        userId: String,
        userName: String,
        role: String
    }
});

const Employee = mongoose.model('Employee', employeeSchema);

// Attendance Schema - for daily attendance tracking
const attendanceSchema = new mongoose.Schema({
    attendanceId: { type: String, required: true, unique: true },
    employeeId: { type: String, required: true },
    employeeName: { type: String, required: true },
    date: { type: String, required: true }, // YYYY-MM-DD format
    checkIn: Date,
    checkOut: Date,
    status: { type: String, enum: ['P', 'A', 'L', 'H'], default: 'A' }, // P=Present, A=Absent, L=Late, H=Holiday
    workingHours: Number,
    notes: String,
    faceMatchConfidence: Number, // Face recognition confidence score
    location: String,
    createdAt: { type: Date, default: Date.now }
});

// Ensure unique attendance per employee per day
attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

const Attendance = mongoose.model('Attendance', attendanceSchema);

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
        
        // Record transaction for fabric registration
        await createTransaction(
            'stock_in',
            'fabric',
            fabricId,
            `${fabricData.fabricType} - ${fabricData.color}`,
            quantity,
            0,
            quantity,
            `Fabric registration: New fabric added to inventory`,
            fabricData.registeredBy || { userId: 'system', userName: 'System', role: 'admin' },
            `Fabric dimensions: ${length}x${width}${fabricData.size?.unit || 'meters'}, Total area: ${totalArea}`,
            {
                fabricType: fabricData.fabricType,
                color: fabricData.color,
                size: `${length}x${width}${fabricData.size?.unit || 'meters'}`
            }
        );
        
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
        
        // Update product inventory - subtract the manufactured quantity
        if (req.body.productId) {
            const product = await Product.findOne({ productId: req.body.productId });
            
            if (product) {
                const manufacturingQty = req.body.quantity || 1;
                const previousQty = product.quantity;
                const newQuantity = product.quantity - manufacturingQty;
                
                if (newQuantity <= 0) {
                    // Set quantity to 0 and mark as out of stock (but don't delete from DB)
                    await Product.findOneAndUpdate(
                        { productId: req.body.productId },
                        { 
                            quantity: 0,
                            status: 'out_of_stock',
                            updatedAt: new Date()
                        }
                    );
                    
                    // Record transaction for complete stock usage
                    await createTransaction(
                        'manufacturing',
                        'product',
                        product.productId,
                        `${product.productType} - ${product.productName}`,
                        previousQty, // Used all remaining quantity
                        previousQty,
                        0,
                        `Manufacturing: ${manufacturingData.productName} (${manufacturingId})`,
                        manufacturingData.createdBy,
                        'Product completely used in manufacturing',
                        {
                            fabricType: product.fabricType,
                            color: product.fabricColor,
                            productType: product.productType
                        }
                    );
                } else {
                    // Update quantity and mark as updated
                    await Product.findOneAndUpdate(
                        { productId: req.body.productId },
                        { 
                            quantity: newQuantity,
                            status: 'updated',
                            updatedAt: new Date()
                        }
                    );
                    
                    // Record transaction for partial stock usage
                    await createTransaction(
                        'manufacturing',
                        'product',
                        product.productId,
                        `${product.productType} - ${product.productName}`,
                        manufacturingQty,
                        previousQty,
                        newQuantity,
                        `Manufacturing: ${manufacturingData.productName} (${manufacturingId})`,
                        manufacturingData.createdBy,
                        'Product used in manufacturing',
                        {
                            fabricType: product.fabricType,
                            color: product.fabricColor,
                            productType: product.productType
                        }
                    );
                }
                
                // Also record the creation of the manufactured product
                await createTransaction(
                    'manufacturing',
                    'manufactured',
                    manufacturingId,
                    `${manufacturingData.productType} - ${manufacturingData.productName}`,
                    manufacturingQty,
                    0,
                    manufacturingQty,
                    `Manufacturing: Product created from ${product.productId}`,
                    manufacturingData.createdBy,
                    'New manufactured product created',
                    {
                        fabricType: manufacturingData.fabricType,
                        color: manufacturingData.color,
                        size: manufacturingData.size,
                        productType: manufacturingData.productType
                    }
                );
            }
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

// Transaction API Routes

// Get all transactions with filtering
app.get('/api/transactions', async (req, res) => {
    try {
        const { type, itemType, userId, limit = 50, page = 1 } = req.query;
        
        const query = {};
        if (type) query.type = type;
        if (itemType) query.itemType = itemType;
        if (userId) query['performedBy.userId'] = userId;
        
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        const transactions = await Transaction.find(query)
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(parseInt(limit));
            
        const total = await Transaction.countDocuments(query);
        
        res.json({
            transactions,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / parseInt(limit)),
                totalRecords: total,
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create a new transaction
app.post('/api/transactions', async (req, res) => {
    try {
        const count = await Transaction.countDocuments();
        const transactionId = `TXN${String(count + 1).padStart(8, '0')}`;
        
        const transactionData = {
            ...req.body,
            transactionId,
            timestamp: new Date()
        };
        
        const transaction = new Transaction(transactionData);
        await transaction.save();
        
        res.status(201).json(transaction);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get transaction statistics
app.get('/api/transactions/stats', async (req, res) => {
    try {
        const totalTransactions = await Transaction.countDocuments();
        const stockIn = await Transaction.countDocuments({ type: 'stock_in' });
        const stockOut = await Transaction.countDocuments({ type: 'stock_out' });
        const manufacturing = await Transaction.countDocuments({ type: 'manufacturing' });
        
        const recentTransactions = await Transaction.find()
            .sort({ timestamp: -1 })
            .limit(10);
        
        res.json({
            totalTransactions,
            stockIn,
            stockOut,
            manufacturing,
            recentTransactions
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Employee API Routes

// Get all employees
app.get('/api/employees', async (req, res) => {
    try {
        const employees = await Employee.find({ isActive: true }).sort({ createdAt: -1 });
        // Remove password and faceDescriptor from response
        const sanitizedEmployees = employees.map(emp => {
            const { password, faceDescriptor, ...employee } = emp.toObject();
            return employee;
        });
        res.json(sanitizedEmployees);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Register new employee
app.post('/api/employees', async (req, res) => {
    try {
        const count = await Employee.countDocuments();
        const employeeId = `EMP${String(count + 1).padStart(4, '0')}`;
        
        const employeeData = {
            ...req.body,
            employeeId
        };
        
        const employee = new Employee(employeeData);
        await employee.save();
        
        // Remove sensitive data from response
        const { password, faceDescriptor, ...responseData } = employee.toObject();
        res.status(201).json(responseData);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Update employee
app.put('/api/employees/:id', async (req, res) => {
    try {
        const employee = await Employee.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!employee) {
            return res.status(404).json({ error: 'Employee not found' });
        }
        const { password, faceDescriptor, ...responseData } = employee.toObject();
        res.json(responseData);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Delete employee (soft delete)
app.delete('/api/employees/:id', async (req, res) => {
    try {
        const employee = await Employee.findByIdAndUpdate(
            req.params.id, 
            { isActive: false }, 
            { new: true }
        );
        if (!employee) {
            return res.status(404).json({ error: 'Employee not found' });
        }
        res.json({ message: 'Employee deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Employee login authentication
app.post('/api/employees/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const employee = await Employee.findOne({ username, isActive: true });
        
        if (!employee || employee.password !== password) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const { password: pwd, faceDescriptor, ...employeeData } = employee.toObject();
        res.json(employeeData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Attendance API Routes

// Get all attendance records
app.get('/api/attendance', async (req, res) => {
    try {
        const { date, employeeId, month, year, limit = 50, page = 1 } = req.query;
        
        const query = {};
        if (date) query.date = date;
        if (employeeId) query.employeeId = employeeId;
        if (month && year) {
            const monthStr = String(month).padStart(2, '0');
            query.date = { $regex: `^${year}-${monthStr}` };
        }
        
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        const attendance = await Attendance.find(query)
            .sort({ date: -1, createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));
            
        const total = await Attendance.countDocuments(query);
        
        res.json({
            attendance,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / parseInt(limit)),
                totalRecords: total,
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Mark attendance (check-in/check-out)
app.post('/api/attendance', async (req, res) => {
    try {
        const { employeeId, employeeName, type, faceMatchConfidence, location, notes } = req.body;
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        
        let attendance = await Attendance.findOne({ employeeId, date: today });
        
        if (!attendance) {
            // Create new attendance record
            const count = await Attendance.countDocuments();
            const attendanceId = `ATT${String(count + 1).padStart(6, '0')}`;
            
            attendance = new Attendance({
                attendanceId,
                employeeId,
                employeeName,
                date: today,
                checkIn: type === 'checkin' ? new Date() : null,
                checkOut: type === 'checkout' ? new Date() : null,
                status: 'P',
                faceMatchConfidence,
                location,
                notes
            });
        } else {
            // Update existing record
            if (type === 'checkin' && !attendance.checkIn) {
                attendance.checkIn = new Date();
                attendance.status = 'P';
            } else if (type === 'checkout' && attendance.checkIn && !attendance.checkOut) {
                attendance.checkOut = new Date();
                // Calculate working hours
                const timeDiff = attendance.checkOut.getTime() - attendance.checkIn.getTime();
                attendance.workingHours = Math.round((timeDiff / (1000 * 60 * 60)) * 100) / 100;
            }
            
            if (faceMatchConfidence) attendance.faceMatchConfidence = faceMatchConfidence;
            if (location) attendance.location = location;
            if (notes) attendance.notes = notes;
        }
        
        await attendance.save();
        res.status(201).json(attendance);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get attendance statistics
app.get('/api/attendance/stats', async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const currentMonth = today.substring(0, 7); // YYYY-MM
        
        const totalEmployees = await Employee.countDocuments({ isActive: true });
        const todayPresent = await Attendance.countDocuments({ date: today, status: 'P' });
        const todayAbsent = totalEmployees - todayPresent;
        const monthlyAttendance = await Attendance.countDocuments({ 
            date: { $regex: `^${currentMonth}` }, 
            status: 'P' 
        });
        
        res.json({
            totalEmployees,
            todayPresent,
            todayAbsent,
            monthlyAttendance
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update attendance status manually (admin only)
app.put('/api/attendance/:id', async (req, res) => {
    try {
        const attendance = await Attendance.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!attendance) {
            return res.status(404).json({ error: 'Attendance record not found' });
        }
        res.json(attendance);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Helper function to create transaction record
async function createTransaction(type, itemType, itemId, itemName, quantity, previousQty, newQty, reason, performedBy, notes = '', relatedDetails = {}) {
    try {
        const count = await Transaction.countDocuments();
        const transactionId = `TXN${String(count + 1).padStart(8, '0')}`;
        
        const transaction = new Transaction({
            transactionId,
            type,
            itemType,
            itemId,
            itemName,
            quantity,
            previousQuantity: previousQty,
            newQuantity: newQty,
            reason,
            performedBy,
            notes,
            relatedItemDetails: relatedDetails
        });
        
        await transaction.save();
        return transaction;
    } catch (error) {
        console.error('Error creating transaction:', error);
    }
}

// Catch-all route - Must be after all API routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});