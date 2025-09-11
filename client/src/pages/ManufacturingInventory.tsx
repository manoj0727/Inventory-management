import { useState, useEffect } from 'react'
import '../styles/common.css'

interface ManufacturingRecord {
  _id: string
  id: string
  productId: string
  productName: string
  cuttingId: string
  quantity: number
  quantityProduced: number
  quantityRemaining: number
  tailorName: string
  tailorMobile: string
  startDate: string
  completedDate?: string
  dueDate: string
  priority: string
  status: string
  notes?: string
  createdAt: string
}

export default function ManufacturingInventory() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [manufacturingRecords, setManufacturingRecords] = useState<ManufacturingRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [editingRecord, setEditingRecord] = useState<ManufacturingRecord | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)

  const fetchManufacturingRecords = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('http://localhost:4000/api/manufacturing-inventory')
      if (response.ok) {
        const records = await response.json()
        setManufacturingRecords(records)
      } else {
        console.error('Failed to fetch manufacturing inventory records')
        setManufacturingRecords([])
      }
    } catch (error) {
      console.error('Error fetching manufacturing records:', error)
      setManufacturingRecords([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchManufacturingRecords()
  }, [])

  const formatDate = (dateString: string) => {
    if (!dateString) return ''
    try {
      const date = new Date(dateString)
      const day = date.getDate().toString().padStart(2, '0')
      const month = (date.getMonth() + 1).toString().padStart(2, '0')
      const year = date.getFullYear()
      return `${day}/${month}/${year}`
    } catch (error) {
      return dateString
    }
  }

  const handleEdit = (record: ManufacturingRecord) => {
    setEditingRecord(record)
    setShowEditModal(true)
  }

  const handleDelete = async (record: ManufacturingRecord) => {
    if (window.confirm(`Are you sure you want to delete manufacturing record ${record.id}?`)) {
      try {
        const deleteResponse = await fetch(`http://localhost:4000/api/manufacturing-inventory/${record._id}`, {
          method: 'DELETE'
        })
        
        if (deleteResponse.ok) {
          alert('✅ Manufacturing record deleted successfully!')
          fetchManufacturingRecords()
        } else {
          alert('❌ Error deleting manufacturing record. Please try again.')
        }
      } catch (error) {
        console.error('Error deleting manufacturing record:', error)
        alert('❌ Error deleting manufacturing record. Please try again.')
      }
    }
  }

  const handleSaveEdit = async (updatedRecord: any) => {
    try {
      const updateResponse = await fetch(`http://localhost:4000/api/manufacturing-inventory/${editingRecord?._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedRecord)
      })
      
      if (updateResponse.ok) {
        alert('✅ Manufacturing record updated successfully!')
        setShowEditModal(false)
        setEditingRecord(null)
        fetchManufacturingRecords()
      } else {
        alert('❌ Error updating manufacturing record. Please try again.')
      }
    } catch (error) {
      console.error('Error updating manufacturing record:', error)
      alert('❌ Error updating manufacturing record. Please try again.')
    }
  }

  const filteredRecords = manufacturingRecords.filter(record => {
    const matchesSearch = record.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          record.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          record.tailorName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = !filterStatus || record.status === filterStatus
    
    return matchesSearch && matchesStatus
  })


  const getStatusBadgeClass = (status: string) => {
    switch(status) {
      case 'Completed': return 'badge-success'
      case 'In Progress': return 'badge-info'
      case 'Pending': return 'badge-warning'
      case 'Cancelled': return 'badge-danger'
      default: return 'badge-info'
    }
  }


  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Manufacturing Inventory</h1>
        <p>Track all manufacturing orders and production history</p>
      </div>


      {/* Filters */}
      <div className="content-card">
        <div className="toolbar">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search by ID, product, cutting ID, or tailor..."
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
            <button 
              className="btn btn-secondary"
              onClick={fetchManufacturingRecords}
              disabled={isLoading}
            >
              {isLoading ? 'Refreshing...' : 'Refresh'}
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
                <th>Manufacturing ID</th>
                <th>Product</th>
                <th>Produced</th>
                <th>Remaining</th>
                <th>Tailor</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length > 0 ? (
                filteredRecords.map((record) => (
                  <tr key={record._id}>
                    <td style={{ fontWeight: '500' }}>{record.id}</td>
                    <td>{record.productName}</td>
                    <td>{record.quantityProduced}</td>
                    <td style={{ color: record.quantityRemaining > 0 ? '#f59e0b' : '#10b981' }}>
                      {record.quantityRemaining}
                    </td>
                    <td>{record.tailorName}</td>
                    <td>{formatDate(record.dueDate)}</td>
                    <td>
                      <span className={`badge ${getStatusBadgeClass(record.status)}`}>
                        {record.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="action-btn edit" onClick={() => handleEdit(record)}>✏️</button>
                        <button className="action-btn delete" onClick={() => handleDelete(record)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                    {isLoading ? 'Loading manufacturing inventory...' : 'No manufacturing inventory records found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && editingRecord && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '10px',
            width: '90%',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h2 style={{ marginBottom: '20px', color: '#374151' }}>Edit Manufacturing Record</h2>
            <form onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.target as HTMLFormElement)
              const updatedRecord = {
                quantityProduced: parseInt(formData.get('quantityProduced') as string),
                tailorName: formData.get('tailorName') as string,
                dueDate: formData.get('dueDate') as string,
                status: formData.get('status') as string
              }
              handleSaveEdit(updatedRecord)
            }}>
              <div className="form-group">
                <label htmlFor="quantityProduced">Quantity Produced *</label>
                <input
                  type="number"
                  id="quantityProduced"
                  name="quantityProduced"
                  defaultValue={editingRecord.quantityProduced}
                  min="0"
                  max={editingRecord.quantity}
                  required
                />
                <small style={{ color: '#6b7280' }}>
                  Maximum: {editingRecord.quantity} (Total ordered)
                </small>
              </div>

              <div className="form-group">
                <label htmlFor="tailorName">Tailor Name *</label>
                <input
                  type="text"
                  id="tailorName"
                  name="tailorName"
                  defaultValue={editingRecord.tailorName}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="dueDate">Due Date *</label>
                <input
                  type="date"
                  id="dueDate"
                  name="dueDate"
                  defaultValue={editingRecord.dueDate}
                  required
                />
              </div>


              <div className="form-group">
                <label htmlFor="status">Status *</label>
                <select
                  id="status"
                  name="status"
                  defaultValue={editingRecord.status}
                  required
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div className="btn-group">
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowEditModal(false)
                    setEditingRecord(null)
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}