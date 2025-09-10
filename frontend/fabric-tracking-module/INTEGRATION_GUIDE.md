# Fabric Tracking Module - Integration Guide

## 📁 Folder Structure
```
fabric-tracking-module/
├── fabric-tracking.html    # Main HTML file
├── css/
│   └── fabric-tracking.css # All styles
├── js/
│   └── fabric-tracking.js  # All JavaScript functionality
├── api/
│   ├── server.js           # Backend API server
│   └── package.json        # Node.js dependencies
└── INTEGRATION_GUIDE.md    # This file
```

## 🚀 Quick Integration

### Method 1: Standalone Page
1. Copy the entire `fabric-tracking-module` folder to your website
2. Link to `fabric-tracking.html` from your main navigation
3. Start the API server (see Backend Setup below)

### Method 2: Embed in Existing Page
```html
<!-- In your existing HTML page -->
<link rel="stylesheet" href="path/to/fabric-tracking-module/css/fabric-tracking.css">

<!-- Where you want the module to appear -->
<div id="fabric-tracking-container">
    <!-- Copy the content inside <div class="container"> from fabric-tracking.html -->
</div>

<script src="path/to/fabric-tracking-module/js/fabric-tracking.js"></script>
```

### Method 3: iFrame Integration
```html
<iframe 
    src="path/to/fabric-tracking-module/fabric-tracking.html" 
    width="100%" 
    height="800px"
    frameborder="0">
</iframe>
```

## ⚙️ Backend Setup

### Prerequisites
- Node.js (v14+)
- MongoDB (local or cloud)

### Installation
```bash
cd fabric-tracking-module/api
npm install
```

### Configuration
Edit `api/server.js` line 15 to set your MongoDB connection:
```javascript
// For local MongoDB:
mongoose.connect('mongodb://localhost:27017/fabric_tracking', {

// For MongoDB Atlas:
mongoose.connect('mongodb+srv://username:password@cluster.mongodb.net/fabric_tracking', {
```

### Start the API Server
```bash
npm start
# Server runs on http://localhost:3000
```

## 🔧 Customization

### Change API Endpoint
If your API runs on a different server, update the URLs in `js/fabric-tracking.js`:
```javascript
// Change these lines (around line 57, 93, etc.):
const response = await fetch('/api/fabrics', {
// To:
const response = await fetch('https://your-api-server.com/api/fabrics', {
```

### Modify Styles
All styles are in `css/fabric-tracking.css`. Key customization points:
```css
:root {
    --primary-color: #6366f1;     /* Change primary color */
    --secondary-color: #8b5cf6;   /* Change secondary color */
    /* ... other color variables */
}
```

### Change Container Width
```css
.container {
    max-width: 900px;  /* Adjust width as needed */
}
```

## 📱 Features

### Desktop Features
- Full navigation bar
- Two-column form layouts
- Wide tables with all columns visible

### Mobile Features (≤768px)
- Hamburger menu navigation
- Single-column layouts
- Responsive tables with horizontal scroll
- Touch-friendly buttons and inputs

## 🔌 API Endpoints

### Fabric Management
- `POST /api/fabrics` - Register new fabric
- `GET /api/fabrics` - Get all fabrics

### Cutting Operations
- `POST /api/cutting` - Record cutting activity
- `GET /api/cutting` - Get cutting history

## 📊 Database Schema

### Fabric Collection
```javascript
{
  fabricType: String,
  color: String,
  quality: String,
  quantity: Number,
  supplier: String,
  dateReceived: Date,
  employeeName: String,
  status: String
}
```

### Cutting Collection
```javascript
{
  fabricId: ObjectId,
  productName: String,
  piecesCount: Number,
  meterPerPiece: Number,
  totalMetersUsed: Number,
  usageLocation: String,
  cuttingDate: Date,
  employeeName: String,
  notes: String
}
```

## 🎨 Customization Examples

### Add Your Company Logo
```html
<!-- In fabric-tracking.html, replace line 13 -->
<h1>Your Company - Fabric Tracking</h1>
```

### Change Button Colors
```css
/* In fabric-tracking.css */
.submit-btn {
    background: linear-gradient(135deg, #yourcolor1, #yourcolor2);
}
```

### Add Additional Fields
1. Update the HTML form in `fabric-tracking.html`
2. Update the schema in `api/server.js`
3. Update the display functions in `js/fabric-tracking.js`

## 🛠️ Troubleshooting

### Module Not Loading
- Check console for errors (F12)
- Verify all file paths are correct
- Ensure API server is running

### API Connection Issues
- Check if MongoDB is running
- Verify API endpoint URLs in JavaScript
- Check CORS settings if on different domain

### Mobile Menu Not Working
- Ensure JavaScript file is loaded
- Check for JavaScript errors in console
- Verify hamburger menu IDs match in HTML and JS

## 📞 Support

For issues or customization help:
1. Check browser console for errors
2. Verify MongoDB connection
3. Ensure all files are in correct folders
4. Test API endpoints directly

## 🔒 Security Notes

- Never expose MongoDB credentials in frontend code
- Use environment variables for sensitive data
- Implement authentication before production use
- Add input validation and sanitization
- Use HTTPS in production

## 📝 License

This module is provided as-is for integration into your existing systems.