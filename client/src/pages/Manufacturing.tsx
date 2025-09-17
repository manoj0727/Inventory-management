import { useState, useEffect } from 'react'
import '../styles/common.css'
import { API_URL } from '@/config/api'

interface ManufacturingOrder {
  cuttingId: string
  productName: string
  quantity: string
  quantityReceive: string
  dateOfReceive: string
  tailorName: string
  status: string
  notes: string
}

interface CuttingRecord {
  _id: string
  id: string
  productName: string
  piecesCount: number
  fabricType: string
  cuttingGivenTo: string
  sizeType: string
  totalSquareMetersUsed: number
}

interface ManufacturingRecord {
  _id: string
  manufacturingId: string
  cuttingId: string
  productName: string
  quantity: number
  size: string
  quantityReceive: number
  quantityRemaining: number
  dateOfReceive: string
  tailorName: string
  status: string
  createdAt: string
}

export default function Manufacturing() {
  const [formData, setFormData] = useState<ManufacturingOrder>({
    cuttingId: '',
    productName: '',
    quantity: '',
    quantityReceive: '',
    dateOfReceive: '',
    tailorName: '',
    status: 'Pending',
    notes: ''
  })
  const [cuttingRecords, setCuttingRecords] = useState<CuttingRecord[]>([])
  const [cuttingSuggestions, setCuttingSuggestions] = useState<CuttingRecord[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [manufacturingRecords, setManufacturingRecords] = useState<ManufacturingRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingRecords, setIsLoadingRecords] = useState(false)

  const fetchCuttingRecords = async () => {
    try {
      const response = await fetch(`${API_URL}/api/cutting-records`)
      if (response.ok) {
        const records = await response.json()
        setCuttingRecords(records)
      }
    } catch (error) {
      console.error('Error fetching cutting records:', error)
    }
  }

  const fetchManufacturingRecords = async () => {
    setIsLoadingRecords(true)
    try {
      const response = await fetch(`${API_URL}/api/manufacturing-orders`)
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

  const handleCuttingIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const newFormData = { ...formData, cuttingId: value }

    // Show suggestions if input has 2 or more characters
    if (value.length >= 2) {
      const filtered = cuttingRecords.filter(record =>
        record.id.toLowerCase().includes(value.toLowerCase()) ||
        record.productName.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 5) // Show max 5 suggestions
      setCuttingSuggestions(filtered)
      setShowSuggestions(true)
    } else {
      setShowSuggestions(false)
      setCuttingSuggestions([])
    }

    // Auto-fill fields when cutting ID matches exactly
    const selectedRecord = cuttingRecords.find(record => record.id.toUpperCase() === value.toUpperCase())
    if (selectedRecord) {
      newFormData.productName = selectedRecord.productName
      newFormData.quantity = selectedRecord.piecesCount.toString()
      newFormData.quantityReceive = selectedRecord.piecesCount.toString()
      newFormData.tailorName = selectedRecord.cuttingGivenTo || ''
    }

    setFormData(newFormData)
  }

  const handleSuggestionSelect = (record: CuttingRecord) => {
    setFormData({
      ...formData,
      cuttingId: record.id,
      productName: record.productName,
      quantity: record.piecesCount.toString(),
      quantityReceive: record.piecesCount.toString(),
      tailorName: record.cuttingGivenTo || ''
    })
    setShowSuggestions(false)
    setCuttingSuggestions([])
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
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
        quantityReceive: parseInt(formData.quantityReceive),
        dateOfReceive: formData.dateOfReceive,
        tailorName: formData.tailorName,
        priority: 'Normal',
        status: formData.status,
        notes: formData.notes
      }
      
      const response = await fetch(`${API_URL}/api/manufacturing-orders`, {
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
          quantityReceive: '',
          dateOfReceive: '',
          tailorName: '',
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
            <div className="form-group" style={{ position: 'relative' }}>
              <label htmlFor="cuttingId">Cutting ID *</label>
              <input
                type="text"
                id="cuttingId"
                name="cuttingId"
                value={formData.cuttingId}
                onChange={handleCuttingIdChange}
                placeholder="Enter cutting ID (e.g., CUTTSH001)"
                required
                autoComplete="off"
              />
              {showSuggestions && cuttingSuggestions.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: 'white',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  zIndex: 1000,
                  maxHeight: '200px',
                  overflowY: 'auto'
                }}>
                  {cuttingSuggestions.map((record) => (
                    <div
                      key={record._id}
                      onClick={() => handleSuggestionSelect(record)}
                      style={{
                        padding: '8px 12px',
                        cursor: 'pointer',
                        borderBottom: '1px solid #f3f4f6',
                        fontSize: '14px'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f3f4f6'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'white'
                      }}
                    >
                      <div style={{ fontWeight: '500' }}>{record.id}</div>
                      <div style={{ color: '#6b7280', fontSize: '12px' }}>
                        {record.productName} - {record.piecesCount} pieces - {record.fabricType}
                      </div>
                    </div>
                  ))}
                </div>
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
              <label htmlFor="quantity">Quantity to Manufacture</label>
              <input
                type="number"
                id="quantity"
                name="quantity"
                value={formData.quantity}
                placeholder="Auto-filled from cutting record"
                readOnly
                style={{ background: '#f9fafb', color: '#6b7280' }}
              />
            </div>

            <div className="form-group">
              <label htmlFor="quantityReceive">Quantity Receive *</label>
              <input
                type="number"
                id="quantityReceive"
                name="quantityReceive"
                value={formData.quantityReceive}
                onChange={handleChange}
                placeholder="Quantity received from tailor"
                min="0"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="dateOfReceive">Date of Receive *</label>
              <input
                type="date"
                id="dateOfReceive"
                name="dateOfReceive"
                value={formData.dateOfReceive}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="tailorName">Tailor Name</label>
              <input
                type="text"
                id="tailorName"
                name="tailorName"
                value={formData.tailorName}
                placeholder="Auto-filled from cutting record"
                readOnly
                style={{ background: '#f9fafb', color: '#6b7280' }}
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
              {isLoading ? 'Submitting...' : 'Submit'}
            </button>
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={() => setFormData({
                cuttingId: '',
                productName: '',
                quantity: '',
                quantityReceive: '',
                dateOfReceive: '',
                tailorName: '',
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
                <th style={{ textAlign: 'center' }}>Manufacturing ID</th>
                <th style={{ textAlign: 'center' }}>Product</th>
                <th style={{ textAlign: 'center' }}>Quantity</th>
                <th style={{ textAlign: 'center' }}>Size</th>
                <th style={{ textAlign: 'center' }}>Quantity Receive</th>
                <th style={{ textAlign: 'center' }}>Quantity Remaining</th>
                <th style={{ textAlign: 'center' }}>Tailor</th>
                <th style={{ textAlign: 'center' }}>Date of Receive</th>
                <th style={{ textAlign: 'center' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingRecords ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                    Loading manufacturing assignments...
                  </td>
                </tr>
              ) : manufacturingRecords.length > 0 ? (
                manufacturingRecords.map((record) => {
                  const quantityRemaining = record.quantity - (record.quantityReceive || 0)
                  const status = quantityRemaining <= 0 ? 'Complete' : 'Pending'

                  return (
                    <tr key={record._id}>
                      <td style={{ fontWeight: '500', textAlign: 'center' }}>{record.manufacturingId || record.cuttingId}</td>
                      <td style={{ textAlign: 'center' }}>{record.productName}</td>
                      <td style={{ textAlign: 'center' }}>{record.quantity}</td>
                      <td style={{ textAlign: 'center' }}>{record.size || 'N/A'}</td>
                      <td style={{ textAlign: 'center' }}>{record.quantityReceive || 0}</td>
                      <td style={{ textAlign: 'center' }}>{quantityRemaining}</td>
                      <td style={{ textAlign: 'center' }}>{record.tailorName}</td>
                      <td style={{ textAlign: 'center' }}>{formatDate(record.dateOfReceive)}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`badge ${
                          status === 'Complete' ? 'badge-success' : 'badge-warning'
                        }`}>
                          {status}
                        </span>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
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