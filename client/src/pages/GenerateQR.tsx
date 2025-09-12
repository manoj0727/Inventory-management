import { useState, useEffect } from 'react'
import QRCode from 'qrcode'
import '../styles/common.css'
import { API_URL } from '@/config/api'

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
  status: string
  notes?: string
  createdAt: string
  updatedAt?: string
}

export default function GenerateQR() {
  const [manufacturingRecords, setManufacturingRecords] = useState<ManufacturingRecord[]>([])
  const [qrCodeCache, setQrCodeCache] = useState<Map<string, string>>(new Map())
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [editingRecord, setEditingRecord] = useState<ManufacturingRecord | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)

  const fetchManufacturingRecords = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`${API_URL}/api/manufacturing-inventory`)
      if (response.ok) {
        const records = await response.json()
        // Only show completed items for QR generation
        setManufacturingRecords(records.filter((record: ManufacturingRecord) => 
          record.status === 'Completed'
        ))
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
      // Check if QR code is already cached
      const actualQuantity = record.quantityProduced > 0 ? record.quantityProduced : record.quantity
      const cacheKey = `${record.id}_${actualQuantity}_${record.completedDate || 'no-date'}`
      
      let qrCodeDataUrl = ''
      
      if (qrCodeCache.has(cacheKey)) {
        // Use cached QR code
        qrCodeDataUrl = qrCodeCache.get(cacheKey)!
      } else {
        setIsGenerating(true)
        
        // Create QR code data with product information (without generatedAt for consistency)
        const qrData = {
          type: 'MANUFACTURED_PRODUCT',
          manufacturingId: record.id,
          productId: record.productId,
          productName: record.productName,
          cuttingId: record.cuttingId,
          quantity: actualQuantity,
          tailorName: record.tailorName,
          completedDate: record.completedDate || new Date().toISOString().split('T')[0]
        }

        // Generate QR code as data URL
        qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(qrData), {
          errorCorrectionLevel: 'M',
          type: 'image/png',
          margin: 1,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          },
          width: 256
        })

        // Cache the generated QR code
        const newCache = new Map(qrCodeCache)
        newCache.set(cacheKey, qrCodeDataUrl)
        setQrCodeCache(newCache)
      }

      // Open QR code in new tab/window
      const qrWindow = window.open('', '_blank')
      if (qrWindow) {
        qrWindow.document.write(`
          <html>
            <head>
              <title>QR Code - ${record.productName}</title>
              <style>
                body { 
                  font-family: Arial, sans-serif; 
                  text-align: center; 
                  padding: 20px; 
                  background: #f9fafb;
                  margin: 0;
                }
                .container {
                  max-width: 500px;
                  margin: 0 auto;
                  background: white;
                  padding: 30px;
                  border-radius: 10px;
                  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }
                .product-info { 
                  margin: 20px 0; 
                  text-align: left;
                  background: #f9fafb;
                  padding: 20px;
                  border-radius: 8px;
                }
                .product-info h2 { 
                  margin: 0 0 15px 0; 
                  color: #374151;
                  text-align: center;
                }
                .product-info p { 
                  margin: 8px 0; 
                  font-size: 14px; 
                  color: #374151;
                }
                .qr-image {
                  margin: 20px 0;
                  padding: 20px;
                  background: white;
                  border: 1px solid #e5e7eb;
                  border-radius: 8px;
                  display: inline-block;
                }
                .actions {
                  margin-top: 20px;
                }
                .btn {
                  padding: 10px 20px;
                  margin: 0 10px;
                  border: none;
                  border-radius: 5px;
                  cursor: pointer;
                  font-size: 14px;
                }
                .btn-primary {
                  background: #3b82f6;
                  color: white;
                }
                .btn-secondary {
                  background: #6b7280;
                  color: white;
                }
                .btn:hover {
                  opacity: 0.9;
                }
                @media print {
                  .actions { display: none; }
                  body { background: white; }
                  .container { box-shadow: none; }
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="product-info">
                  <h2>${record.productName}</h2>
                  <p><strong>Manufacturing ID:</strong> ${record.id}</p>
                  <p><strong>Product ID:</strong> ${record.productId}</p>
                  <p><strong>Quantity:</strong> ${actualQuantity}</p>
                  <p><strong>Tailor:</strong> ${record.tailorName}</p>
                  <p><strong>Generated:</strong> ${new Date().toLocaleDateString()}</p>
                </div>
                <div class="qr-image">
                  <img src="${qrCodeDataUrl}" alt="QR Code" />
                </div>
                <p style="font-size: 12px; color: #666; margin-top: 10px;">
                  Scan this QR code to view product details
                </p>
                <div class="actions">
                  <button class="btn btn-primary" onclick="window.print()">Print QR Code</button>
                  <button class="btn btn-secondary" onclick="downloadQR()">Download QR Code</button>
                </div>
              </div>
              <script>
                function downloadQR() {
                  const link = document.createElement('a');
                  link.download = 'QR_${record.id}_${record.productName.replace(/\s+/g, '_')}.png';
                  link.href = '${qrCodeDataUrl}';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }
              </script>
            </body>
          </html>
        `)
        qrWindow.document.close()
      }
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
    if (window.confirm(`Are you sure you want to delete manufacturing record ${record.id}?`)) {
      try {
        const deleteResponse = await fetch(`${API_URL}/api/manufacturing-inventory/${record._id}`, {
          method: 'DELETE'
        })
        
        if (deleteResponse.ok) {
          alert('✅ Manufacturing record deleted successfully!')
          fetchManufacturingRecords()
          // Clear cache for this record
          const cacheKey = `${record.id}_${record.quantityProduced > 0 ? record.quantityProduced : record.quantity}_${record.completedDate || 'no-date'}`
          const newCache = new Map(qrCodeCache)
          newCache.delete(cacheKey)
          setQrCodeCache(newCache)
        } else {
          alert('❌ Error deleting manufacturing record. Please try again.')
        }
      } catch (error) {
        console.error('Error deleting manufacturing record:', error)
        alert('❌ Error deleting manufacturing record. Please try again.')
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


  const filteredRecords = manufacturingRecords.filter(record =>
    record.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.tailorName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Generate QR Code</h1>
        <p>Generate QR codes for completed manufactured products</p>
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
        <h2 style={{ marginBottom: '20px', color: '#374151' }}>Completed Products</h2>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Manufacturing ID</th>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Tailor</th>
                  <th>Completion Date</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.length > 0 ? (
                  filteredRecords.map((record) => (
                    <tr key={record._id}>
                      <td style={{ fontWeight: '500' }}>{record.id}</td>
                      <td>{record.productName}</td>
                      <td>{record.quantityProduced > 0 ? record.quantityProduced : record.quantity}</td>
                      <td>{record.tailorName}</td>
                      <td>{formatDate(record.completedDate || record.updatedAt || '')}</td>
                      <td style={{ textAlign: 'center' }}>
                        <div className="action-buttons" style={{ justifyContent: 'center' }}>
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
                    <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
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
    </div>
  )
}