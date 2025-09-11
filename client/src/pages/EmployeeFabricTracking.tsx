import { useState } from 'react'
import './FabricTracking.css'

type TabType = 'dashboard' | 'cutting' | 'viewCutting'

interface Fabric {
  id: string
  fabricType: string
  color: string
  quality: 'Premium' | 'Standard' | 'Economy'
  quantity: number
  supplier: string
  employeeName: string
  dateReceived: string
  status: 'In Stock' | 'Low Stock' | 'Out of Stock'
}

interface CuttingRecord {
  id: string
  fabricId: string
  fabricType: string
  productName: string
  piecesCount: number
  meterPerPiece: number
  totalMetersUsed: number
  usageLocation: string
  cuttingEmployee: string
  date: string
}

export default function EmployeeFabricTracking() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard')
  const [menuOpen, setMenuOpen] = useState(false)
  
  const [fabrics] = useState<Fabric[]>([
    {
      id: 'FAB001',
      fabricType: 'Cotton',
      color: 'White',
      quality: 'Premium',
      quantity: 100,
      supplier: 'ABC Textiles',
      employeeName: 'John Doe',
      dateReceived: '2024-01-15',
      status: 'In Stock'
    },
    {
      id: 'FAB002',
      fabricType: 'Silk',
      color: 'Red',
      quality: 'Premium',
      quantity: 50,
      supplier: 'XYZ Fabrics',
      employeeName: 'Jane Smith',
      dateReceived: '2024-01-16',
      status: 'In Stock'
    },
    {
      id: 'FAB003',
      fabricType: 'Denim',
      color: 'Blue',
      quality: 'Standard',
      quantity: 10,
      supplier: 'Denim Co',
      employeeName: 'Bob Johnson',
      dateReceived: '2024-01-14',
      status: 'Low Stock'
    }
  ])

  const [cuttingRecords, setCuttingRecords] = useState<CuttingRecord[]>([])

  const [cuttingForm, setCuttingForm] = useState({
    fabricId: '',
    productName: '',
    piecesCount: '',
    meterPerPiece: '',
    usageLocation: '',
    cuttingEmployee: ''
  })

  const handleCuttingSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const selectedFabric = fabrics.find(f => f.id === cuttingForm.fabricId)
    if (!selectedFabric) return

    const totalMetersUsed = Number(cuttingForm.piecesCount) * Number(cuttingForm.meterPerPiece)
    
    const newCutting: CuttingRecord = {
      id: `CUT${String(cuttingRecords.length + 1).padStart(3, '0')}`,
      fabricId: cuttingForm.fabricId,
      fabricType: selectedFabric.fabricType,
      productName: cuttingForm.productName,
      piecesCount: Number(cuttingForm.piecesCount),
      meterPerPiece: Number(cuttingForm.meterPerPiece),
      totalMetersUsed,
      usageLocation: cuttingForm.usageLocation,
      cuttingEmployee: cuttingForm.cuttingEmployee,
      date: new Date().toISOString().split('T')[0]
    }

    setCuttingRecords([...cuttingRecords, newCutting])
    setCuttingForm({
      fabricId: '',
      productName: '',
      piecesCount: '',
      meterPerPiece: '',
      usageLocation: '',
      cuttingEmployee: ''
    })
    alert('✅ Cutting record added successfully!')
  }

  const getTotalMetersUsed = () => {
    if (cuttingForm.piecesCount && cuttingForm.meterPerPiece) {
      return Number(cuttingForm.piecesCount) * Number(cuttingForm.meterPerPiece)
    }
    return 0
  }

  const showSection = (section: TabType) => {
    setActiveTab(section)
    setMenuOpen(false)
  }

  return (
    <div className="fabric-tracking-container">
      <div className="container">
        <nav className="navbar">
          <div className="nav-header">
            <h1>Fabric Tracking System - Employee</h1>
            <button 
              className={`hamburger ${menuOpen ? 'active' : ''}`}
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
          <div className={`nav-buttons ${menuOpen ? 'active' : ''}`}>
            <button 
              className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`} 
              onClick={() => showSection('dashboard')}
            >
              View Fabrics
            </button>
            <button 
              className={`nav-btn ${activeTab === 'cutting' ? 'active' : ''}`} 
              onClick={() => showSection('cutting')}
            >
              Record Cutting
            </button>
            <button 
              className={`nav-btn ${activeTab === 'viewCutting' ? 'active' : ''}`} 
              onClick={() => showSection('viewCutting')}
            >
              My Cutting Records
            </button>
          </div>
        </nav>

        {/* Dashboard Section - View Only */}
        <div id="dashboard" className={`section ${activeTab === 'dashboard' ? 'active' : ''}`}>
          <div className="dashboard-container">
            <h2>Available Fabrics</h2>
            <div className="stats-container">
              <div className="stat-card">
                <h3>Total Fabrics</h3>
                <span id="totalFabrics">{fabrics.length}</span>
              </div>
              <div className="stat-card">
                <h3>In Stock</h3>
                <span id="inStock">{fabrics.filter(f => f.status === 'In Stock').length}</span>
              </div>
              <div className="stat-card">
                <h3>Low Stock</h3>
                <span id="lowStock">{fabrics.filter(f => f.status === 'Low Stock').length}</span>
              </div>
            </div>
            
            <div className="table-container">
              <table id="fabricTable">
                <thead>
                  <tr>
                    <th>Fabric ID</th>
                    <th>Fabric Type</th>
                    <th>Color</th>
                    <th>Quality</th>
                    <th>Available Quantity</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody id="fabricTableBody">
                  {fabrics.map((fabric) => (
                    <tr key={fabric.id}>
                      <td>{fabric.id}</td>
                      <td>{fabric.fabricType}</td>
                      <td>{fabric.color}</td>
                      <td>{fabric.quality}</td>
                      <td>{fabric.quantity}m</td>
                      <td>
                        <span className={`status ${fabric.status.toLowerCase().replace(' ', '-')}`}>
                          {fabric.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Cutting Section */}
        <div id="cutting" className={`section ${activeTab === 'cutting' ? 'active' : ''}`}>
          <div className="form-container">
            <h2>Record Fabric Cutting</h2>
            <form id="cuttingForm" onSubmit={handleCuttingSubmit}>
              <div className="form-group">
                <label htmlFor="fabricSelect">Select Fabric:</label>
                <select 
                  id="fabricSelect" 
                  name="fabricId" 
                  required
                  value={cuttingForm.fabricId}
                  onChange={(e) => setCuttingForm({...cuttingForm, fabricId: e.target.value})}
                >
                  <option value="">Choose a fabric</option>
                  {fabrics.map(fabric => (
                    <option key={fabric.id} value={fabric.id}>
                      {fabric.id} - {fabric.fabricType} ({fabric.color}) - {fabric.quantity}m available
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="productName">Product Name:</label>
                <input 
                  type="text" 
                  id="productName" 
                  name="productName" 
                  required
                  value={cuttingForm.productName}
                  onChange={(e) => setCuttingForm({...cuttingForm, productName: e.target.value})}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="piecesCount">Number of Pieces to Cut:</label>
                <input 
                  type="number" 
                  id="piecesCount" 
                  name="piecesCount" 
                  required 
                  min="1"
                  value={cuttingForm.piecesCount}
                  onChange={(e) => setCuttingForm({...cuttingForm, piecesCount: e.target.value})}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="meterPerPiece">Meter Length per Piece:</label>
                <input 
                  type="number" 
                  id="meterPerPiece" 
                  name="meterPerPiece" 
                  required 
                  min="0.1" 
                  step="0.1"
                  value={cuttingForm.meterPerPiece}
                  onChange={(e) => setCuttingForm({...cuttingForm, meterPerPiece: e.target.value})}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="totalMetersUsed">Total Meters Used:</label>
                <input 
                  type="number" 
                  id="totalMetersUsed" 
                  name="totalMetersUsed" 
                  readOnly
                  value={getTotalMetersUsed()}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="usageLocation">Where it will be Used:</label>
                <input 
                  type="text" 
                  id="usageLocation" 
                  name="usageLocation" 
                  required 
                  placeholder="e.g., Production Line A, Warehouse B"
                  value={cuttingForm.usageLocation}
                  onChange={(e) => setCuttingForm({...cuttingForm, usageLocation: e.target.value})}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="cuttingEmployee">Your Name:</label>
                <input 
                  type="text" 
                  id="cuttingEmployee" 
                  name="cuttingEmployee" 
                  required
                  value={cuttingForm.cuttingEmployee}
                  onChange={(e) => setCuttingForm({...cuttingForm, cuttingEmployee: e.target.value})}
                />
              </div>
              
              <button type="submit" className="submit-btn">Submit Cutting Record</button>
            </form>
          </div>
        </div>

        {/* View Cutting Section - Employee's Own Records */}
        <div id="viewCutting" className={`section ${activeTab === 'viewCutting' ? 'active' : ''}`}>
          <div className="dashboard-container">
            <h2>My Cutting Records</h2>
            {cuttingRecords.length === 0 ? (
              <div className="empty-state">
                <p>No cutting records available</p>
              </div>
            ) : (
              <div className="table-container">
                <table id="cuttingTable">
                  <thead>
                    <tr>
                      <th>Cutting ID</th>
                      <th>Fabric Type</th>
                      <th>Product</th>
                      <th>Pieces</th>
                      <th>Meter/Piece</th>
                      <th>Total Used</th>
                      <th>Location</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody id="cuttingTableBody">
                    {cuttingRecords.map((record) => (
                      <tr key={record.id}>
                        <td>{record.id}</td>
                        <td>{record.fabricType}</td>
                        <td>{record.productName}</td>
                        <td>{record.piecesCount}</td>
                        <td>{record.meterPerPiece}m</td>
                        <td>{record.totalMetersUsed}m</td>
                        <td>{record.usageLocation}</td>
                        <td>{record.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}