import { useState, useEffect, useRef } from 'react'
import '../styles/common.css'

interface ScannedItem {
  _id: string
  manufacturingId: string
  type: string
  productName: string
  details: string
  location: string
  timestamp: string
  scannedBy: string
  quantity?: number
  tailorName?: string
  status?: string
}

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
}

export default function QRScanner() {
  const [scanMode, setScanMode] = useState(false)
  const [manualCode, setManualCode] = useState('')
  const [lastScanned, setLastScanned] = useState<ScannedItem | null>(null)
  const [scanHistory, setScanHistory] = useState<ScannedItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)

  // Fetch scan history from database
  const fetchScanHistory = async () => {
    setIsLoading(true)
    try {
      // For now, we'll use localStorage to store scan history
      // In production, this would be an API call
      const savedHistory = localStorage.getItem('qr_scan_history')
      if (savedHistory) {
        setScanHistory(JSON.parse(savedHistory))
      }
    } catch (error) {
      console.error('Error fetching scan history:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchScanHistory()
  }, [])

  const formatDate = (date: Date) => {
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `${day}/${month}/${year} ${hours}:${minutes}`
  }

  const lookupManufacturingItem = async (qrData: any): Promise<ManufacturingRecord | null> => {
    try {
      const response = await fetch('http://localhost:4000/api/manufacturing-inventory')
      if (response.ok) {
        const records: ManufacturingRecord[] = await response.json()
        
        // Try to find by manufacturing ID
        if (qrData.manufacturingId) {
          return records.find(record => record.id === qrData.manufacturingId) || null
        }
        
        // Try to find by product ID
        if (qrData.productId) {
          return records.find(record => record.productId === qrData.productId) || null
        }
        
        return null
      }
    } catch (error) {
      console.error('Error looking up manufacturing item:', error)
    }
    return null
  }

  const processScannedData = async (scannedText: string) => {
    try {
      let qrData
      
      // Try to parse as JSON first (for our generated QR codes)
      try {
        qrData = JSON.parse(scannedText)
      } catch {
        // If not JSON, treat as simple text (manufacturing ID)
        qrData = { manufacturingId: scannedText.toUpperCase() }
      }

      // Look up the item in manufacturing inventory
      const manufacturingItem = await lookupManufacturingItem(qrData)
      
      let scannedItem: ScannedItem

      if (manufacturingItem) {
        // Found in manufacturing inventory
        scannedItem = {
          _id: new Date().getTime().toString(),
          manufacturingId: manufacturingItem.id,
          type: 'MANUFACTURED_PRODUCT',
          productName: manufacturingItem.productName,
          details: `Quantity: ${manufacturingItem.quantityProduced || manufacturingItem.quantity} | Status: ${manufacturingItem.status}`,
          location: 'Manufacturing Floor',
          timestamp: formatDate(new Date()),
          scannedBy: 'Current User',
          quantity: manufacturingItem.quantityProduced || manufacturingItem.quantity,
          tailorName: manufacturingItem.tailorName,
          status: manufacturingItem.status
        }
      } else {
        // Unknown QR code
        scannedItem = {
          _id: new Date().getTime().toString(),
          manufacturingId: qrData.manufacturingId || scannedText.toUpperCase(),
          type: 'UNKNOWN',
          productName: 'Unknown Product',
          details: 'Item not found in database',
          location: 'Unknown',
          timestamp: formatDate(new Date()),
          scannedBy: 'Current User'
        }
      }

      // Add to scan history
      const newHistory = [scannedItem, ...scanHistory].slice(0, 50) // Keep only last 50 scans
      setScanHistory(newHistory)
      setLastScanned(scannedItem)
      
      // Save to localStorage
      localStorage.setItem('qr_scan_history', JSON.stringify(newHistory))
      
      return scannedItem
    } catch (error) {
      console.error('Error processing scanned data:', error)
      return null
    }
  }

  const handleManualScan = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualCode.trim()) return

    setIsLoading(true)
    const result = await processScannedData(manualCode.trim())
    
    if (result) {
      if (result.type === 'UNKNOWN') {
        alert('⚠️ QR Code scanned but item not found in database!')
      } else {
        alert('✅ QR Code scanned successfully!')
      }
    } else {
      alert('❌ Error processing QR code. Please try again.')
    }
    
    setManualCode('')
    setIsLoading(false)
  }

  const startCamera = async () => {
    try {
      const constraints = {
        video: {
          facingMode: 'environment', // Use back camera
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      }
      
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
      setStream(mediaStream)
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        videoRef.current.play()
      }
      
      setScanMode(true)
    } catch (error) {
      console.error('Error accessing camera:', error)
      alert('❌ Could not access camera. Please check permissions and try again.')
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    setScanMode(false)
  }

  const handleCameraScan = () => {
    if (scanMode) {
      stopCamera()
    } else {
      startCamera()
    }
  }

  // Simulate QR detection for demo (in production, use a QR detection library)
  const detectQR = () => {
    // This is a placeholder - in production you'd use a library like jsQR
    alert('📷 QR detection would happen here. For demo, please use manual entry.')
  }

  const getTypeBadgeClass = (type: string) => {
    switch(type) {
      case 'MANUFACTURED_PRODUCT': return 'badge-success'
      case 'FABRIC': return 'badge-info'
      case 'CUTTING': return 'badge-warning'
      case 'UNKNOWN': return 'badge-danger'
      default: return 'badge-secondary'
    }
  }

  const handleDelete = (index: number) => {
    if (window.confirm('Are you sure you want to delete this scan record?')) {
      const newHistory = scanHistory.filter((_, i) => i !== index)
      setScanHistory(newHistory)
      localStorage.setItem('qr_scan_history', JSON.stringify(newHistory))
      alert('✅ Scan record deleted successfully!')
    }
  }

  const handleView = (item: ScannedItem) => {
    alert(`Viewing details for ${item.manufacturingId}:\n\nProduct: ${item.productName}\nType: ${item.type}\nDetails: ${item.details}\nLocation: ${item.location}\nScanned: ${item.timestamp}`)
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>QR Code Scanner</h1>
        <p>Scan QR codes to track manufacturing products and inventory items</p>
      </div>

      <div className="qr-scanner-layout">
        {/* Scanner Section */}
        <div className="scanner-card">
          <div className="scanner-header">
            <h2>📱 QR Code Scanner</h2>
            <div className="scanner-status">
              <span className={`status-indicator ${scanMode ? 'active' : 'inactive'}`}></span>
              <span className="status-text">{scanMode ? 'Camera Active' : 'Camera Inactive'}</span>
            </div>
          </div>
          
          {/* Camera Scanner */}
          <div className="camera-section">
            {scanMode ? (
              <div className="camera-container">
                <div className="video-wrapper">
                  <video
                    ref={videoRef}
                    className="camera-video"
                    playsInline
                    muted
                  />
                  <canvas
                    ref={canvasRef}
                    style={{ display: 'none' }}
                    width={640}
                    height={480}
                  />
                  <div className="scan-overlay">
                    <div className="scan-box"></div>
                    <div className="scan-instructions">Position QR code within the frame</div>
                  </div>
                </div>
                <div className="camera-controls">
                  <button 
                    onClick={detectQR}
                    className="btn btn-capture"
                  >
                    📷 Capture QR
                  </button>
                  <button 
                    onClick={stopCamera}
                    className="btn btn-stop"
                  >
                    ❌ Stop Camera
                  </button>
                </div>
              </div>
            ) : (
              <div className="camera-placeholder">
                <div className="camera-icon">📷</div>
                <h3>Ready to Scan</h3>
                <p>Click the button below to start camera scanning</p>
                <button 
                  onClick={handleCameraScan}
                  className="btn btn-start-camera"
                >
                  📷 Start Camera Scanner
                </button>
              </div>
            )}
          </div>

          {/* Manual Entry */}
          <div className="manual-entry">
            <div className="divider">
              <span>OR</span>
            </div>
            <h3>Enter Manufacturing ID Manually</h3>
            <form onSubmit={handleManualScan} className="manual-form">
              <div className="input-group">
                <input
                  type="text"
                  placeholder="Enter Manufacturing ID (e.g., MFGTESTE9742)"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  className="manual-input"
                />
                <button 
                  type="submit" 
                  className="btn btn-scan"
                  disabled={isLoading}
                >
                  {isLoading ? '⏳ Scanning...' : '🔍 Scan'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Last Scanned Item */}
        {lastScanned && (
          <div className={`scan-result-card ${lastScanned.type === 'UNKNOWN' ? 'error' : 'success'}`}>
            <div className="scan-result-header">
              <div className="result-icon">
                {lastScanned.type === 'UNKNOWN' ? '❌' : '✅'}
              </div>
              <div className="result-title">
                <h2>Last Scanned Item</h2>
                <span className={`badge ${getTypeBadgeClass(lastScanned.type)}`}>
                  {lastScanned.type.replace('_', ' ')}
                </span>
              </div>
            </div>
            
            <div className="scan-result-grid">
              <div className="result-item">
                <div className="label">Manufacturing ID</div>
                <div className="value primary">{lastScanned.manufacturingId}</div>
              </div>
              <div className="result-item">
                <div className="label">Product Name</div>
                <div className="value">{lastScanned.productName}</div>
              </div>
              <div className="result-item">
                <div className="label">Details</div>
                <div className="value">{lastScanned.details}</div>
              </div>
              <div className="result-item">
                <div className="label">Location</div>
                <div className="value">{lastScanned.location}</div>
              </div>
              <div className="result-item">
                <div className="label">Scanned At</div>
                <div className="value">{lastScanned.timestamp}</div>
              </div>
              {lastScanned.tailorName && (
                <div className="result-item">
                  <div className="label">Tailor</div>
                  <div className="value">{lastScanned.tailorName}</div>
                </div>
              )}
            </div>
            
            {lastScanned.type !== 'UNKNOWN' && (
              <div className="scan-actions">
                <button 
                  className="btn btn-action primary"
                  onClick={() => handleView(lastScanned)}
                >
                  🔍 View Details
                </button>
                <button className="btn btn-action success">
                  📍 Update Location
                </button>
                <button className="btn btn-action info">
                  📊 Generate Report
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Scan History */}
      <div className="history-section">
        <div className="history-header">
          <div className="history-title">
            <h2>📋 Scan History</h2>
            <span className="history-count">{scanHistory.length} items</span>
          </div>
          <button 
            className="btn btn-refresh"
            onClick={fetchScanHistory}
            disabled={isLoading}
          >
            {isLoading ? '⏳ Refreshing...' : '🔄 Refresh'}
          </button>
        </div>
        
        <div className="history-container">
          {scanHistory.length > 0 ? (
            <>
              {/* Desktop Table View */}
              <div className="desktop-table">
                <table className="history-table">
                  <thead>
                    <tr>
                      <th>Manufacturing ID</th>
                      <th>Type</th>
                      <th>Product Name</th>
                      <th>Details</th>
                      <th>Location</th>
                      <th>Timestamp</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scanHistory.map((item, index) => (
                      <tr key={`${item._id}-${index}`}>
                        <td className="manufacturing-id">{item.manufacturingId}</td>
                        <td>
                          <span className={`type-badge ${getTypeBadgeClass(item.type)}`}>
                            {item.type.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="product-name">{item.productName}</td>
                        <td className="details">{item.details}</td>
                        <td>{item.location}</td>
                        <td className="timestamp">{item.timestamp}</td>
                        <td>
                          <div className="table-actions">
                            <button 
                              className="btn btn-view"
                              onClick={() => handleView(item)}
                              title="View Details"
                            >
                              👁️
                            </button>
                            <button 
                              className="btn btn-delete"
                              onClick={() => handleDelete(index)}
                              title="Delete"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Mobile Card View */}
              <div className="mobile-cards">
                {scanHistory.map((item, index) => (
                  <div key={`${item._id}-${index}`} className="history-card">
                    <div className="card-header">
                      <div className="card-id">{item.manufacturingId}</div>
                      <span className={`type-badge ${getTypeBadgeClass(item.type)}`}>
                        {item.type.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="card-content">
                      <div className="card-row">
                        <span className="card-label">Product:</span>
                        <span className="card-value">{item.productName}</span>
                      </div>
                      <div className="card-row">
                        <span className="card-label">Details:</span>
                        <span className="card-value">{item.details}</span>
                      </div>
                      <div className="card-row">
                        <span className="card-label">Location:</span>
                        <span className="card-value">{item.location}</span>
                      </div>
                      <div className="card-row">
                        <span className="card-label">Scanned:</span>
                        <span className="card-value">{item.timestamp}</span>
                      </div>
                    </div>
                    <div className="card-actions">
                      <button 
                        className="btn btn-view mobile"
                        onClick={() => handleView(item)}
                      >
                        👁️ View
                      </button>
                      <button 
                        className="btn btn-delete mobile"
                        onClick={() => handleDelete(index)}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="empty-history">
              <div className="empty-icon">📱</div>
              <h3>No Scan History</h3>
              <p>{isLoading ? 'Loading scan history...' : 'Start scanning QR codes to see your scan history here.'}</p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        /* QR Scanner Responsive Styles */
        .qr-scanner-layout {
          display: grid;
          gap: 24px;
          grid-template-columns: 1fr;
        }
        
        .scanner-card {
          background: white;
          border-radius: 20px;
          padding: 32px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
          color: #374151;
          position: relative;
          overflow: hidden;
          border: 1px solid #e5e7eb;
        }
        
        .scanner-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="%23e5e7eb" stroke-width="0.5" opacity="0.3"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>') repeat;
          pointer-events: none;
        }
        
        .scanner-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
          position: relative;
          z-index: 2;
        }
        
        .scanner-header h2 {
          margin: 0;
          font-size: 24px;
          font-weight: 700;
          color: #374151;
        }
        
        .scanner-status {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #f9fafb;
          padding: 8px 16px;
          border-radius: 20px;
          border: 1px solid #e5e7eb;
        }
        
        .status-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }
        
        .status-indicator.active {
          background: #10b981;
          box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.3);
        }
        
        .status-indicator.inactive {
          background: #ef4444;
        }
        
        .status-text {
          font-size: 12px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #6b7280;
        }
        
        .camera-section {
          position: relative;
          z-index: 2;
          margin-bottom: 32px;
        }
        
        .camera-container {
          background: #f9fafb;
          border-radius: 16px;
          padding: 24px;
          border: 1px solid #e5e7eb;
        }
        
        .video-wrapper {
          position: relative;
          max-width: 600px;
          margin: 0 auto;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        }
        
        .camera-video {
          width: 100%;
          height: 400px;
          object-fit: cover;
          background: #1f2937;
          border-radius: 8px;
        }
        
        .scan-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          pointer-events: none;
        }
        
        .scan-box {
          width: 200px;
          height: 200px;
          border: 3px solid #10b981;
          border-radius: 12px;
          animation: scanPulse 2s infinite;
          position: relative;
        }
        
        .scan-box::before,
        .scan-box::after {
          content: '';
          position: absolute;
          width: 20px;
          height: 20px;
          border: 3px solid #10b981;
        }
        
        .scan-box::before {
          top: -3px;
          left: -3px;
          border-right: none;
          border-bottom: none;
        }
        
        .scan-box::after {
          bottom: -3px;
          right: -3px;
          border-left: none;
          border-top: none;
        }
        
        .scan-instructions {
          margin-top: 20px;
          background: rgba(0,0,0,0.7);
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 14px;
          color: white;
        }
        
        .camera-controls {
          display: flex;
          gap: 16px;
          justify-content: center;
          margin-top: 20px;
        }
        
        .camera-placeholder {
          text-align: center;
          padding: 60px 20px;
          background: #f9fafb;
          border-radius: 16px;
          border: 1px solid #e5e7eb;
        }
        
        .camera-icon {
          font-size: 64px;
          margin-bottom: 20px;
          opacity: 0.8;
        }
        
        .camera-placeholder h3 {
          margin: 0 0 8px 0;
          font-size: 24px;
          font-weight: 600;
          color: #374151;
        }
        
        .camera-placeholder p {
          margin: 0 0 24px 0;
          color: #6b7280;
        }
        
        .manual-entry {
          position: relative;
          z-index: 2;
        }
        
        .divider {
          text-align: center;
          margin: 32px 0;
          position: relative;
        }
        
        .divider::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          height: 1px;
          background: #e5e7eb;
        }
        
        .divider span {
          background: white;
          padding: 0 20px;
          font-weight: 600;
          font-size: 14px;
          color: #6b7280;
        }
        
        .manual-entry h3 {
          text-align: center;
          margin: 0 0 20px 0;
          font-size: 18px;
          font-weight: 600;
          color: #374151;
        }
        
        .manual-form {
          max-width: 500px;
          margin: 0 auto;
        }
        
        .input-group {
          display: flex;
          gap: 12px;
          background: #f9fafb;
          padding: 8px;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
        }
        
        .manual-input {
          flex: 1;
          padding: 14px 16px;
          border: 2px solid transparent;
          border-radius: 8px;
          background: rgba(255,255,255,0.9);
          color: #374151;
          font-size: 14px;
          transition: all 0.3s;
        }
        
        .manual-input:focus {
          outline: none;
          border-color: #10b981;
          box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.2);
        }
        
        .manual-input::placeholder {
          color: #9ca3af;
        }
        
        /* Button Styles */
        .btn {
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
          font-size: 14px;
        }
        
        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none !important;
        }
        
        .btn-start-camera {
          background: #3b82f6;
          color: white;
          border: 2px solid #3b82f6;
          padding: 16px 32px;
          font-size: 16px;
          box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
        }
        
        .btn-start-camera:hover {
          background: #2563eb;
          border-color: #2563eb;
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(59, 130, 246, 0.4);
        }
        
        .btn-capture {
          background: #10b981;
          color: white;
          box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);
        }
        
        .btn-capture:hover {
          background: #059669;
          transform: translateY(-2px);
        }
        
        .btn-stop {
          background: #ef4444;
          color: white;
          box-shadow: 0 4px 15px rgba(239, 68, 68, 0.4);
        }
        
        .btn-stop:hover {
          background: #dc2626;
          transform: translateY(-2px);
        }
        
        .btn-scan {
          background: #8b5cf6;
          color: white;
          padding: 14px 24px;
          box-shadow: 0 4px 15px rgba(139, 92, 246, 0.4);
        }
        
        .btn-scan:hover {
          background: #7c3aed;
          transform: translateY(-2px);
        }
        
        .btn-refresh {
          background: white;
          color: #374151;
          border: 1px solid #e5e7eb;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .btn-refresh:hover {
          background: #f9fafb;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        
        /* Scan Result Card */
        .scan-result-card {
          background: white;
          border-radius: 16px;
          padding: 32px;
          margin-top: 24px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
          border: 2px solid transparent;
        }
        
        .scan-result-card.success {
          border-color: #10b981;
          background: linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%);
        }
        
        .scan-result-card.error {
          border-color: #ef4444;
          background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
        }
        
        .scan-result-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
        }
        
        .result-icon {
          font-size: 32px;
          width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: rgba(255,255,255,0.8);
        }
        
        .result-title h2 {
          margin: 0 0 8px 0;
          color: #374151;
          font-size: 20px;
        }
        
        .scan-result-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 24px;
        }
        
        .result-item {
          background: rgba(255,255,255,0.7);
          padding: 16px;
          border-radius: 8px;
        }
        
        .result-item .label {
          font-size: 12px;
          color: #6b7280;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }
        
        .result-item .value {
          font-size: 16px;
          color: #374151;
          font-weight: 600;
        }
        
        .result-item .value.primary {
          color: #667eea;
          font-size: 18px;
        }
        
        .scan-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
        
        .btn-action {
          background: white;
          border: 2px solid;
          color: #374151;
        }
        
        .btn-action.primary {
          border-color: #3b82f6;
          color: #3b82f6;
        }
        
        .btn-action.primary:hover {
          background: #3b82f6;
          color: white;
        }
        
        .btn-action.success {
          border-color: #10b981;
          color: #10b981;
        }
        
        .btn-action.success:hover {
          background: #10b981;
          color: white;
        }
        
        .btn-action.info {
          border-color: #8b5cf6;
          color: #8b5cf6;
        }
        
        .btn-action.info:hover {
          background: #8b5cf6;
          color: white;
        }
        
        /* History Section */
        .history-section {
          background: white;
          border-radius: 16px;
          padding: 32px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
          border: 1px solid #e5e7eb;
        }
        
        .history-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        
        .history-title {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .history-title h2 {
          margin: 0;
          color: #374151;
          font-size: 20px;
        }
        
        .history-count {
          background: #f3f4f6;
          color: #6b7280;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
        }
        
        .history-container {
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid #e5e7eb;
        }
        
        /* Desktop Table */
        .desktop-table {
          display: block;
        }
        
        .mobile-cards {
          display: none;
        }
        
        .history-table {
          width: 100%;
          border-collapse: collapse;
          background: white;
        }
        
        .history-table thead {
          background: #f9fafb;
        }
        
        .history-table th {
          padding: 16px;
          text-align: left;
          font-weight: 600;
          color: #374151;
          font-size: 14px;
          border-bottom: 2px solid #e5e7eb;
        }
        
        .history-table td {
          padding: 16px;
          border-bottom: 1px solid #f3f4f6;
          color: #6b7280;
          vertical-align: middle;
        }
        
        .history-table tbody tr:hover {
          background: #f9fafb;
        }
        
        .manufacturing-id {
          font-weight: 600;
          color: #374151;
          font-family: monospace;
        }
        
        .product-name {
          font-weight: 500;
          color: #374151;
        }
        
        .timestamp {
          font-size: 13px;
          color: #9ca3af;
        }
        
        .details {
          max-width: 200px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .type-badge {
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .table-actions {
          display: flex;
          gap: 8px;
        }
        
        .btn-view {
          background: #3b82f6;
          color: white;
          padding: 6px 10px;
          border-radius: 6px;
          font-size: 12px;
        }
        
        .btn-view:hover {
          background: #2563eb;
        }
        
        .btn-delete {
          background: #ef4444;
          color: white;
          padding: 6px 10px;
          border-radius: 6px;
          font-size: 12px;
        }
        
        .btn-delete:hover {
          background: #dc2626;
        }
        
        /* Mobile Cards */
        .history-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 16px;
        }
        
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        
        .card-id {
          font-weight: 600;
          color: #374151;
          font-family: monospace;
          font-size: 14px;
        }
        
        .card-content {
          margin-bottom: 16px;
        }
        
        .card-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        
        .card-label {
          color: #6b7280;
          font-size: 14px;
          font-weight: 500;
        }
        
        .card-value {
          color: #374151;
          font-size: 14px;
          text-align: right;
          max-width: 60%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .card-actions {
          display: flex;
          gap: 12px;
        }
        
        .btn.mobile {
          flex: 1;
          justify-content: center;
          padding: 10px;
          font-size: 14px;
        }
        
        /* Empty State */
        .empty-history {
          text-align: center;
          padding: 60px 20px;
          background: #f9fafb;
        }
        
        .empty-icon {
          font-size: 48px;
          margin-bottom: 16px;
          opacity: 0.5;
        }
        
        .empty-history h3 {
          margin: 0 0 8px 0;
          color: #374151;
          font-size: 18px;
        }
        
        .empty-history p {
          margin: 0;
          color: #6b7280;
          font-size: 14px;
        }
        
        /* Animations */
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
        
        @keyframes scanPulse {
          0% {
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
          }
          70% {
            box-shadow: 0 0 0 15px rgba(16, 185, 129, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
          }
        }
        
        /* Responsive Design */
        @media (max-width: 1024px) {
          .qr-scanner-layout {
            grid-template-columns: 1fr;
          }
          
          .scan-result-grid {
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          }
        }
        
        @media (max-width: 768px) {
          .scanner-card {
            padding: 24px;
            border-radius: 16px;
          }
          
          .scanner-header {
            flex-direction: column;
            gap: 16px;
            align-items: flex-start;
          }
          
          .scanner-header h2 {
            font-size: 20px;
          }
          
          .camera-video {
            height: 300px;
          }
          
          .scan-box {
            width: 150px;
            height: 150px;
          }
          
          .camera-controls {
            flex-direction: column;
          }
          
          .input-group {
            flex-direction: column;
            gap: 12px;
          }
          
          .manual-input {
            order: 1;
          }
          
          .btn-scan {
            order: 2;
            align-self: stretch;
            justify-content: center;
          }
          
          .scan-result-grid {
            grid-template-columns: 1fr;
          }
          
          .scan-actions {
            flex-direction: column;
          }
          
          .history-header {
            flex-direction: column;
            gap: 16px;
            align-items: flex-start;
          }
          
          .desktop-table {
            display: none;
          }
          
          .mobile-cards {
            display: block;
          }
          
          .history-section {
            padding: 20px;
          }
        }
        
        @media (max-width: 480px) {
          .page-container {
            padding: 16px;
          }
          
          .scanner-card {
            padding: 20px;
          }
          
          .camera-placeholder {
            padding: 40px 16px;
          }
          
          .camera-icon {
            font-size: 48px;
          }
          
          .scan-result-card {
            padding: 20px;
          }
          
          .result-icon {
            width: 50px;
            height: 50px;
            font-size: 24px;
          }
          
          .history-section {
            padding: 16px;
          }
          
          .history-card {
            padding: 16px;
          }
        }
      `}</style>
    </div>
  )
}