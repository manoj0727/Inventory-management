import { useState, useEffect } from 'react'
import '../styles/common.css'
import { API_URL } from '@/config/api'

interface Tailor {
  _id: string
  tailorId: string
  name: string
  mobile: string
  address: string
  work: string
  status: string
  joiningDate: string
  totalOrders: number
  completedOrders: number
  pendingOrders: number
}

export default function TailorManagement() {
  const [tailors, setTailors] = useState<Tailor[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingTailor, setEditingTailor] = useState<Tailor | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    address: '',
    work: ''
  })

  useEffect(() => {
    fetchTailors()
  }, [])

  const fetchTailors = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`${API_URL}/api/tailors`)
      if (response.ok) {
        const data = await response.json()
        setTailors(data)
      }
    } catch (error) {
      console.error('Error fetching tailors:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim() || !formData.mobile.trim() || !formData.address.trim() || !formData.work.trim()) {
      alert('Please fill all fields')
      return
    }
    
    setIsLoading(true)
    
    try {
      const url = editingTailor 
        ? `${API_URL}/api/tailors/${editingTailor._id}`
        : `${API_URL}/api/tailors`
      
      const method = editingTailor ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        alert(editingTailor ? 'Tailor updated successfully!' : 'Tailor added successfully!')
        await fetchTailors()
        resetForm()
      } else {
        const error = await response.json()
        alert(error.message || 'Failed to save tailor')
      }
    } catch (error) {
      console.error('Error saving tailor:', error)
      alert('Error saving tailor')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (tailor: Tailor) => {
    setEditingTailor(tailor)
    setFormData({
      name: tailor.name,
      mobile: tailor.mobile,
      address: tailor.address,
      work: tailor.work
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this tailor?')) return
    
    try {
      const response = await fetch(`${API_URL}/api/tailors/${id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        alert('Tailor deleted successfully!')
        fetchTailors()
      }
    } catch (error) {
      alert('Error deleting tailor')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      mobile: '',
      address: '',
      work: ''
    })
    setEditingTailor(null)
    setShowForm(false)
  }

  // Removed unused function

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Tailor Management</h1>
        <p>Manage tailor records and their work details</p>
      </div>

      {/* Add Tailor Button */}
      {!showForm && (
        <div className="content-card" style={{ background: 'white' }}>
          <button onClick={() => setShowForm(true)} className="btn btn-primary">
            + Add New Tailor
          </button>
        </div>
      )}

      {/* Tailor Form */}
      {showForm && (
        <div className="content-card" style={{ background: 'white' }}>
          <h2 style={{ marginBottom: '24px', color: 'black' }}>
            {editingTailor ? 'Edit Tailor' : 'Add New Tailor'}
          </h2>
          
          <form onSubmit={handleSubmit}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(2, 1fr)', 
              gap: '24px',
              marginBottom: '24px'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontWeight: '500', fontSize: '14px', color: 'black' }}>Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  style={{ 
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '15px',
                    color: 'black'
                  }}
                  placeholder="Enter tailor name"
                />
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontWeight: '500', fontSize: '14px', color: 'black' }}>Mobile Number *</label>
                <input
                  type="tel"
                  value={formData.mobile}
                  onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                  required
                  style={{ 
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '15px',
                    color: 'black'
                  }}
                  placeholder="Enter mobile number"
                />
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontWeight: '500', fontSize: '14px', color: 'black' }}>Work Type *</label>
                <input
                  type="text"
                  value={formData.work}
                  onChange={(e) => setFormData({...formData, work: e.target.value})}
                  required
                  style={{ 
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '15px',
                    color: 'black'
                  }}
                  placeholder="e.g., Shirts, Pants, Traditional Wear"
                />
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontWeight: '500', fontSize: '14px', color: 'black' }}>Address *</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  required
                  style={{ 
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '15px',
                    color: 'black'
                  }}
                  placeholder="Enter complete address"
                />
              </div>
            </div>

            <div className="btn-group">
              <button type="submit" className="btn btn-primary" disabled={isLoading}>
                {isLoading ? 'Saving...' : editingTailor ? 'Update Tailor' : 'Add Tailor'}
              </button>
              <button type="button" onClick={resetForm} className="btn btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Statistics */}
      <div className="stats-grid">
        <div className="stat-card" style={{ background: 'white', color: 'black' }}>
          <h3 style={{ color: 'black' }}>Total Tailors</h3>
          <p className="stat-value" style={{ color: 'black', fontSize: '24px', fontWeight: 'bold' }}>
            {tailors.length}
          </p>
        </div>
        <div className="stat-card" style={{ background: 'white', color: 'black' }}>
          <h3 style={{ color: 'black' }}>Active</h3>
          <p className="stat-value" style={{ color: 'black', fontSize: '24px', fontWeight: 'bold' }}>
            {tailors.filter(t => t.status === 'active').length}
          </p>
        </div>
        <div className="stat-card" style={{ background: 'white', color: 'black' }}>
          <h3 style={{ color: 'black' }}>Total Orders</h3>
          <p className="stat-value" style={{ color: 'black', fontSize: '24px', fontWeight: 'bold' }}>
            {tailors.reduce((sum, t) => sum + t.totalOrders, 0)}
          </p>
        </div>
        <div className="stat-card" style={{ background: 'white', color: 'black' }}>
          <h3 style={{ color: 'black' }}>Completed</h3>
          <p className="stat-value" style={{ color: 'black', fontSize: '24px', fontWeight: 'bold' }}>
            {tailors.reduce((sum, t) => sum + t.completedOrders, 0)}
          </p>
        </div>
      </div>

      {/* Tailors List */}
      <div className="content-card" style={{ background: 'white', color: 'black' }}>
        <h2 style={{ marginBottom: '20px', color: 'black' }}>Tailor List</h2>
        <div className="table-container">
          <table className="data-table" style={{ color: 'black' }}>
            <thead>
              <tr>
                <th style={{ color: 'black' }}>ID</th>
                <th style={{ color: 'black' }}>Name</th>
                <th style={{ color: 'black' }}>Mobile</th>
                <th style={{ color: 'black' }}>Address</th>
                <th style={{ color: 'black' }}>Work Type</th>
                <th style={{ color: 'black' }}>Total Orders</th>
                <th style={{ color: 'black' }}>Completed</th>
                <th style={{ color: 'black' }}>Pending</th>
                <th style={{ color: 'black' }}>Status</th>
                <th style={{ color: 'black' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '40px', color: 'black' }}>
                    Loading tailors...
                  </td>
                </tr>
              ) : tailors.length > 0 ? (
                tailors.map(tailor => (
                  <tr key={tailor._id}>
                    <td style={{ fontWeight: '600', color: 'black' }}>{tailor.tailorId}</td>
                    <td style={{ color: 'black' }}>{tailor.name}</td>
                    <td style={{ color: 'black' }}>{tailor.mobile}</td>
                    <td style={{ color: 'black' }}>{tailor.address}</td>
                    <td style={{ color: 'black' }}>{tailor.work}</td>
                    <td style={{ color: 'black' }}>{tailor.totalOrders}</td>
                    <td style={{ color: 'black' }}>{tailor.completedOrders}</td>
                    <td style={{ color: 'black' }}>{tailor.pendingOrders}</td>
                    <td>
                      <span className={`badge ${tailor.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                        {tailor.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button onClick={() => handleEdit(tailor)} className="action-btn edit">
                          Edit
                        </button>
                        <button onClick={() => handleDelete(tailor._id)} className="action-btn delete">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="empty-state">
                    <div className="empty-state-icon">✂️</div>
                    <h3 style={{ color: 'black' }}>No Tailors</h3>
                    <p style={{ color: 'black' }}>Click "Add New Tailor" to get started</p>
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