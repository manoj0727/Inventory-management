import { useState, useEffect } from 'react'
import '../styles/common.css'

interface CuttingRecord {
  id: string
  fabricId: string
  fabricType: string
  fabricColor: string
  productName: string
  piecesCount: number
  meterPerPiece: number
  totalMetersUsed: number
  usageLocation: string
  cuttingEmployee: string
  date: string
  time: string
  status: string
}

export default function CuttingInventory() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterProduct, setFilterProduct] = useState('')
  const [filterEmployee, setFilterEmployee] = useState('')
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  })
  const [cuttingRecords, setCuttingRecords] = useState<CuttingRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const fetchCuttingRecords = async () => {
    setIsLoading(true)
    try {
      // This would be replaced with actual API call when cutting API is implemented
      // const response = await fetch('http://localhost:4000/api/cutting-records')
      // if (response.ok) {
      //   const records = await response.json()
      //   setCuttingRecords(records)
      // }
      setCuttingRecords([])
    } catch (error) {
      console.error('Error fetching cutting records:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCuttingRecords()
  }, [])

  const filteredRecords = cuttingRecords.filter(record => {
    const matchesSearch = record.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          record.fabricType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          record.productName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesProduct = !filterProduct || record.productName === filterProduct
    const matchesEmployee = !filterEmployee || record.cuttingEmployee === filterEmployee
    
    return matchesSearch && matchesProduct && matchesEmployee
  })

  // Calculate statistics
  const totalCuttings = cuttingRecords.length
  const totalMetersUsed = cuttingRecords.reduce((sum, record) => sum + record.totalMetersUsed, 0)
  const totalPieces = cuttingRecords.reduce((sum, record) => sum + record.piecesCount, 0)
  const uniqueProducts = [...new Set(cuttingRecords.map(r => r.productName))].length
  const activeEmployees = [...new Set(cuttingRecords.map(r => r.cuttingEmployee))].length

  const uniqueEmployees = [...new Set(cuttingRecords.map(r => r.cuttingEmployee))]
  const uniqueProductNames = [...new Set(cuttingRecords.map(r => r.productName))]

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Cutting Inventory</h1>
        <p>View all cutting records and statistics</p>
      </div>

      {/* Statistics */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Cuttings</h3>
          <p className="stat-value">{totalCuttings}</p>
        </div>
        <div className="stat-card">
          <h3>Total Meters Used</h3>
          <p className="stat-value">{totalMetersUsed}m</p>
        </div>
        <div className="stat-card">
          <h3>Total Pieces</h3>
          <p className="stat-value">{totalPieces}</p>
        </div>
        <div className="stat-card">
          <h3>Products</h3>
          <p className="stat-value">{uniqueProducts}</p>
        </div>
        <div className="stat-card">
          <h3>Active Employees</h3>
          <p className="stat-value">{activeEmployees}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="content-card">
        <div className="toolbar">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search by ID, fabric type, or product..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-group">
            <select
              value={filterProduct}
              onChange={(e) => setFilterProduct(e.target.value)}
            >
              <option value="">All Products</option>
              {uniqueProductNames.map(product => (
                <option key={product} value={product}>{product}</option>
              ))}
            </select>
            <select
              value={filterEmployee}
              onChange={(e) => setFilterEmployee(e.target.value)}
            >
              <option value="">All Employees</option>
              {uniqueEmployees.map(employee => (
                <option key={employee} value={employee}>{employee}</option>
              ))}
            </select>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
              placeholder="Start Date"
            />
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
              placeholder="End Date"
            />
            <button 
              className="btn btn-secondary"
              onClick={fetchCuttingRecords}
              disabled={isLoading}
            >
              {isLoading ? 'Refreshing...' : 'Refresh'}
            </button>
            <button className="btn btn-primary">
              Export Report
            </button>
          </div>
        </div>
      </div>

      {/* Cutting Records Table */}
      <div className="content-card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Cutting ID</th>
                <th>Fabric</th>
                <th>Product</th>
                <th>Pieces</th>
                <th>Meter/Piece</th>
                <th>Total Used</th>
                <th>Location</th>
                <th>Employee</th>
                <th>Date</th>
                <th>Time</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length > 0 ? (
                filteredRecords.map((record) => (
                  <tr key={record.id}>
                    <td style={{ fontWeight: '500' }}>{record.id}</td>
                    <td>{record.fabricType} - {record.fabricColor}</td>
                    <td>{record.productName}</td>
                    <td>{record.piecesCount}</td>
                    <td>{record.meterPerPiece}m</td>
                    <td style={{ fontWeight: '500' }}>{record.totalMetersUsed}m</td>
                    <td>{record.usageLocation}</td>
                    <td>{record.cuttingEmployee}</td>
                    <td>{record.date}</td>
                    <td>{record.time}</td>
                    <td>
                      <span className="badge badge-success">{record.status}</span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="action-btn view">View</button>
                        <button className="action-btn edit">Edit</button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={12} style={{ textAlign: 'center', padding: '40px' }}>
                    <div className="empty-state">
                      <div className="empty-state-icon">✂️</div>
                      <h3>No cutting records found</h3>
                      <p>Try adjusting your search or filters</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary by Product */}
      <div className="content-card">
        <h2 style={{ marginBottom: '20px', color: '#374151' }}>Summary by Product</h2>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Total Pieces</th>
                <th>Total Meters Used</th>
                <th>Average Meter/Piece</th>
                <th>Last Cutting</th>
              </tr>
            </thead>
            <tbody>
              {uniqueProductNames.map(product => {
                const productRecords = cuttingRecords.filter(r => r.productName === product)
                const totalPieces = productRecords.reduce((sum, r) => sum + r.piecesCount, 0)
                const totalMeters = productRecords.reduce((sum, r) => sum + r.totalMetersUsed, 0)
                const avgMeter = (totalMeters / totalPieces).toFixed(2)
                const lastDate = productRecords[0]?.date
                
                return (
                  <tr key={product}>
                    <td style={{ fontWeight: '500' }}>{product}</td>
                    <td>{totalPieces}</td>
                    <td>{totalMeters}m</td>
                    <td>{avgMeter}m</td>
                    <td>{lastDate}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}