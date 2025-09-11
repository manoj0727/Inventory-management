import { useState, useEffect } from 'react'
import '../styles/common.css'

interface ManufacturingRecord {
  id: string
  productName: string
  quantity: number
  fabricUsed: number
  startDate: string
  completedDate: string
  assignedTo: string
  priority: string
  status: string
  efficiency: number
}

export default function ManufacturingInventory() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [manufacturingRecords, setManufacturingRecords] = useState<ManufacturingRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const fetchManufacturingRecords = async () => {
    setIsLoading(true)
    try {
      // This would be replaced with actual API call when manufacturing API is implemented
      // const response = await fetch('http://localhost:4000/api/manufacturing-records')
      // if (response.ok) {
      //   const records = await response.json()
      //   setManufacturingRecords(records)
      // }
      setManufacturingRecords([])
    } catch (error) {
      console.error('Error fetching manufacturing records:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchManufacturingRecords()
  }, [])

  const filteredRecords = manufacturingRecords.filter(record => {
    const matchesSearch = record.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          record.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          record.assignedTo.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = !filterStatus || record.status === filterStatus
    const matchesPriority = !filterPriority || record.priority === filterPriority
    
    return matchesSearch && matchesStatus && matchesPriority
  })

  // Calculate statistics
  const totalOrders = manufacturingRecords.length
  const completedOrders = manufacturingRecords.filter(r => r.status === 'Completed').length
  const inProgressOrders = manufacturingRecords.filter(r => r.status === 'In Progress').length
  const pendingOrders = manufacturingRecords.filter(r => r.status === 'Pending').length
  const totalUnitsProduced = manufacturingRecords
    .filter(r => r.status === 'Completed')
    .reduce((sum, r) => sum + r.quantity, 0)
  const averageEfficiency = Math.round(
    manufacturingRecords
      .filter(r => r.efficiency > 0)
      .reduce((sum, r, _, arr) => sum + r.efficiency / arr.length, 0)
  )

  const getStatusBadgeClass = (status: string) => {
    switch(status) {
      case 'Completed': return 'badge-success'
      case 'In Progress': return 'badge-info'
      case 'Pending': return 'badge-warning'
      case 'Cancelled': return 'badge-danger'
      default: return 'badge-info'
    }
  }

  const getPriorityBadgeClass = (priority: string) => {
    switch(priority) {
      case 'Urgent': return 'badge-danger'
      case 'High': return 'badge-warning'
      case 'Normal': return 'badge-info'
      case 'Low': return 'badge-success'
      default: return 'badge-info'
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Manufacturing Inventory</h1>
        <p>Track all manufacturing orders and production history</p>
      </div>

      {/* Statistics */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Orders</h3>
          <p className="stat-value">{totalOrders}</p>
        </div>
        <div className="stat-card">
          <h3>Completed</h3>
          <p className="stat-value">{completedOrders}</p>
        </div>
        <div className="stat-card">
          <h3>In Progress</h3>
          <p className="stat-value">{inProgressOrders}</p>
        </div>
        <div className="stat-card">
          <h3>Pending</h3>
          <p className="stat-value">{pendingOrders}</p>
        </div>
        <div className="stat-card">
          <h3>Units Produced</h3>
          <p className="stat-value">{totalUnitsProduced}</p>
        </div>
        <div className="stat-card">
          <h3>Avg Efficiency</h3>
          <p className="stat-value">{averageEfficiency}%</p>
        </div>
      </div>

      {/* Filters */}
      <div className="content-card">
        <div className="toolbar">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search by ID, product, or team..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-group">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="Completed">Completed</option>
              <option value="In Progress">In Progress</option>
              <option value="Pending">Pending</option>
            </select>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
            >
              <option value="">All Priority</option>
              <option value="Urgent">Urgent</option>
              <option value="High">High</option>
              <option value="Normal">Normal</option>
              <option value="Low">Low</option>
            </select>
            <button 
              className="btn btn-secondary"
              onClick={fetchManufacturingRecords}
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

      {/* Manufacturing Records Table */}
      <div className="content-card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Product</th>
                <th>Quantity</th>
                <th>Fabric Used</th>
                <th>Team</th>
                <th>Start Date</th>
                <th>Completed</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Efficiency</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length > 0 ? (
                filteredRecords.map((record) => (
                  <tr key={record.id}>
                    <td style={{ fontWeight: '500' }}>{record.id}</td>
                    <td>{record.productName}</td>
                    <td>{record.quantity}</td>
                    <td>{record.fabricUsed}m</td>
                    <td>{record.assignedTo}</td>
                    <td>{record.startDate}</td>
                    <td>{record.completedDate || '-'}</td>
                    <td>
                      <span className={`badge ${getPriorityBadgeClass(record.priority)}`}>
                        {record.priority}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadgeClass(record.status)}`}>
                        {record.status}
                      </span>
                    </td>
                    <td>
                      {record.efficiency > 0 ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ 
                            width: '60px', 
                            height: '6px', 
                            background: '#e5e7eb', 
                            borderRadius: '3px',
                            overflow: 'hidden'
                          }}>
                            <div style={{ 
                              width: `${record.efficiency}%`, 
                              height: '100%', 
                              background: record.efficiency > 80 ? '#10b981' : record.efficiency > 50 ? '#f59e0b' : '#ef4444'
                            }} />
                          </div>
                          <span style={{ fontSize: '12px' }}>{record.efficiency}%</span>
                        </div>
                      ) : '-'}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="action-btn view">View</button>
                        {record.status !== 'Completed' && (
                          <button className="action-btn edit">Update</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={11} style={{ textAlign: 'center', padding: '40px' }}>
                    <div className="empty-state">
                      <div className="empty-state-icon">🏭</div>
                      <h3>No manufacturing records found</h3>
                      <p>Try adjusting your search or filters</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Production Summary by Team */}
      <div className="content-card">
        <h2 style={{ marginBottom: '20px', color: '#374151' }}>Team Performance Summary</h2>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Team</th>
                <th>Orders Completed</th>
                <th>Orders In Progress</th>
                <th>Total Units Produced</th>
                <th>Average Efficiency</th>
                <th>Total Fabric Used</th>
              </tr>
            </thead>
            <tbody>
              {['Team A', 'Team B', 'Team C'].map(team => {
                const teamRecords = manufacturingRecords.filter(r => r.assignedTo === team)
                const completed = teamRecords.filter(r => r.status === 'Completed').length
                const inProgress = teamRecords.filter(r => r.status === 'In Progress').length
                const unitsProduced = teamRecords
                  .filter(r => r.status === 'Completed')
                  .reduce((sum, r) => sum + r.quantity, 0)
                const avgEfficiency = teamRecords.length > 0 
                  ? Math.round(teamRecords.reduce((sum, r) => sum + r.efficiency, 0) / teamRecords.length)
                  : 0
                const totalFabric = teamRecords.reduce((sum, r) => sum + r.fabricUsed, 0)
                
                return (
                  <tr key={team}>
                    <td style={{ fontWeight: '500' }}>{team}</td>
                    <td>{completed}</td>
                    <td>{inProgress}</td>
                    <td>{unitsProduced}</td>
                    <td>
                      <span style={{ 
                        color: avgEfficiency > 80 ? '#10b981' : avgEfficiency > 50 ? '#f59e0b' : '#ef4444',
                        fontWeight: '500'
                      }}>
                        {avgEfficiency}%
                      </span>
                    </td>
                    <td>{totalFabric}m</td>
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