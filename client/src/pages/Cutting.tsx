import { useState, useEffect } from 'react'
import '../styles/common.css'

interface CuttingForm {
  productId: string
  productName: string
  pieceLength: string
  pieceWidth: string
  piecesCount: string
  totalSquareMetersUsed: string
  usageLocation: string
  cuttingEmployee: string
  cuttingDate: string
  notes: string
}

interface Fabric {
  _id: string
  productId: string
  fabricType: string
  color: string
  quality: string
  length: number
  width: number
  quantity: number
  supplier: string
  purchasePrice: number
  location: string
  notes: string
  status: string
}

export default function Cutting() {
  const [formData, setFormData] = useState<CuttingForm>({
    productId: '',
    productName: '',
    pieceLength: '',
    pieceWidth: '',
    piecesCount: '',
    totalSquareMetersUsed: '0',
    usageLocation: '',
    cuttingEmployee: '',
    cuttingDate: new Date().toISOString().split('T')[0],
    notes: ''
  })

  const [fabrics, setFabrics] = useState<Fabric[]>([])
  const [selectedFabric, setSelectedFabric] = useState<Fabric | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  const generateCuttingId = (productName: string, color: string) => {
    const productCode = productName.substring(0, 3).toUpperCase()
    const colorCode = color.substring(0, 2).toUpperCase()
    const randomNumber = Math.floor(Math.random() * 9000) + 1000 // 4-digit random number
    return `CUT${productCode}${colorCode}${randomNumber}`
  }

  const generateProductId = (name: string, color: string, quantity: number) => {
    const nameCode = name.substring(0, 3).toUpperCase()
    const colorCode = color.substring(0, 2).toUpperCase()
    const quantityCode = quantity.toString().padStart(3, '0')
    return `${nameCode}${colorCode}${quantityCode}`
  }

  const fetchFabrics = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/fabrics')
      if (response.ok) {
        const fabricsData = await response.json()
        setFabrics(fabricsData)
      }
    } catch (error) {
      console.error('Error fetching fabrics:', error)
    }
  }

  const fetchFabricByProductId = async (productId: string) => {
    if (!productId.trim()) {
      setSelectedFabric(null)
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('http://localhost:4000/api/fabrics')
      if (response.ok) {
        const fabricsData = await response.json()
        const fabric = fabricsData.find((f: Fabric) => 
          f.productId === productId.toUpperCase() || 
          generateProductId(f.fabricType, f.color, Math.floor(f.quantity)) === productId.toUpperCase()
        )
        
        if (fabric) {
          setSelectedFabric(fabric)
        } else {
          setSelectedFabric(null)
          alert('❌ Fabric not found with this Product ID')
        }
      }
    } catch (error) {
      console.error('Error fetching fabric:', error)
      setSelectedFabric(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchFabrics()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    const newFormData = { ...formData, [name]: value }
    
    // Fetch fabric when product ID changes
    if (name === 'productId') {
      fetchFabricByProductId(value)
    }
    
    // Calculate total square meters when piece dimensions or count changes
    if (name === 'pieceLength' || name === 'pieceWidth' || name === 'piecesCount') {
      const length = name === 'pieceLength' ? parseFloat(value) : parseFloat(formData.pieceLength)
      const width = name === 'pieceWidth' ? parseFloat(value) : parseFloat(formData.pieceWidth)
      const pieces = name === 'piecesCount' ? parseFloat(value) : parseFloat(formData.piecesCount)
      
      if (!isNaN(length) && !isNaN(width) && !isNaN(pieces) && length > 0 && width > 0 && pieces > 0) {
        const squareMetersPerPiece = length * width
        const totalSquareMeters = squareMetersPerPiece * pieces
        newFormData.totalSquareMetersUsed = totalSquareMeters.toFixed(2)
      } else {
        newFormData.totalSquareMetersUsed = '0'
      }
    }
    
    setFormData(newFormData)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedFabric) {
      alert('❌ Please select a valid fabric first!')
      return
    }
    
    const totalUsed = parseFloat(formData.totalSquareMetersUsed)
    if (totalUsed > selectedFabric.quantity) {
      alert('❌ Error: Not enough fabric available!')
      return
    }
    
    try {
      // Generate unique cutting ID
      const cuttingId = generateCuttingId(formData.productName, selectedFabric.color)
      
      // Create cutting record
      const cuttingRecord = {
        id: cuttingId,
        productId: formData.productId,
        fabricType: selectedFabric.fabricType,
        fabricColor: selectedFabric.color,
        productName: formData.productName,
        piecesCount: parseInt(formData.piecesCount),
        pieceLength: parseFloat(formData.pieceLength),
        pieceWidth: parseFloat(formData.pieceWidth),
        totalSquareMetersUsed: totalUsed,
        usageLocation: formData.usageLocation,
        cuttingEmployee: formData.cuttingEmployee,
        date: formData.cuttingDate,
        time: new Date().toLocaleTimeString(),
        status: 'Completed',
        notes: formData.notes
      }
      
      // Save the cutting record to database
      const cuttingResponse = await fetch('http://localhost:4000/api/cutting-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cuttingRecord)
      })
      
      if (!cuttingResponse.ok) {
        console.error('Failed to save cutting record')
      }
      
      // Update fabric inventory by reducing the quantity
      const newQuantity = selectedFabric.quantity - totalUsed
      const updateResponse = await fetch(`http://localhost:4000/api/fabrics/${selectedFabric._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fabricType: selectedFabric.fabricType,
          color: selectedFabric.color,
          quality: selectedFabric.quality,
          length: selectedFabric.length,
          width: selectedFabric.width,
          quantity: newQuantity,
          supplier: selectedFabric.supplier,
          purchasePrice: selectedFabric.purchasePrice,
          location: selectedFabric.location,
          notes: selectedFabric.notes
        })
      })
      
      if (updateResponse.ok) {
        alert(`✅ Cutting record ${cuttingId} added successfully! Fabric inventory updated.`)
        
        // Reset form
        setFormData({
          productId: '',
          productName: '',
          pieceLength: '',
          pieceWidth: '',
          piecesCount: '',
          totalSquareMetersUsed: '0',
          usageLocation: '',
          cuttingEmployee: '',
          cuttingDate: new Date().toISOString().split('T')[0],
          notes: ''
        })
        setSelectedFabric(null)
        
        // Refresh fabric list
        fetchFabrics()
      } else {
        alert('❌ Error updating fabric inventory. Please try again.')
      }
    } catch (error) {
      console.error('Error updating fabric inventory:', error)
      alert('❌ Error updating fabric inventory. Please try again.')
    }
  }


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
              <label htmlFor="productId">Fabric Product ID *</label>
              <input
                type="text"
                id="productId"
                name="productId"
                value={formData.productId}
                onChange={handleChange}
                placeholder="Enter Product ID (e.g., COTBL025)"
                required
              />
              {isLoading && <small style={{ color: '#6b7280' }}>Looking up fabric...</small>}
              {selectedFabric && (
                <small style={{ color: '#10b981', fontWeight: '500' }}>
                  ✓ Found: {selectedFabric.fabricType} - {selectedFabric.color} ({selectedFabric.quantity} sq.m available)
                </small>
              )}
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
              <label htmlFor="pieceLength">Piece Length (meters) *</label>
              <input
                type="number"
                id="pieceLength"
                name="pieceLength"
                value={formData.pieceLength}
                onChange={handleChange}
                placeholder="Length of each piece"
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
                value={formData.pieceWidth}
                onChange={handleChange}
                placeholder="Width of each piece"
                min="0.1"
                step="0.1"
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
                placeholder="How many pieces to cut"
                min="1"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="totalSquareMetersUsed">Total Square Meters Used</label>
              <input
                type="text"
                id="totalSquareMetersUsed"
                name="totalSquareMetersUsed"
                value={formData.totalSquareMetersUsed + ' sq.m'}
                placeholder="Calculated automatically"
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

          {selectedFabric && parseFloat(formData.totalSquareMetersUsed) > 0 && (
            <div className="content-card" style={{ background: '#f0f9ff', border: '1px solid #0284c7', marginBottom: '20px' }}>
              <h3 style={{ marginTop: 0, color: '#0284c7' }}>Fabric Availability Check</h3>
              <p>Selected Fabric: <strong>{selectedFabric.fabricType} - {selectedFabric.color}</strong></p>
              <p>Available: <strong>{selectedFabric.quantity} sq.m</strong></p>
              <p>Required: <strong>{formData.totalSquareMetersUsed} sq.m</strong></p>
              <p>Remaining After Cut: <strong>{(selectedFabric.quantity - parseFloat(formData.totalSquareMetersUsed)).toFixed(2)} sq.m</strong></p>
              {parseFloat(formData.totalSquareMetersUsed) > selectedFabric.quantity && (
                <p style={{ color: '#dc2626', fontWeight: 'bold' }}>
                  ⚠️ Not enough fabric available!
                </p>
              )}
              {formData.pieceLength && formData.pieceWidth && formData.piecesCount && (
                <div style={{ marginTop: '10px', padding: '10px', background: '#ffffff', borderRadius: '5px' }}>
                  <strong>Cutting Details:</strong>
                  <p>Each piece: {formData.pieceLength}m × {formData.pieceWidth}m = {(parseFloat(formData.pieceLength) * parseFloat(formData.pieceWidth)).toFixed(2)} sq.m</p>
                  <p>Total pieces: {formData.piecesCount}</p>
                  <p>Product: {formData.productName}</p>
                </div>
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
              onClick={() => {
                setFormData({
                  productId: '',
                  productName: '',
                  pieceLength: '',
                  pieceWidth: '',
                  piecesCount: '',
                  totalSquareMetersUsed: '0',
                  usageLocation: '',
                  cuttingEmployee: '',
                  cuttingDate: new Date().toISOString().split('T')[0],
                  notes: ''
                })
                setSelectedFabric(null)
              }}
            >
              Clear Form
            </button>
          </div>
        </form>
      </div>

      {/* Recent Cutting Records */}
      <div className="content-card">
        <h2 style={{ marginBottom: '20px', color: '#374151' }}>Recent Cutting Records</h2>
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
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                  No cutting records found
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}