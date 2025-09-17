import { useState, useEffect } from 'react'
import QRCode from 'qrcode'
import '../styles/common.css'
import { API_URL } from '@/config/api'

interface ManufacturingRecord {
  _id: string
  id: string
  manufacturingId?: string
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
  status: string
  notes?: string
  createdAt: string
  updatedAt?: string
  color?: string
  size?: string
  isGenerated?: boolean
  qrCodeData?: string
}

export default function GenerateQR() {
  const [manufacturingRecords, setManufacturingRecords] = useState<ManufacturingRecord[]>([])
  const [qrCodeCache, setQrCodeCache] = useState<Map<string, string>>(new Map())
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [editingRecord, setEditingRecord] = useState<ManufacturingRecord | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showManualForm, setShowManualForm] = useState(false)
  const [manualEntryMode, setManualEntryMode] = useState<'manufacturing' | 'custom'>('manufacturing')
  const [manufacturingIds, setManufacturingIds] = useState<string[]>([])
  const [selectedManufacturingId, setSelectedManufacturingId] = useState('')

  const fetchManufacturingRecords = async () => {
    setIsLoading(true)
    try {
      // Load QR products from database
      const response = await fetch(`${API_URL}/api/qr-products`)
      if (response.ok) {
        const records = await response.json()
        // Map the QR products to match the interface
        const mappedRecords = records.map((record: any) => ({
          _id: record._id,
          id: record.productId,
          manufacturingId: record.manufacturingId,
          productId: record.productId,
          productName: record.productName,
          cuttingId: record.cuttingId || 'MANUAL',
          quantity: record.quantity,
          quantityProduced: record.quantity,
          quantityRemaining: 0,
          tailorName: record.tailorName,
          tailorMobile: '',
          startDate: record.generatedDate,
          completedDate: record.generatedDate,
          dueDate: record.generatedDate,
          status: 'Completed',
          notes: record.notes,
          createdAt: record.createdAt,
          updatedAt: record.updatedAt,
          color: record.color,
          size: record.size,
          isGenerated: true,
          qrCodeData: record.qrCodeData
        }))
        setManufacturingRecords(mappedRecords)
      } else {
        console.error('Failed to fetch QR products')
        setManufacturingRecords([])
      }
    } catch (error) {
      console.error('Error fetching QR products:', error)
      setManufacturingRecords([])
    } finally {
      setIsLoading(false)
    }
  }

  const fetchManufacturingIds = async () => {
    try {
      // Get available manufacturing IDs (not yet QR generated)
      const response = await fetch(`${API_URL}/api/qr-products/available/manufacturing-ids`)
      if (response.ok) {
        const records = await response.json()
        const ids = records.map((record: any) => record.manufacturingId || record.id).filter(Boolean)
        setManufacturingIds(ids)
      }
    } catch (error) {
      console.error('Error fetching manufacturing IDs:', error)
    }
  }

  useEffect(() => {
    fetchManufacturingRecords()
    fetchManufacturingIds()
  }, [])

  const formatDate = (dateString: string) => {
    if (!dateString) return '-'
    try {
      const date = new Date(dateString)
      const day = date.getDate().toString().padStart(2, '0')
      const month = (date.getMonth() + 1).toString().padStart(2, '0')
      const year = date.getFullYear()
      return `${day}/${month}/${year}`
    } catch (error) {
      return '-'
    }
  }

  const generateQRCode = async (record: ManufacturingRecord) => {
    try {
      setIsGenerating(true)

      // Create QR code data with product information
      const actualQuantity = record.quantityProduced > 0 ? record.quantityProduced : record.quantity
      const qrData = {
        type: 'MANUFACTURED_PRODUCT',
        manufacturingId: record.manufacturingId || record.id,
        productId: record.productId,
        productName: record.productName,
        cuttingId: record.cuttingId,
        quantity: actualQuantity,
        tailorName: record.tailorName,
        completedDate: record.completedDate || new Date().toISOString().split('T')[0],
        color: record.color || 'N/A',
        size: record.size || 'N/A'
      }

      // Generate QR code as data URL
      const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(qrData), {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: 256
      })

      // Save QR product to database
      const qrProductData = {
        productId: record.manufacturingId || record.id,
        manufacturingId: record.manufacturingId || record.id,
        productName: record.productName,
        color: record.color || qrData.color,
        size: record.size || qrData.size,
        quantity: actualQuantity,
        tailorName: record.tailorName,
        qrCodeData: qrCodeDataUrl,
        generatedDate: new Date().toISOString().split('T')[0],
        cuttingId: record.cuttingId,
        notes: record.notes || ''
      }

      try {
        const saveResponse = await fetch(`${API_URL}/api/qr-products`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(qrProductData)
        })

        if (saveResponse.ok) {
          const savedProduct = await saveResponse.json()

          // Update local state if it's a new product
          if (!record.qrCodeData) {
            const updatedRecord = { ...record, isGenerated: true, qrCodeData: qrCodeDataUrl }
            const existingIndex = manufacturingRecords.findIndex(r => r._id === record._id)

            if (existingIndex >= 0) {
              // Update existing record
              const updatedRecords = [...manufacturingRecords]
              updatedRecords[existingIndex] = updatedRecord
              setManufacturingRecords(updatedRecords)
            } else {
              // Add new record
              setManufacturingRecords([updatedRecord, ...manufacturingRecords])
            }
          }

          // Refresh available manufacturing IDs
          await fetchManufacturingIds()
        }
      } catch (error) {
        console.error('Error saving QR product:', error)
      }

      // Create transaction record
      const transactionData = {
        type: 'QR_GENERATED',
        itemType: 'QR_GENERATED',
        itemName: record.productName,
        itemId: record.manufacturingId || record.id,
        action: 'QR_GENERATED',
        quantity: actualQuantity,
        previousStock: 0,
        newStock: 0,
        performedBy: 'system',
        source: 'QR_GENERATION',
        productInfo: qrData,
        timestamp: new Date().toISOString()
      }

      try {
        await fetch(`${API_URL}/api/transactions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(transactionData)
        })
      } catch (error) {
        console.error('Error creating transaction record:', error)
      }

      alert('✅ QR code generated successfully!')
    } catch (error) {
      console.error('Error generating QR code:', error)
      alert('❌ Error generating QR code. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleEdit = (record: ManufacturingRecord) => {
    setEditingRecord(record)
    setShowEditModal(true)
  }

  const handleDelete = async (record: ManufacturingRecord) => {
    if (window.confirm(`Are you sure you want to delete QR product ${record.id || record.manufacturingId}?`)) {
      try {
        const deleteResponse = await fetch(`${API_URL}/api/qr-products/${record._id}`, {
          method: 'DELETE'
        })

        if (deleteResponse.ok) {
          alert('✅ QR product deleted successfully!')
          // Remove from local state
          setManufacturingRecords(manufacturingRecords.filter(r => r._id !== record._id))
          // Refresh available manufacturing IDs
          await fetchManufacturingIds()
        } else {
          alert('❌ Error deleting QR product. Please try again.')
        }
      } catch (error) {
        console.error('Error deleting QR product:', error)
        alert('❌ Error deleting QR product. Please try again.')
      }
    }
  }

  const handleSaveEdit = async (updatedData: any) => {
    if (!editingRecord) return

    try {
      const response = await fetch(`${API_URL}/api/manufacturing-inventory/${editingRecord._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData)
      })
      
      if (response.ok) {
        alert('✅ Manufacturing record updated successfully!')
        setShowEditModal(false)
        setEditingRecord(null)
        fetchManufacturingRecords()
        // Clear cache for this record since data changed
        const oldCacheKey = `${editingRecord.id}_${editingRecord.quantityProduced > 0 ? editingRecord.quantityProduced : editingRecord.quantity}_${editingRecord.completedDate || 'no-date'}`
        const newCache = new Map(qrCodeCache)
        newCache.delete(oldCacheKey)
        setQrCodeCache(newCache)
      } else {
        alert('❌ Error updating manufacturing record. Please try again.')
      }
    } catch (error) {
      console.error('Error updating manufacturing record:', error)
      alert('❌ Error updating manufacturing record. Please try again.')
    }
  }

  const generateManualQR = async (formData: any) => {
    try {
      setIsGenerating(true)

      let qrData: any
      let newRecord: ManufacturingRecord

      if (manualEntryMode === 'manufacturing') {
        // Find the manufacturing record for the selected ID
        const manufacturingRecord = await fetch(`${API_URL}/api/manufacturing-orders`)
          .then(res => res.json())
          .then(records => records.find((r: any) => (r.manufacturingId || r.id) === selectedManufacturingId))

        if (manufacturingRecord) {
          // Generate QR for existing manufacturing record
          const updatedRecord = {
            ...manufacturingRecord,
            _id: manufacturingRecord._id || `temp_${Date.now()}`,
            id: manufacturingRecord.manufacturingId || manufacturingRecord.id,
            manufacturingId: manufacturingRecord.manufacturingId || manufacturingRecord.id,
            quantityProduced: manufacturingRecord.quantityReceive || 0,
            status: 'Completed',
            isGenerated: false
          }

          await generateQRCode(updatedRecord)

          // Add to list if not already present
          if (!manufacturingRecords.find(r => r._id === updatedRecord._id)) {
            setManufacturingRecords([updatedRecord, ...manufacturingRecords])
          }
        } else {
          throw new Error('Manufacturing record not found')
        }
      } else {
        // Generate unique code for manual product
        const uniqueCode = `MAN${Date.now().toString(36).toUpperCase()}`

        // Custom product entry with more fields
        qrData = {
          type: 'CUSTOM_PRODUCT',
          productId: uniqueCode,
          productName: formData.productName,
          quantity: parseInt(formData.quantity),
          color: formData.color || 'N/A',
          size: formData.size || 'N/A',
          notes: formData.notes || '',
          generatedDate: new Date().toISOString().split('T')[0]
        }

        // Create a new record for the manual entry
        newRecord = {
          _id: `manual_${Date.now()}`,
          id: uniqueCode,
          manufacturingId: uniqueCode,
          productId: uniqueCode,
          productName: formData.productName,
          cuttingId: 'MANUAL',
          quantity: parseInt(formData.quantity),
          quantityProduced: parseInt(formData.quantity),
          quantityRemaining: 0,
          tailorName: 'Manual Entry',
          tailorMobile: '',
          startDate: new Date().toISOString().split('T')[0],
          completedDate: new Date().toISOString().split('T')[0],
          dueDate: new Date().toISOString().split('T')[0],
          status: 'Completed',
          color: formData.color || 'N/A',
          size: formData.size || 'N/A',
          notes: formData.notes || '',
          createdAt: new Date().toISOString(),
          isGenerated: false
        }

        // Generate QR code for manual entry
        await generateQRCode(newRecord)

        // Add manual entry to the list
        setManufacturingRecords([newRecord, ...manufacturingRecords])
      }

      setShowManualForm(false)
    } catch (error) {
      console.error('Error generating manual QR code:', error)
      alert('❌ Error generating QR code. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const filteredRecords = manufacturingRecords.filter(record =>
    (record.id || record.manufacturingId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (record.productName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (record.tailorName || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Generate QR Code</h1>
        <p>Generate QR codes for completed manufactured products or create custom QR codes manually</p>
      </div>

      {/* Search and Filters */}
      <div className="content-card">
        <div className="toolbar">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search by manufacturing ID, product name, or tailor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className="btn btn-primary"
              onClick={() => setShowManualForm(true)}
              style={{ backgroundColor: '#8b5cf6', borderColor: '#8b5cf6', color: 'white' }}
            >
              Manual QR Entry
            </button>
            {qrCodeCache.size > 0 && (
              <button
                className="btn btn-secondary"
                onClick={() => setQrCodeCache(new Map())}
                title="Clear cached QR codes"
                style={{ backgroundColor: '#ef4444', borderColor: '#ef4444', color: 'white' }}
              >
                Clear Cache ({qrCodeCache.size})
              </button>
            )}
            <button
              className="btn btn-secondary"
              onClick={fetchManufacturingRecords}
              disabled={isLoading}
              style={{ backgroundColor: '#10b981', borderColor: '#10b981', color: 'white' }}
            >
              {isLoading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      {/* Manufacturing Records List */}
      <div className="content-card">
        <h2 style={{ marginBottom: '20px', color: '#374151' }}>Products QR</h2>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product ID</th>
                  <th>Product Name</th>
                  <th>Color</th>
                  <th>Size</th>
                  <th>Quantity</th>
                  <th>Generated Date</th>
                  <th style={{ textAlign: 'center' }}>QR Code</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.length > 0 ? (
                  filteredRecords.map((record) => (
                    <tr key={record._id}>
                      <td style={{ fontWeight: '500' }}>{record.id || record.manufacturingId}</td>
                      <td>{record.productName}</td>
                      <td>{record.color || 'N/A'}</td>
                      <td>{record.size || 'N/A'}</td>
                      <td>{record.quantityProduced > 0 ? record.quantityProduced : record.quantity}</td>
                      <td>{formatDate(record.completedDate || record.updatedAt || '')}</td>
                      <td style={{ textAlign: 'center' }}>
                        {record.qrCodeData ? (
                          <img
                            src={record.qrCodeData}
                            alt="QR Code"
                            style={{
                              width: '60px',
                              height: '60px',
                              cursor: 'pointer',
                              border: '1px solid #e5e7eb',
                              borderRadius: '4px'
                            }}
                            onClick={() => {
                              const win = window.open('', '_blank')
                              if (win) {
                                win.document.write(`
                                  <html>
                                    <head>
                                      <title>QR Code - ${record.productName}</title>
                                      <style>
                                        @page {
                                          size: 3in 3in;
                                          margin: 0;
                                        }
                                        body {
                                          margin: 0;
                                          padding: 0;
                                          font-family: Arial, sans-serif;
                                          display: flex;
                                          justify-content: center;
                                          align-items: center;
                                          min-height: 100vh;
                                          background: #f0f0f0;
                                        }
                                        .label-container {
                                          background: white;
                                          width: 3in;
                                          height: 3in;
                                          display: flex;
                                          justify-content: center;
                                          align-items: center;
                                          box-sizing: border-box;
                                          page-break-after: always;
                                        }
                                        .qr-code {
                                          width: 2.5in;
                                          height: 2.5in;
                                          max-width: 100%;
                                          max-height: 100%;
                                        }
                                        .actions {
                                          text-align: center;
                                          margin: 20px;
                                        }
                                        .actions button {
                                          padding: 10px 20px;
                                          margin: 0 10px;
                                          font-size: 14px;
                                          cursor: pointer;
                                          background: #3b82f6;
                                          color: white;
                                          border: none;
                                          border-radius: 5px;
                                        }
                                        .actions button:hover {
                                          background: #2563eb;
                                        }
                                        @media print {
                                          body {
                                            background: white;
                                            margin: 0;
                                            padding: 0;
                                          }
                                          .actions {
                                            display: none;
                                          }
                                          .label-container {
                                            margin: 0;
                                          }
                                        }
                                      </style>
                                    </head>
                                    <body>
                                      <div>
                                        <div class="label-container">
                                          <img src="${record.qrCodeData}" class="qr-code" alt="QR Code" />
                                        </div>
                                        <div class="actions">
                                          <button onclick="window.print()">🖨️ Print QR Code</button>
                                          <button onclick="
                                            const a = document.createElement('a');
                                            a.href = '${record.qrCodeData}';
                                            a.download = 'QR_${record.id || record.manufacturingId}.png';
                                            a.click();
                                          ">💾 Download QR Code</button>
                                        </div>
                                      </div>
                                    </body>
                                  </html>
                                `)
                                win.document.close()
                              }
                            }}
                          />
                        ) : (
                          <span style={{ color: '#9ca3af' }}>Not Generated</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div className="action-buttons" style={{ justifyContent: 'center' }}>
                          {!record.qrCodeData && (
                            <button
                              className="btn btn-primary"
                              onClick={() => generateQRCode(record)}
                              disabled={isLoading || isGenerating}
                              style={{
                                marginRight: '8px',
                                backgroundColor: '#8b5cf6',
                                borderColor: '#8b5cf6',
                                color: 'white'
                              }}
                            >
                              {isGenerating ? 'Generating...' : 'Generate QR'}
                            </button>
                          )}
                          <button
                            className="btn btn-secondary"
                            onClick={() => handleEdit(record)}
                            style={{
                              marginRight: '8px',
                              backgroundColor: '#3b82f6',
                              borderColor: '#3b82f6',
                              color: 'white'
                            }}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-danger"
                            onClick={() => handleDelete(record)}
                            style={{
                              backgroundColor: '#ef4444',
                              borderColor: '#ef4444',
                              color: 'white'
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                      {isLoading ? 'Loading completed products...' : 'No completed products available for QR generation'}
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
                quantity: parseInt(formData.get('quantity') as string),
                tailorName: formData.get('tailorName') as string,
                status: formData.get('status') as string
              }
              handleSaveEdit(updatedRecord)
            }}>
              <div className="form-group">
                <label htmlFor="quantity">Total Quantity *</label>
                <input
                  type="number"
                  id="quantity"
                  name="quantity"
                  defaultValue={editingRecord.quantity}
                  min="1"
                  required
                />
              </div>

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

      {/* Manual QR Entry Modal */}
      {showManualForm && (
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
            <h2 style={{ marginBottom: '20px', color: '#374151' }}>Manual QR Code Generation</h2>

            {/* Entry Mode Selection */}
            <div className="form-group">
              <label>Entry Mode</label>
              <div style={{ display: 'flex', gap: '15px', marginTop: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <input
                    type="radio"
                    value="manufacturing"
                    checked={manualEntryMode === 'manufacturing'}
                    onChange={(e) => setManualEntryMode(e.target.value as 'manufacturing' | 'custom')}
                  />
                  Manufacturing ID
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <input
                    type="radio"
                    value="custom"
                    checked={manualEntryMode === 'custom'}
                    onChange={(e) => setManualEntryMode(e.target.value as 'manufacturing' | 'custom')}
                  />
                  Custom Product
                </label>
              </div>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.target as HTMLFormElement)
              const data = Object.fromEntries(formData.entries())
              generateManualQR(data)
            }}>
              {manualEntryMode === 'manufacturing' ? (
                <div className="form-group">
                  <label htmlFor="manufacturingId">Manufacturing ID *</label>
                  <select
                    id="manufacturingId"
                    value={selectedManufacturingId}
                    onChange={(e) => setSelectedManufacturingId(e.target.value)}
                    required
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                  >
                    <option value="">Select Manufacturing ID</option>
                    {manufacturingIds.map((id) => (
                      <option key={id} value={id}>{id}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <>
                  <div className="form-group">
                    <label htmlFor="productName">Product Name *</label>
                    <input
                      type="text"
                      id="productName"
                      name="productName"
                      required
                      placeholder="Enter product name"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="color">Color *</label>
                    <input
                      type="text"
                      id="color"
                      name="color"
                      required
                      placeholder="Enter product color"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="size">Size *</label>
                    <select
                      id="size"
                      name="size"
                      required
                      style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                    >
                      <option value="">Select Size</option>
                      <option value="XS">XS</option>
                      <option value="S">S</option>
                      <option value="M">M</option>
                      <option value="L">L</option>
                      <option value="XL">XL</option>
                      <option value="XXL">XXL</option>
                      <option value="XXXL">XXXL</option>
                      <option value="Free Size">Free Size</option>
                      <option value="Custom">Custom</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="quantity">Quantity *</label>
                    <input
                      type="number"
                      id="quantity"
                      name="quantity"
                      min="1"
                      required
                      placeholder="Enter quantity"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="notes">Notes (Optional)</label>
                    <textarea
                      id="notes"
                      name="notes"
                      rows={3}
                      placeholder="Enter any additional notes"
                      style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db', resize: 'vertical' }}
                    />
                  </div>
                </>
              )}

              <div className="btn-group">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isGenerating || (manualEntryMode === 'manufacturing' && !selectedManufacturingId)}
                >
                  {isGenerating ? 'Generating...' : 'Generate QR Code'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowManualForm(false)
                    setSelectedManufacturingId('')
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