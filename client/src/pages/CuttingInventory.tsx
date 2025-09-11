import { useState, useEffect } from 'react'
import '../styles/common.css'

interface CuttingRecord {
  _id?: string
  id: string
  productId: string
  fabricType: string
  fabricColor: string
  productName: string
  piecesCount: number
  pieceLength: number
  pieceWidth: number
  totalSquareMetersUsed: number
  usageLocation: string
  cuttingEmployee: string
  date: string
  time: string
  status: string
  notes?: string
}

export default function CuttingInventory() {
  const [searchTerm, setSearchTerm] = useState('')
  const [cuttingRecords, setCuttingRecords] = useState<CuttingRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [editingRecord, setEditingRecord] = useState<CuttingRecord | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)

  const formatDate = (dateString: string) => {
    if (!dateString) return ''
    try {
      const date = new Date(dateString)
      const day = date.getDate().toString().padStart(2, '0')
      const month = (date.getMonth() + 1).toString().padStart(2, '0')
      const year = date.getFullYear()
      return `${day}/${month}/${year}`
    } catch (error) {
      return dateString // Return original if parsing fails
    }
  }

  const generateCuttingId = (productName: string, color: string) => {
    const productCode = productName.substring(0, 3).toUpperCase()
    const colorCode = color.substring(0, 2).toUpperCase()
    const randomNumber = Math.floor(Math.random() * 9000) + 1000 // 4-digit random number
    return `CUT${productCode}${colorCode}${randomNumber}`
  }

  const fetchCuttingRecords = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('http://localhost:4000/api/cutting-records')
      if (response.ok) {
        const records = await response.json()
        setCuttingRecords(records)
      } else {
        console.error('Failed to fetch cutting records')
        setCuttingRecords([])
      }
    } catch (error) {
      console.error('Error fetching cutting records:', error)
      setCuttingRecords([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (record: CuttingRecord) => {
    setEditingRecord(record)
    setShowEditModal(true)
  }

  const handleDelete = async (record: CuttingRecord) => {
    if (window.confirm(`Are you sure you want to delete cutting record ${record.id}?`)) {
      try {
        const deleteResponse = await fetch(`http://localhost:4000/api/cutting-records/${record._id}`, {
          method: 'DELETE'
        })
        
        if (deleteResponse.ok) {
          alert('✅ Cutting record deleted successfully!')
          fetchCuttingRecords()
        } else {
          alert('❌ Error deleting cutting record. Please try again.')
        }
      } catch (error) {
        console.error('Error deleting cutting record:', error)
        alert('❌ Error deleting cutting record. Please try again.')
      }
    }
  }

  const handleSaveEdit = async (updatedRecord: CuttingRecord) => {
    try {
      const updateResponse = await fetch(`http://localhost:4000/api/cutting-records/${editingRecord?._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedRecord)
      })
      
      if (updateResponse.ok) {
        alert('✅ Cutting record updated successfully!')
        setShowEditModal(false)
        setEditingRecord(null)
        fetchCuttingRecords()
      } else {
        alert('❌ Error updating cutting record. Please try again.')
      }
    } catch (error) {
      console.error('Error updating cutting record:', error)
      alert('❌ Error updating cutting record. Please try again.')
    }
  }

  useEffect(() => {
    fetchCuttingRecords()
  }, [])

  const filteredRecords = cuttingRecords.filter(record => {
    const matchesSearch = record.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          record.fabricType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          record.fabricColor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          record.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          record.productId.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesSearch
  })

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Cutting Inventory Management</h1>
        <p>Manage your cutting records and operations</p>
      </div>

      <div className="content-card">
        <div className="toolbar">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search cutting records..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-group">
            <button 
              className="btn btn-secondary"
              onClick={fetchCuttingRecords}
              disabled={isLoading}
            >
              {isLoading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Cutting ID</th>
                <th>Product Name</th>
                <th>Fabric</th>
                <th>Color</th>
                <th>Pieces</th>
                <th>Total Used</th>
                <th>Employee</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length > 0 ? (
                filteredRecords.map((record) => (
                  <tr key={record.id}>
                    <td style={{ fontWeight: '500' }}>{record.id}</td>
                    <td>{record.productName}</td>
                    <td>{record.fabricType}</td>
                    <td>{record.fabricColor}</td>
                    <td>{record.piecesCount}</td>
                    <td>{record.totalSquareMetersUsed} sq.m</td>
                    <td>{record.cuttingEmployee}</td>
                    <td>{formatDate(record.date)}</td>
                    <td>
                      <span className="badge badge-success">{record.status}</span>
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
                  <td colSpan={10} style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                    {isLoading ? 'Loading cutting records...' : 'No cutting records found'}
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
            <h2 style={{ marginBottom: '20px', color: '#374151' }}>Edit Cutting Record</h2>
            <form onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.target as HTMLFormElement)
              const updatedRecord: CuttingRecord = {
                ...editingRecord,
                productName: formData.get('productName') as string,
                piecesCount: parseInt(formData.get('piecesCount') as string),
                pieceLength: parseFloat(formData.get('pieceLength') as string),
                pieceWidth: parseFloat(formData.get('pieceWidth') as string),
                totalSquareMetersUsed: parseInt(formData.get('piecesCount') as string) * parseFloat(formData.get('pieceLength') as string) * parseFloat(formData.get('pieceWidth') as string),
                usageLocation: formData.get('usageLocation') as string,
                cuttingEmployee: formData.get('cuttingEmployee') as string
              }
              handleSaveEdit(updatedRecord)
            }}>
              <div className="form-group">
                <label htmlFor="productName">Product Name *</label>
                <input
                  type="text"
                  id="productName"
                  name="productName"
                  defaultValue={editingRecord.productName}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="piecesCount">Number of Pieces *</label>
                <input
                  type="number"
                  id="piecesCount"
                  name="piecesCount"
                  defaultValue={editingRecord.piecesCount}
                  min="1"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="pieceLength">Piece Length (meters) *</label>
                <input
                  type="number"
                  id="pieceLength"
                  name="pieceLength"
                  defaultValue={editingRecord.pieceLength}
                  min="0.1"
                  step="0.1"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="pieceWidth">Piece Width (meters) *</label>
                <input
                  type="number"
                  id="pieceWidth"
                  name="pieceWidth"
                  defaultValue={editingRecord.pieceWidth}
                  min="0.1"
                  step="0.1"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="usageLocation">Usage Location</label>
                <input
                  type="text"
                  id="usageLocation"
                  name="usageLocation"
                  defaultValue={editingRecord.usageLocation}
                />
              </div>

              <div className="form-group">
                <label htmlFor="cuttingEmployee">Cutting Employee</label>
                <input
                  type="text"
                  id="cuttingEmployee"
                  name="cuttingEmployee"
                  defaultValue={editingRecord.cuttingEmployee}
                />
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