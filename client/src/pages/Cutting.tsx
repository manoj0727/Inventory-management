import { useState } from 'react'
import '../styles/common.css'

interface CuttingForm {
  fabricId: string
  productName: string
  piecesCount: string
  meterPerPiece: string
  totalMetersUsed: string
  usageLocation: string
  cuttingEmployee: string
  cuttingDate: string
  notes: string
}

interface Fabric {
  id: string
  type: string
  color: string
  available: number
}

export default function Cutting() {
  const [formData, setFormData] = useState<CuttingForm>({
    fabricId: '',
    productName: '',
    piecesCount: '',
    meterPerPiece: '',
    totalMetersUsed: '0',
    usageLocation: '',
    cuttingEmployee: '',
    cuttingDate: new Date().toISOString().split('T')[0],
    notes: ''
  })

  const [fabrics] = useState<Fabric[]>([
    { id: 'FAB001', type: 'Cotton', color: 'White', available: 100 },
    { id: 'FAB002', type: 'Silk', color: 'Red', available: 50 },
    { id: 'FAB003', type: 'Denim', color: 'Blue', available: 10 },
    { id: 'FAB005', type: 'Linen', color: 'Beige', available: 75 }
  ])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    const newFormData = { ...formData, [name]: value }
    
    // Calculate total meters when pieces or meter per piece changes
    if (name === 'piecesCount' || name === 'meterPerPiece') {
      const pieces = name === 'piecesCount' ? parseFloat(value) : parseFloat(formData.piecesCount)
      const meterPerPiece = name === 'meterPerPiece' ? parseFloat(value) : parseFloat(formData.meterPerPiece)
      
      if (!isNaN(pieces) && !isNaN(meterPerPiece)) {
        newFormData.totalMetersUsed = (pieces * meterPerPiece).toFixed(2)
      } else {
        newFormData.totalMetersUsed = '0'
      }
    }
    
    setFormData(newFormData)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const selectedFabric = fabrics.find(f => f.id === formData.fabricId)
    if (selectedFabric && parseFloat(formData.totalMetersUsed) > selectedFabric.available) {
      alert('❌ Error: Not enough fabric available!')
      return
    }
    
    console.log('Cutting Record:', formData)
    alert('✅ Cutting record added successfully!')
    
    // Reset form
    setFormData({
      fabricId: '',
      productName: '',
      piecesCount: '',
      meterPerPiece: '',
      totalMetersUsed: '0',
      usageLocation: '',
      cuttingEmployee: '',
      cuttingDate: new Date().toISOString().split('T')[0],
      notes: ''
    })
  }

  const selectedFabric = fabrics.find(f => f.id === formData.fabricId)

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Fabric Cutting</h1>
        <p>Record fabric cutting operations</p>
      </div>

      <div className="content-card">
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="fabricId">Select Fabric *</label>
              <select
                id="fabricId"
                name="fabricId"
                value={formData.fabricId}
                onChange={handleChange}
                required
              >
                <option value="">Choose a fabric</option>
                {fabrics.map(fabric => (
                  <option key={fabric.id} value={fabric.id}>
                    {fabric.id} - {fabric.type} ({fabric.color}) - {fabric.available}m available
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="productName">Product Name *</label>
              <input
                type="text"
                id="productName"
                name="productName"
                value={formData.productName}
                onChange={handleChange}
                placeholder="e.g., T-Shirt, Dress, Pants"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="piecesCount">Number of Pieces *</label>
              <input
                type="number"
                id="piecesCount"
                name="piecesCount"
                value={formData.piecesCount}
                onChange={handleChange}
                placeholder="Number of pieces to cut"
                min="1"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="meterPerPiece">Meters per Piece *</label>
              <input
                type="number"
                id="meterPerPiece"
                name="meterPerPiece"
                value={formData.meterPerPiece}
                onChange={handleChange}
                placeholder="Meters required per piece"
                min="0.1"
                step="0.1"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="totalMetersUsed">Total Meters Used</label>
              <input
                type="text"
                id="totalMetersUsed"
                name="totalMetersUsed"
                value={formData.totalMetersUsed + 'm'}
                readOnly
              />
            </div>

            <div className="form-group">
              <label htmlFor="usageLocation">Usage Location *</label>
              <input
                type="text"
                id="usageLocation"
                name="usageLocation"
                value={formData.usageLocation}
                onChange={handleChange}
                placeholder="e.g., Production Line A, Tailor Station 1"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="cuttingEmployee">Cutting Employee *</label>
              <input
                type="text"
                id="cuttingEmployee"
                name="cuttingEmployee"
                value={formData.cuttingEmployee}
                onChange={handleChange}
                placeholder="Employee name"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="cuttingDate">Cutting Date *</label>
              <input
                type="date"
                id="cuttingDate"
                name="cuttingDate"
                value={formData.cuttingDate}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Any additional notes about the cutting operation"
              rows={3}
              style={{ resize: 'vertical' }}
            />
          </div>

          {selectedFabric && parseFloat(formData.totalMetersUsed) > 0 && (
            <div className="content-card" style={{ background: '#f0f9ff', border: '1px solid #0284c7', marginBottom: '20px' }}>
              <h3 style={{ marginTop: 0, color: '#0284c7' }}>Fabric Availability Check</h3>
              <p>Selected Fabric: <strong>{selectedFabric.type} - {selectedFabric.color}</strong></p>
              <p>Available: <strong>{selectedFabric.available}m</strong></p>
              <p>Required: <strong>{formData.totalMetersUsed}m</strong></p>
              <p>Remaining After Cut: <strong>{(selectedFabric.available - parseFloat(formData.totalMetersUsed)).toFixed(2)}m</strong></p>
              {parseFloat(formData.totalMetersUsed) > selectedFabric.available && (
                <p style={{ color: '#dc2626', fontWeight: 'bold' }}>
                  ⚠️ Not enough fabric available!
                </p>
              )}
            </div>
          )}

          <div className="btn-group">
            <button type="submit" className="btn btn-primary">
              Submit Cutting Record
            </button>
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={() => setFormData({
                fabricId: '',
                productName: '',
                piecesCount: '',
                meterPerPiece: '',
                totalMetersUsed: '0',
                usageLocation: '',
                cuttingEmployee: '',
                cuttingDate: new Date().toISOString().split('T')[0],
                notes: ''
              })}
            >
              Clear Form
            </button>
          </div>
        </form>
      </div>

      {/* Recent Cutting Records */}
      <div className="content-card">
        <h2 style={{ marginBottom: '20px', color: '#374151' }}>Today's Cutting Records</h2>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Cutting ID</th>
                <th>Fabric</th>
                <th>Product</th>
                <th>Pieces</th>
                <th>Total Used</th>
                <th>Employee</th>
                <th>Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>CUT001</td>
                <td>Cotton - White</td>
                <td>T-Shirt</td>
                <td>50</td>
                <td>25m</td>
                <td>John Doe</td>
                <td>09:30 AM</td>
                <td><span className="badge badge-success">Completed</span></td>
              </tr>
              <tr>
                <td>CUT002</td>
                <td>Silk - Red</td>
                <td>Dress</td>
                <td>20</td>
                <td>30m</td>
                <td>Jane Smith</td>
                <td>11:15 AM</td>
                <td><span className="badge badge-success">Completed</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}