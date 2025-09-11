import { useState } from 'react'
import '../styles/common.css'

interface Fabric {
  id: string
  fabricType: string
  color: string
  quality: string
  quantity: number
  supplier: string
  employeeName: string
  dateReceived: string
  status: string
  location: string
}

export default function ViewFabrics() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterQuality, setFilterQuality] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

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
      status: 'In Stock',
      location: 'Warehouse A'
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
      status: 'In Stock',
      location: 'Warehouse B'
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
      status: 'Low Stock',
      location: 'Warehouse A'
    },
    {
      id: 'FAB004',
      fabricType: 'Wool',
      color: 'Gray',
      quality: 'Premium',
      quantity: 0,
      supplier: 'Wool Masters',
      employeeName: 'Alice Brown',
      dateReceived: '2024-01-13',
      status: 'Out of Stock',
      location: 'Warehouse C'
    },
    {
      id: 'FAB005',
      fabricType: 'Linen',
      color: 'Beige',
      quality: 'Standard',
      quantity: 75,
      supplier: 'Linen World',
      employeeName: 'Tom Wilson',
      dateReceived: '2024-01-12',
      status: 'In Stock',
      location: 'Warehouse B'
    }
  ])

  const filteredFabrics = fabrics.filter(fabric => {
    const matchesSearch = fabric.fabricType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          fabric.color.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          fabric.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesQuality = !filterQuality || fabric.quality === filterQuality
    const matchesStatus = !filterStatus || fabric.status === filterStatus
    
    return matchesSearch && matchesQuality && matchesStatus
  })

  const getStatusBadgeClass = (status: string) => {
    switch(status) {
      case 'In Stock': return 'badge-success'
      case 'Low Stock': return 'badge-warning'
      case 'Out of Stock': return 'badge-danger'
      default: return 'badge-info'
    }
  }

  const totalValue = fabrics.reduce((sum, fabric) => sum + fabric.quantity, 0)
  const inStockCount = fabrics.filter(f => f.status === 'In Stock').length
  const lowStockCount = fabrics.filter(f => f.status === 'Low Stock').length
  const outOfStockCount = fabrics.filter(f => f.status === 'Out of Stock').length

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Fabric Inventory</h1>
        <p>View and manage all fabric inventory</p>
      </div>

      {/* Statistics */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Fabrics</h3>
          <p className="stat-value">{fabrics.length}</p>
        </div>
        <div className="stat-card">
          <h3>Total Quantity</h3>
          <p className="stat-value">{totalValue}m</p>
        </div>
        <div className="stat-card">
          <h3>In Stock</h3>
          <p className="stat-value">{inStockCount}</p>
        </div>
        <div className="stat-card">
          <h3>Low Stock</h3>
          <p className="stat-value">{lowStockCount}</p>
        </div>
        <div className="stat-card">
          <h3>Out of Stock</h3>
          <p className="stat-value">{outOfStockCount}</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="content-card">
        <div className="toolbar">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search by fabric type, color, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-group">
            <select
              value={filterQuality}
              onChange={(e) => setFilterQuality(e.target.value)}
            >
              <option value="">All Quality</option>
              <option value="Premium">Premium</option>
              <option value="Standard">Standard</option>
              <option value="Economy">Economy</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="In Stock">In Stock</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Out of Stock">Out of Stock</option>
            </select>
            <button className="btn btn-primary">
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Fabric Table */}
      <div className="content-card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Fabric ID</th>
                <th>Type</th>
                <th>Color</th>
                <th>Quality</th>
                <th>Quantity</th>
                <th>Supplier</th>
                <th>Location</th>
                <th>Date Received</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFabrics.length > 0 ? (
                filteredFabrics.map((fabric) => (
                  <tr key={fabric.id}>
                    <td style={{ fontWeight: '500' }}>{fabric.id}</td>
                    <td>{fabric.fabricType}</td>
                    <td>{fabric.color}</td>
                    <td>{fabric.quality}</td>
                    <td>{fabric.quantity}m</td>
                    <td>{fabric.supplier}</td>
                    <td>{fabric.location}</td>
                    <td>{fabric.dateReceived}</td>
                    <td>
                      <span className={`badge ${getStatusBadgeClass(fabric.status)}`}>
                        {fabric.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="action-btn view">View</button>
                        <button className="action-btn edit">Edit</button>
                        <button className="action-btn delete">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '40px' }}>
                    <div className="empty-state">
                      <div className="empty-state-icon">📦</div>
                      <h3>No fabrics found</h3>
                      <p>Try adjusting your search or filters</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}