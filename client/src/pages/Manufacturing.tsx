import { useState, useEffect } from 'react'
import '../styles/common.css'

// Extend window interface for debounce timer
declare global {
  interface Window {
    debounceTimer: number
  }
}

interface ManufacturingOrder {
  cuttingId: string
  productName: string
  quantity: string
  dueDate: string
  tailorName: string
  tailorMobile: string
  status: string
  notes: string
}

interface CuttingRecord {
  _id: string
  id: string
  productName: string
  piecesCount: number
  status: string
}

interface ManufacturingRecord {
  _id: string
  cuttingId: string
  productName: string
  quantity: number
  dueDate: string
  tailorName: string
  tailorMobile: string
  status: string
  createdAt: string
}

export default function Manufacturing() {
  const [formData, setFormData] = useState<ManufacturingOrder>({
    cuttingId: '',
    productName: '',
    quantity: '',
    dueDate: '',
    tailorName: '',
    tailorMobile: '',
    status: 'Pending',
    notes: ''
  })
  const [cuttingRecords, setCuttingRecords] = useState<CuttingRecord[]>([])
  const [manufacturingRecords, setManufacturingRecords] = useState<ManufacturingRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingRecords, setIsLoadingRecords] = useState(false)

  const fetchCuttingRecords = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/cutting-records')
      if (response.ok) {
        const records = await response.json()
        setCuttingRecords(records.filter((record: CuttingRecord) => record.status === 'Completed'))
      }
    } catch (error) {
      console.error('Error fetching cutting records:', error)
    }
  }

  const fetchManufacturingRecords = async () => {
    setIsLoadingRecords(true)
    try {
      const response = await fetch('http://localhost:4000/api/manufacturing-orders')
      if (response.ok) {
        const records = await response.json()
        setManufacturingRecords(records.slice(0, 10))
      }
    } catch (error) {
      console.error('Error fetching manufacturing records:', error)
    } finally {
      setIsLoadingRecords(false)
    }
  }

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

  const handleCuttingIdChange = async (cuttingId: string) => {
    if (!cuttingId.trim()) {
      setFormData({
        ...formData,
        cuttingId: '',
        productName: '',
        quantity: ''
      })
      return
    }

    try {
      const response = await fetch('http://localhost:4000/api/cutting-records')
      if (response.ok) {
        const records = await response.json()
        const selectedRecord = records.find((record: CuttingRecord) => record.id === cuttingId.toUpperCase())
        
        if (selectedRecord) {
          setFormData({
            ...formData,
            cuttingId: cuttingId.toUpperCase(),
            productName: selectedRecord.productName,
            quantity: selectedRecord.piecesCount.toString()
          })
        } else {
          setFormData({
            ...formData,
            cuttingId: cuttingId.toUpperCase(),
            productName: '',
            quantity: ''
          })
        }
      }
    } catch (error) {
      console.error('Error fetching cutting record:', error)
      setFormData({
        ...formData,
        cuttingId: cuttingId.toUpperCase(),
        productName: '',
        quantity: ''
      })
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    if (name === 'cuttingId') {
      // Update form data immediately for typing experience
      setFormData({
        ...formData,
        cuttingId: value
      })
      // Debounce the API call
      clearTimeout(window.debounceTimer)
      window.debounceTimer = setTimeout(() => {
        handleCuttingIdChange(value)
      }, 500)
    } else {
      setFormData({
        ...formData,
        [name]: value
      })
    }
  }

  useEffect(() => {
    fetchCuttingRecords()
    fetchManufacturingRecords()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setIsLoading(true)
      const manufacturingOrder = {
        cuttingId: formData.cuttingId,
        productName: formData.productName,
        quantity: parseInt(formData.quantity),
        dueDate: formData.dueDate,
        tailorName: formData.tailorName,
        tailorMobile: formData.tailorMobile,
        priority: 'Normal',
        status: formData.status,
        notes: formData.notes
      }
      
      const response = await fetch('http://localhost:4000/api/manufacturing-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(manufacturingOrder)
      })
      
      if (response.ok) {
        alert('✅ Manufacturing order assigned to tailor successfully!')
        
        // Refresh manufacturing records
        fetchManufacturingRecords()
        
        // Reset form
        setFormData({
          cuttingId: '',
          productName: '',
          quantity: '',
          dueDate: '',
          tailorName: '',
          tailorMobile: '',
          status: 'Pending',
          notes: ''
        })
      } else {
        alert('❌ Error creating manufacturing order. Please try again.')
      }
    } catch (error) {
      console.error('Error creating manufacturing order:', error)
      alert('❌ Error creating manufacturing order. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }


  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Manufacturing</h1>
        <p>Create and manage manufacturing orders</p>
      </div>


      {/* Assign Manufacturing to Tailor */}
      <div className="content-card">
        <h2 style={{ marginBottom: '20px', color: '#374151' }}>Assign Manufacturing to Tailor</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="cuttingId">Cutting ID *</label>
              <input
                type="text"
                id="cuttingId"
                name="cuttingId"
                value={formData.cuttingId}
                onChange={handleChange}
                placeholder="Enter cutting ID (e.g., CUTTSH001)"
                required
              />
              {formData.cuttingId && !formData.productName && (
                <small style={{ color: '#ef4444' }}>
                  ❌ Cutting ID not found
                </small>
              )}
              {formData.cuttingId && formData.productName && (
                <small style={{ color: '#10b981' }}>
                  ✅ Found: {formData.productName} ({formData.quantity} pieces)
                </small>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="productName">Product Name</label>
              <input
                type="text"
                id="productName"
                name="productName"
                value={formData.productName}
                placeholder="Auto-filled from cutting record"
                readOnly
                style={{ background: '#f9fafb', color: '#6b7280' }}
              />
            </div>

            <div className="form-group">
              <label htmlFor="quantity">Quantity to Manufacture *</label>
              <input
                type="number"
                id="quantity"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                placeholder="Number of units to manufacture"
                min="1"
                required
              />
            </div>


            <div className="form-group">
              <label htmlFor="dueDate">Due Date *</label>
              <input
                type="date"
                id="dueDate"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="tailorName">Tailor Name *</label>
              <input
                type="text"
                id="tailorName"
                name="tailorName"
                value={formData.tailorName}
                onChange={handleChange}
                placeholder="Enter tailor name"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="tailorMobile">Tailor Mobile Number *</label>
              <input
                type="tel"
                id="tailorMobile"
                name="tailorMobile"
                value={formData.tailorMobile}
                onChange={handleChange}
                placeholder="Enter mobile number"
                required
              />
            </div>

          </div>

          <div className="form-group">
            <label htmlFor="notes">Special Instructions</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Any special instructions for the tailor"
              rows={3}
              style={{ resize: 'vertical' }}
            />
          </div>

          <div className="btn-group">
            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? 'Assigning...' : 'Assign to Tailor'}
            </button>
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={() => setFormData({
                cuttingId: '',
                productName: '',
                quantity: '',
                dueDate: '',
                tailorName: '',
                tailorMobile: '',
                status: 'Pending',
                notes: ''
              })}
            >
              Clear Form
            </button>
          </div>
        </form>
      </div>

      {/* Recent Manufacturing Assignments */}
      <div className="content-card">
        <h2 style={{ marginBottom: '20px', color: '#374151' }}>Recent Manufacturing Assignments</h2>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Cutting ID</th>
                <th>Product</th>
                <th>Quantity</th>
                <th>Tailor</th>
                <th>Mobile</th>
                <th>Due Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingRecords ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                    Loading manufacturing assignments...
                  </td>
                </tr>
              ) : manufacturingRecords.length > 0 ? (
                manufacturingRecords.map((record) => (
                  <tr key={record._id}>
                    <td style={{ fontWeight: '500' }}>{record.cuttingId}</td>
                    <td>{record.productName}</td>
                    <td>{record.quantity}</td>
                    <td>{record.tailorName}</td>
                    <td>{record.tailorMobile}</td>
                    <td>{formatDate(record.dueDate)}</td>
                    <td>
                      <span className={`badge ${
                        record.status === 'Completed' ? 'badge-success' : 
                        record.status === 'In Progress' ? 'badge-info' : 'badge-warning'
                      }`}>
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                    No manufacturing assignments found
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