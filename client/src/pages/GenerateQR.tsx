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

  // Auto-generate QR codes for records without them
  useEffect(() => {
    const generateMissingQRCodes = async () => {
      const recordsWithoutQR = manufacturingRecords.filter(record => !record.qrCodeData && !record.isGenerated)

      for (const record of recordsWithoutQR) {
        // Add a small delay between generations to avoid overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 500))
        await generateQRCode(record)
      }
    }

    if (manufacturingRecords.length > 0 && !isGenerating) {
      generateMissingQRCodes()
    }
  }, [manufacturingRecords])

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
      // Update QR product record
      const response = await fetch(`${API_URL}/api/qr-products/${editingRecord._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData)
      })

      if (response.ok) {
        alert('✅ QR product updated successfully!')
        setShowEditModal(false)
        setEditingRecord(null)

        // Refresh the records
        fetchManufacturingRecords()

        // Clear cache for this record since data changed
        const oldCacheKey = `${editingRecord.id}_${editingRecord.quantityProduced > 0 ? editingRecord.quantityProduced : editingRecord.quantity}_${editingRecord.completedDate || 'no-date'}`
        const newCache = new Map(qrCodeCache)
        newCache.delete(oldCacheKey)
        setQrCodeCache(newCache)

        // If QR code was already generated, regenerate it with updated info
        if (editingRecord.qrCodeData) {
          const updatedRecord = { ...editingRecord, ...updatedData }
          await generateQRCode(updatedRecord)
        }
      } else {
        alert('❌ Error updating QR product. Please try again.')
      }
    } catch (error) {
      console.error('Error updating QR product:', error)
      alert('❌ Error updating QR product. Please try again.')
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
              onClick={() => {
                setManualEntryMode('manufacturing')
                setShowManualForm(true)
              }}
              style={{ backgroundColor: '#8b5cf6', borderColor: '#8b5cf6', color: 'white' }}
            >
              Manual QR Entry
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                setManualEntryMode('custom')
                setShowManualForm(true)
              }}
              style={{ backgroundColor: '#3b82f6', borderColor: '#3b82f6', color: 'white' }}
            >
              Custom Product
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
                  <th style={{ textAlign: 'center' }}>Product ID</th>
                  <th style={{ textAlign: 'center' }}>Product Name</th>
                  <th style={{ textAlign: 'center' }}>Color</th>
                  <th style={{ textAlign: 'center' }}>Size</th>
                  <th style={{ textAlign: 'center' }}>Quantity</th>
                  <th style={{ textAlign: 'center' }}>Generated Date</th>
                  <th style={{ textAlign: 'center' }}>QR Code</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.length > 0 ? (
                  filteredRecords.map((record) => (
                    <tr key={record._id}>
                      <td style={{ fontWeight: '500', textAlign: 'center' }}>{record.id || record.manufacturingId}</td>
                      <td style={{ textAlign: 'center' }}>{record.productName}</td>
                      <td style={{ textAlign: 'center' }}>{record.color || 'N/A'}</td>
                      <td style={{ textAlign: 'center' }}>{record.size || 'N/A'}</td>
                      <td style={{ textAlign: 'center' }}>{record.quantityProduced > 0 ? record.quantityProduced : record.quantity}</td>
                      <td style={{ textAlign: 'center' }}>{formatDate(record.completedDate || record.updatedAt || '')}</td>
                      <td style={{ textAlign: 'center' }}>
                        {record.qrCodeData ? (
                          <div style={{ position: 'relative', display: 'inline-block' }}>
                          <img
                            src={record.qrCodeData}
                            alt="QR Code"
                            title={`${record.productName}\nSize: ${record.size || 'N/A'}\nColor: ${record.color || 'N/A'}\nQty: ${record.quantityProduced > 0 ? record.quantityProduced : record.quantity}\nClick to print label`}
                            style={{
                              width: '60px',
                              height: '60px',
                              cursor: 'pointer',
                              border: '2px solid #e5e7eb',
                              borderRadius: '4px',
                              padding: '2px',
                              background: 'white',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'scale(1.1)'
                              e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.15)'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'scale(1)'
                              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)'
                            }}
                            onClick={() => {
                              const win = window.open('', '_blank')
                              if (win) {
                                const formatPrintDate = (dateStr: string) => {
                                  if (!dateStr) return 'N/A'
                                  try {
                                    const date = new Date(dateStr)
                                    return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear().toString().slice(-2)}`
                                  } catch {
                                    return 'N/A'
                                  }
                                }
                                win.document.write(`
                                  <html>
                                    <head>
                                      <title>QR Label - ${record.productName}</title>
                                      <style>
                                        @page {
                                          size: 2in 2in;
                                          margin: 0;
                                        }
                                        * {
                                          margin: 0;
                                          padding: 0;
                                          box-sizing: border-box;
                                        }
                                        body {
                                          font-family: 'Arial', sans-serif;
                                          background: #f0f0f0;
                                          display: flex;
                                          flex-direction: column;
                                          align-items: center;
                                          justify-content: center;
                                          min-height: 100vh;
                                          padding: 20px;
                                        }
                                        .label-container {
                                          background: white;
                                          width: 2in;
                                          height: 2in;
                                          border: 1px solid #000;
                                          padding: 0.1in;
                                          display: flex;
                                          flex-direction: column;
                                          align-items: center;
                                          justify-content: center;
                                          position: relative;
                                          page-break-after: always;
                                        }
                                        .qr-code {
                                          width: 1.2in;
                                          height: 1.2in;
                                        }
                                        .product-name {
                                          font-size: 14px;
                                          font-weight: bold;
                                          text-align: center;
                                          text-transform: uppercase;
                                          margin-top: 8px;
                                          color: #000;
                                          max-width: 100%;
                                          overflow: hidden;
                                          text-overflow: ellipsis;
                                        }
                                        .size-badge {
                                          display: inline-block;
                                          background: #000;
                                          color: white;
                                          padding: 4px 12px;
                                          border-radius: 4px;
                                          font-weight: bold;
                                          font-size: 16px;
                                          margin-top: 6px;
                                        }
                                        .actions {
                                          text-align: center;
                                          margin: 30px;
                                        }
                                        .actions button {
                                          padding: 12px 24px;
                                          margin: 0 10px;
                                          font-size: 16px;
                                          cursor: pointer;
                                          background: #3b82f6;
                                          color: white;
                                          border: none;
                                          border-radius: 6px;
                                          font-weight: 500;
                                        }
                                        .actions button:hover {
                                          background: #2563eb;
                                          transform: translateY(-1px);
                                          box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                                        }
                                        @media print {
                                          body {
                                            background: white;
                                            margin: 0;
                                            padding: 0;
                                            display: block;
                                          }
                                          .actions {
                                            display: none;
                                          }
                                          .label-container {
                                            margin: 0;
                                            box-shadow: none;
                                            border: 1px solid #000;
                                          }
                                        }
                                      </style>
                                    </head>
                                    <body>
                                      <div class="label-container">
                                        <img src="${record.qrCodeData}" class="qr-code" alt="QR Code" />
                                        <div class="product-name">${record.productName}</div>
                                        <div class="size-badge">SIZE: ${record.size || 'N/A'}</div>
                                      </div>
                                      <div class="actions">
                                        <button onclick="window.print()">🖨️ Print Label</button>
                                      </div>
                                    </body>
                                  </html>
                                `)
                                win.document.close()
                              }
                            }}
                          />
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '16px', animation: 'spin 1s linear infinite' }}>⏳</span>
                            <span style={{ color: '#9ca3af', fontSize: '12px' }}>Generating...</span>
                          </div>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{
                          display: 'flex',
                          gap: '4px',
                          justifyContent: 'center',
                          alignItems: 'center'
                        }}>
                          <button
                            onClick={() => handleEdit(record)}
                            title="Edit Record"
                            style={{
                              padding: '8px',
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: '20px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'scale(1.2)'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'scale(1)'
                            }}
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDelete(record)}
                            title="Delete Record"
                            style={{
                              padding: '8px',
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: '20px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'scale(1.2)'
                              e.currentTarget.style.filter = 'brightness(0.8)'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'scale(1)'
                              e.currentTarget.style.filter = 'brightness(1)'
                            }}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '60px' }}>
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '20px'
                      }}>
                        <span style={{ fontSize: '48px' }}>📦</span>
                        <div>
                          <p style={{ fontSize: '18px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                            {isLoading ? 'Loading products...' : 'No Products Found'}
                          </p>
                          <p style={{ color: '#6b7280', fontSize: '14px' }}>
                            {isLoading ? 'Please wait while we fetch the products' : 'Start by adding products using the buttons above'}
                          </p>
                        </div>
                      </div>
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
            <h2 style={{ marginBottom: '20px', color: '#374151' }}>Edit QR Product</h2>
            <form onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.target as HTMLFormElement)
              const updatedRecord = {
                manufacturingId: formData.get('manufacturingId') as string,
                productName: formData.get('productName') as string,
                color: formData.get('color') as string,
                size: formData.get('size') as string,
                quantity: parseInt(formData.get('quantity') as string)
              }
              handleSaveEdit(updatedRecord)
            }}>
              <div className="form-group">
                <label htmlFor="manufacturingId">Manufacturing ID *</label>
                <input
                  type="text"
                  id="manufacturingId"
                  name="manufacturingId"
                  defaultValue={editingRecord.manufacturingId || editingRecord.id}
                  required
                  readOnly
                  style={{ backgroundColor: '#f9fafb', color: '#6b7280' }}
                />
              </div>

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
                <label htmlFor="color">Color *</label>
                <input
                  type="text"
                  id="color"
                  name="color"
                  defaultValue={editingRecord.color || 'N/A'}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="size">Size *</label>
                <select
                  id="size"
                  name="size"
                  defaultValue={editingRecord.size || 'N/A'}
                  required
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                >
                  <option value="XXS">XXS</option>
                  <option value="XS">XS</option>
                  <option value="S">S</option>
                  <option value="M">M</option>
                  <option value="L">L</option>
                  <option value="XL">XL</option>
                  <option value="XXL">XXL</option>
                  <option value="XXXL">XXXL</option>
                  <option value="Free Size">Free Size</option>
                  <option value="N/A">N/A</option>
                </select>
              </div>

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
            <h2 style={{ marginBottom: '20px', color: '#374151' }}>
              {manualEntryMode === 'manufacturing' ? 'Manual QR Code Generation' : 'Custom Product QR'}
            </h2>

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
                      <option value="XXS">XXS</option>
                      <option value="XS">XS</option>
                      <option value="S">S</option>
                      <option value="M">M</option>
                      <option value="L">L</option>
                      <option value="XL">XL</option>
                      <option value="XXL">XXL</option>
                      <option value="XXXL">XXXL</option>
                      <option value="Free Size">Free Size</option>
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