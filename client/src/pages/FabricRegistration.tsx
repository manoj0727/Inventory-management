import { useState } from 'react'
import '../styles/common.css'

interface FabricForm {
  fabricType: string
  color: string
  quality: string
  length: string
  width: string
  quantity: string
  supplier: string
  purchasePrice: string
  location: string
  notes: string
}

export default function FabricRegistration() {
  const [formData, setFormData] = useState<FabricForm>({
    fabricType: '',
    color: '',
    quality: '',
    length: '',
    width: '',
    quantity: '',
    supplier: '',
    purchasePrice: '',
    location: '',
    notes: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch('http://localhost:4000/api/fabrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        await response.json()
        alert('✅ Fabric registered successfully!')
        
        // Reset form
        setFormData({
          fabricType: '',
          color: '',
          quality: '',
          length: '',
          width: '',
          quantity: '',
          supplier: '',
          purchasePrice: '',
          location: '',
          notes: ''
        })
      } else {
        alert('❌ Error registering fabric. Please try again.')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('❌ Error registering fabric. Please try again.')
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    const newFormData = { ...formData, [name]: value }
    
    // Calculate total quantity automatically when length or width changes
    if (name === 'length' || name === 'width') {
      const length = name === 'length' ? parseFloat(value) : parseFloat(formData.length)
      const width = name === 'width' ? parseFloat(value) : parseFloat(formData.width)
      
      if (!isNaN(length) && !isNaN(width) && length > 0 && width > 0) {
        newFormData.quantity = (length * width).toFixed(2)
      } else {
        newFormData.quantity = ''
      }
    }
    
    setFormData(newFormData)
  }

  return (
    <div className="page-container">
      <div className="page-header" style={{ background: '#ffffff', color: '#000000' }}>
        <h1 style={{ color: '#000000' }}>Fabric Registration</h1>
        <p style={{ color: '#333333' }}>Register new fabric inventory</p>
      </div>

      <div className="content-card">
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="fabricType">Fabric Type *</label>
              <input
                type="text"
                id="fabricType"
                name="fabricType"
                value={formData.fabricType}
                onChange={handleChange}
                placeholder="e.g., Cotton, Silk, Denim"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="color">Color *</label>
              <input
                type="text"
                id="color"
                name="color"
                value={formData.color}
                onChange={handleChange}
                placeholder="e.g., Red, Blue, White"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="quality">Quality Grade *</label>
              <select
                id="quality"
                name="quality"
                value={formData.quality}
                onChange={handleChange}
                required
              >
                <option value="">Select Quality</option>
                <option value="Premium">Premium</option>
                <option value="Standard">Standard</option>
                <option value="Economy">Economy</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="length">Length (meters) *</label>
              <input
                type="number"
                id="length"
                name="length"
                value={formData.length}
                onChange={handleChange}
                placeholder="Enter length in meters"
                min="0.1"
                step="0.1"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="width">Width (meters) *</label>
              <input
                type="number"
                id="width"
                name="width"
                value={formData.width}
                onChange={handleChange}
                placeholder="Enter width in meters"
                min="0.1"
                step="0.1"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="quantity">Total Quantity (square meters)</label>
              <input
                type="text"
                id="quantity"
                name="quantity"
                value={formData.quantity ? `${formData.quantity} sq.m` : ''}
                placeholder="Calculated automatically"
                readOnly
              />
            </div>

            <div className="form-group">
              <label htmlFor="purchasePrice">Purchase Price (per meter)</label>
              <input
                type="number"
                id="purchasePrice"
                name="purchasePrice"
                value={formData.purchasePrice}
                onChange={handleChange}
                placeholder="Enter price per meter"
                min="0"
                step="0.01"
              />
            </div>

            <div className="form-group">
              <label htmlFor="supplier">Supplier *</label>
              <input
                type="text"
                id="supplier"
                name="supplier"
                value={formData.supplier}
                onChange={handleChange}
                placeholder="Supplier name"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="location">Storage Location</label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g., Warehouse A, Rack B3"
              />
            </div>

          </div>

          <div className="form-group">
            <label htmlFor="notes">Additional Notes</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Any additional information about the fabric"
              rows={4}
              style={{ resize: 'vertical' }}
            />
          </div>

          <div className="btn-group">
            <button type="submit" className="btn btn-primary">
              Register Fabric
            </button>
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={() => setFormData({
                fabricType: '',
                color: '',
                quality: '',
                length: '',
                width: '',
                quantity: '',
                supplier: '',
                purchasePrice: '',
                location: '',
                notes: ''
              })}
            >
              Clear Form
            </button>
          </div>
        </form>
      </div>

      {/* Recent Registrations */}
      <div className="content-card">
        <h2 style={{ marginBottom: '20px', color: '#374151' }}>Recent Registrations</h2>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Fabric ID</th>
                <th>Type</th>
                <th>Color</th>
                <th>Quality</th>
                <th>Quantity</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>FAB001</td>
                <td>Cotton</td>
                <td>White</td>
                <td>Premium</td>
                <td>100m</td>
                <td>{new Date().toLocaleDateString()}</td>
                <td><span className="badge badge-success">Registered</span></td>
              </tr>
              <tr>
                <td>FAB002</td>
                <td>Silk</td>
                <td>Red</td>
                <td>Premium</td>
                <td>50m</td>
                <td>{new Date().toLocaleDateString()}</td>
                <td><span className="badge badge-success">Registered</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}