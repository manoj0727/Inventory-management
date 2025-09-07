# Admin Portal - QR Inventory Management System

Simplified admin portal for QR inventory management without authentication.

## 🚀 Features
- **QR Code Generation**: Automatic QR code creation for inventory items
- **Real-time Dashboard**: Live inventory tracking and statistics
- **Transaction History**: Complete audit trail of inventory movements
- **Tailor Management**: Manage tailors and their information
- **Employee Management**: Handle employee data and records
- **Inventory Management**: Track products and stock levels
- **Reports**: Generate various inventory and operational reports

## Tech Stack
**Backend:** Node.js, Express, SQLite  
**Frontend:** HTML5, CSS3, JavaScript

## Getting Started

```bash
# Install dependencies
npm install
cd backend && npm install

# Start the server
npm start

# Access admin portal at
http://localhost:3000
```

## Project Structure
```
├── backend/              # Server, API, Database
│   ├── server.js        
│   ├── database/        # SQLite databases
│   ├── tailorRoutes.js  # Tailor management API
│   ├── employeeRoutes.js # Employee management API
│   └── qrGenerator.js   
├── assets/              # CSS and static assets
├── components/          # Reusable UI components
├── index.html          # Main admin portal
└── package.json
```

## Note
- Authentication system has been removed
- Direct access to admin portal functionality
- All user management features disabled
- Simplified for admin-only usage