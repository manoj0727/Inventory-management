import { useState, useEffect, useRef } from 'react'
import QrScanner from 'qr-scanner'
import { API_URL } from '@/config/api'
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
  const [qrScanner, setQrScanner] = useState<QrScanner | null>(null)
  const [availableCameras, setAvailableCameras] = useState<QrScanner.Camera[]>([])
  const [selectedCamera, setSelectedCamera] = useState<string>('')

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
      // Error fetching scan history
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchScanHistory()
    getCameraDevices()
    
    // Cleanup on unmount
    return () => {
      if (qrScanner) {
        qrScanner.destroy()
      }
    }
  }, [])

  // Get available camera devices
  const getCameraDevices = async () => {
    try {
      const cameras = await QrScanner.listCameras(true)
      setAvailableCameras(cameras)
      if (cameras.length > 0 && !selectedCamera) {
        // Default to back camera if available
        const backCamera = cameras.find(camera => 
          camera.label.toLowerCase().includes('back') || 
          camera.label.toLowerCase().includes('environment')
        )
        setSelectedCamera(backCamera?.id || cameras[0].id)
      }
    } catch (error) {
      // Error getting camera devices
    }
  }

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
      const response = await fetch('${API_URL}/api/manufacturing-inventory')
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
      // Error looking up manufacturing item
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
      // Error processing scanned data
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

  const startCamera = async (deviceId?: string) => {
    try {
      setIsLoading(true)
      
      // First, check if we have camera permissions
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        })
        // Stop the test stream immediately
        stream.getTracks().forEach(track => track.stop())
      } catch (permError) {
        console.error('Permission check failed:', permError)
        throw permError
      }
      
      // Stop any existing scanner first
      if (qrScanner) {
        qrScanner.destroy()
      }
      
      if (!videoRef.current) {
        throw new Error('Video element not ready')
      }
      
      // Create QR Scanner instance
      const scanner = new QrScanner(
        videoRef.current,
        async (result) => {
          // Handle successful scan
          // QR Code detected
          const scannedItem = await processScannedData(result.data)
          if (scannedItem) {
            if (scannedItem.type === 'UNKNOWN') {
              alert('⚠️ QR Code scanned but item not found in database!')
            } else {
              alert('✅ QR Code scanned successfully!')
            }
          }
        },
        {
          returnDetailedScanResult: true,
          highlightScanRegion: true,
          highlightCodeOutline: true,
          preferredCamera: deviceId || selectedCamera || 'environment',
          maxScansPerSecond: 2
        }
      )
      
      // Set camera if specified
      if (deviceId) {
        await scanner.setCamera(deviceId)
      }
      
      // Start scanning
      await scanner.start()
      
      setQrScanner(scanner)
      setScanMode(true)
      
      // Get available cameras after starting
      const cameras = await QrScanner.listCameras(true)
      setAvailableCameras(cameras)
      
    } catch (error: any) {
      // Error accessing camera
      console.error('Camera error:', error)
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        alert('❌ Camera permission denied. Please allow camera access in your browser settings.')
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        alert('❌ No camera found. Please ensure your device has a camera.')
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        alert('❌ Camera is already in use by another application.')
      } else if (error.name === 'OverconstrainedError' || error.name === 'ConstraintNotSatisfiedError') {
        alert('❌ Camera constraints could not be satisfied.')
      } else if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
        alert('❌ Camera access requires HTTPS. Please use a secure connection.')
      } else {
        alert(`❌ Could not access camera: ${error.message || 'Unknown error'}`)
      }
      setScanMode(false)
    } finally {
      setIsLoading(false)
    }
  }

  const stopCamera = () => {
    if (qrScanner) {
      qrScanner.destroy()
      setQrScanner(null)
    }
    setScanMode(false)
  }

  const handleCameraScan = async () => {
    if (scanMode) {
      stopCamera()
    } else {
      // Get camera devices first if not already done
      if (availableCameras.length === 0) {
        await getCameraDevices()
      }
      startCamera()
    }
  }

  const switchCamera = async () => {
    if (availableCameras.length <= 1) return
    
    const currentIndex = availableCameras.findIndex(cam => cam.id === selectedCamera)
    const nextIndex = (currentIndex + 1) % availableCameras.length
    const nextCamera = availableCameras[nextIndex]
    
    setSelectedCamera(nextCamera.id)
    
    if (qrScanner && scanMode) {
      await qrScanner.setCamera(nextCamera.id)
    }
  }

  // Removed unused function

  // Flash control
  const toggleFlash = async () => {
    if (qrScanner) {
      const hasFlash = await qrScanner.hasFlash()
      if (hasFlash) {
        const isOn = await qrScanner.isFlashOn()
        if (isOn) {
          await qrScanner.turnFlashOff()
        } else {
          await qrScanner.turnFlashOn()
        }
      } else {
        alert('Flash not available on this camera')
      }
    }
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

      {/* Scanner Section */}
      <div className="content-card">
        <h2 style={{ marginBottom: '24px' }}>Scan QR Code</h2>
        
        {/* Camera Scanner */}
        <div style={{ marginBottom: '32px' }}>
          {scanMode ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ 
                position: 'relative',
                width: '100%',
                maxWidth: '500px',
                marginBottom: '16px'
              }}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    width: '100%',
                    height: '350px',
                    borderRadius: '8px',
                    background: 'linear-gradient(45deg, #1f2937 25%, #374151 25%, #374151 50%, #1f2937 50%, #1f2937 75%, #374151 75%, #374151)',
                    backgroundSize: '20px 20px',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                  autoPlay={true}
                  playsInline={true}
                  muted={true}
                />
                <canvas
                  ref={canvasRef}
                  style={{ display: 'none' }}
                  width={640}
                  height={480}
                />
                
                {/* Camera Controls Overlay */}
                <div style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  display: 'flex',
                  gap: '8px'
                }}>
                  {availableCameras.length > 1 && (
                    <button 
                      onClick={switchCamera}
                      className="btn btn-secondary"
                      style={{ 
                        padding: '8px 12px',
                        fontSize: '12px'
                      }}
                      title="Switch Camera"
                    >
                      🔄
                    </button>
                  )}
                  <button 
                    onClick={toggleFlash}
                    className="btn btn-secondary"
                    style={{ 
                      padding: '8px 12px',
                      fontSize: '12px'
                    }}
                    title="Toggle Flash"
                  >
                    💡
                  </button>
                </div>
                
                {/* Scan frame overlay */}
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '200px',
                  height: '200px',
                  border: '3px solid #10b981',
                  borderRadius: '12px',
                  pointerEvents: 'none'
                }}></div>
              </div>
              
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button 
                  onClick={toggleFlash}
                  className="btn btn-secondary"
                >
                  💡 Toggle Flash
                </button>
                {availableCameras.length > 1 && (
                  <button 
                    onClick={switchCamera}
                    className="btn btn-secondary"
                    title={`Switch to ${availableCameras.find(cam => cam.id !== selectedCamera)?.label || 'other camera'}`}
                  >
                    🔄 Switch Camera
                  </button>
                )}
                <button 
                  onClick={stopCamera}
                  className="btn btn-danger"
                >
                  Stop Camera
                </button>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📷</div>
              <h3 style={{ marginBottom: '8px' }}>Camera Scanner</h3>
              <p style={{ marginBottom: '16px', color: '#6b7280' }}>Start camera to scan QR codes</p>
              
              {availableCameras.length > 1 && (
                <div style={{ marginBottom: '16px' }}>
                  <select 
                    value={selectedCamera}
                    onChange={(e) => setSelectedCamera(e.target.value)}
                    style={{ 
                      maxWidth: '300px', 
                      margin: '0 auto', 
                      marginBottom: '8px',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  >
                    {availableCameras.map(camera => (
                      <option key={camera.id} value={camera.id}>
                        {camera.label || `Camera ${availableCameras.indexOf(camera) + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              <button 
                onClick={handleCameraScan}
                className="btn btn-primary"
                style={{ fontSize: '16px', padding: '12px 24px' }}
                disabled={isLoading}
              >
                {isLoading ? '⏳ Starting...' : 'Start Camera'}
              </button>
            </div>
          )}
        </div>

        {/* Manual Entry */}
        <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '32px' }}>
          <h3 style={{ marginBottom: '16px', textAlign: 'center' }}>Manual Entry</h3>
          <form onSubmit={handleManualScan}>
            <div className="form-group">
              <label>Manufacturing ID</label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <input
                  type="text"
                  placeholder="Enter Manufacturing ID (e.g., MFGTESTE9742)"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={isLoading}
                >
                  {isLoading ? 'Scanning...' : 'Scan'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Last Scanned Item */}
      {lastScanned && (
        <div className="content-card" style={{
          background: lastScanned.type === 'UNKNOWN' ? '#fef2f2' : '#f0fdf4',
          border: lastScanned.type === 'UNKNOWN' ? '1px solid #ef4444' : '1px solid #10b981'
        }}>
          <h2 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span>{lastScanned.type === 'UNKNOWN' ? '❌' : '✅'}</span>
            Last Scanned Item
            <span className={`badge ${getTypeBadgeClass(lastScanned.type)}`}>
              {lastScanned.type.replace('_', ' ')}
            </span>
          </h2>
          
          <div className="form-grid">
            <div className="form-group">
              <label>Manufacturing ID</label>
              <div style={{ fontWeight: '600', fontSize: '16px' }}>{lastScanned.manufacturingId}</div>
            </div>
            <div className="form-group">
              <label>Product Name</label>
              <div>{lastScanned.productName}</div>
            </div>
            <div className="form-group">
              <label>Details</label>
              <div>{lastScanned.details}</div>
            </div>
            <div className="form-group">
              <label>Location</label>
              <div>{lastScanned.location}</div>
            </div>
            <div className="form-group">
              <label>Scanned At</label>
              <div>{lastScanned.timestamp}</div>
            </div>
            {lastScanned.tailorName && (
              <div className="form-group">
                <label>Tailor</label>
                <div>{lastScanned.tailorName}</div>
              </div>
            )}
          </div>
          
          {lastScanned.type !== 'UNKNOWN' && (
            <div className="btn-group">
              <button 
                className="btn btn-primary"
                onClick={() => handleView(lastScanned)}
              >
                View Details
              </button>
              <button className="btn btn-secondary">
                Update Location
              </button>
              <button className="btn btn-success">
                Generate Report
              </button>
            </div>
          )}
        </div>
      )}

      {/* Scan History */}
      <div className="content-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0 }}>Scan History ({scanHistory.length})</h2>
          <button 
            className="btn btn-secondary"
            onClick={fetchScanHistory}
            disabled={isLoading}
          >
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
        
        <div className="table-container">
          <table className="data-table">
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
              {scanHistory.length > 0 ? (
                scanHistory.map((item, index) => (
                  <tr key={`${item._id}-${index}`}>
                    <td style={{ fontWeight: '600' }}>{item.manufacturingId}</td>
                    <td>
                      <span className={`badge ${getTypeBadgeClass(item.type)}`}>
                        {item.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td>{item.productName}</td>
                    <td>{item.details}</td>
                    <td>{item.location}</td>
                    <td>{item.timestamp}</td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="action-btn view"
                          onClick={() => handleView(item)}
                        >
                          View
                        </button>
                        <button 
                          className="action-btn delete"
                          onClick={() => handleDelete(index)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="empty-state">
                    <div className="empty-state-icon">📱</div>
                    <h3>No Scan History</h3>
                    <p>{isLoading ? 'Loading scan history...' : 'Start scanning QR codes to see history'}</p>
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