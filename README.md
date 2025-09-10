# Inventory Management System

## Project Structure

```
inventory-management/
├── frontend/           # Frontend application (HTML/CSS/JS)
│   ├── index.html
│   ├── login.html
│   ├── employee-portal.html
│   ├── css/
│   ├── js/
│   ├── assets/
│   ├── data/
│   ├── pages/
│   └── fabric-tracking-module/
├── backend/           # Backend API + Static server
│   ├── server.js      # Serves both API and frontend
│   └── package.json
└── package.json       # Root package file
```

## Quick Start

1. **Install all dependencies:**
```bash
npm run install:all
```

2. **Start the application:**
```bash
npm start
```

The application runs on a single port:
- **URL:** http://localhost:3000
- **API Endpoints:** http://localhost:3000/api/*
- **Frontend:** Served from the same port

## Available Scripts

- `npm start` - Start the application (production)
- `npm run dev` - Development mode with auto-reload
- `npm run install:all` - Install all dependencies

## Technologies Used

- **Frontend:** HTML, CSS, JavaScript (served via http-server)
- **Backend:** Node.js, Express, MongoDB
- **Tools:** Concurrently for parallel execution