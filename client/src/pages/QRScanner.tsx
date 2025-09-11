import { useState } from 'react'
import '../styles/common.css'

interface ScannedItem {
  id: string
  type: string
  name: string
  details: string
  timestamp: string
  location: string
  scannedBy: string
}

export default function QRScanner() {
  const [scanMode, setScanMode] = useState(false)
  const [manualCode, setManualCode] = useState('')
  const [lastScanned, setLastScanned] = useState<ScannedItem | null>(null)
  const [scanHistory, setScanHistory] = useState<ScannedItem[]>([
    {
      id: 'FAB001',
      type: 'Fabric',
      name: 'Cotton - White',
      details: '100m available',
      timestamp: '2024-01-20 10:30 AM',
      location: 'Warehouse A',
      scannedBy: 'John Doe'
    },
    {
      id: 'MFG002',
      type: 'Manufacturing',
      name: 'Dress Production',
      details: '50 units - In Progress',
      timestamp: '2024-01-20 09:15 AM',
      location: 'Production Line B',
      scannedBy: 'Jane Smith'
    },
    {
      id: 'CUT003',
      type: 'Cutting',
      name: 'Jeans Cutting',
      details: '30 pieces - 36m used',
      timestamp: '2024-01-19 03:45 PM',
      location: 'Cutting Station 1',
      scannedBy: 'Bob Johnson'
    }
  ])

  const handleManualScan = (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualCode) return

    // Simulate scanning a QR code
    const newScan: ScannedItem = {
      id: manualCode.toUpperCase(),
      type: manualCode.startsWith('FAB') ? 'Fabric' : 
            manualCode.startsWith('MFG') ? 'Manufacturing' : 
            manualCode.startsWith('CUT') ? 'Cutting' : 'Unknown',
      name: `Item ${manualCode}`,
      details: 'Details loaded from database',
      timestamp: new Date().toLocaleString(),
      location: 'Current Location',
      scannedBy: 'Current User'
    }

    setLastScanned(newScan)
    setScanHistory([newScan, ...scanHistory])
    setManualCode('')
    alert('✅ QR Code scanned successfully!')
  }

  const handleCameraScan = () => {
    setScanMode(!scanMode)
    if (!scanMode) {
      alert('📷 Camera scanner would open here. This is a demo mode.')
      // In real implementation, this would open camera scanner
      setTimeout(() => {
        const mockScan: ScannedItem = {
          id: 'FAB' + Math.floor(Math.random() * 1000),
          type: 'Fabric',
          name: 'Mock Scanned Item',
          details: 'Scanned via camera',
          timestamp: new Date().toLocaleString(),
          location: 'Mobile Scanner',
          scannedBy: 'Current User'
        }
        setLastScanned(mockScan)
        setScanHistory([mockScan, ...scanHistory])
        setScanMode(false)
      }, 2000)
    }
  }

  const getTypeBadgeClass = (type: string) => {
    switch(type) {
      case 'Fabric': return 'badge-info'
      case 'Manufacturing': return 'badge-success'
      case 'Cutting': return 'badge-warning'
      default: return 'badge-danger'
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>QR Code Scanner</h1>
        <p>Scan QR codes to track inventory items</p>
      </div>

      {/* Scanner Section */}
      <div className="content-card">
        <h2 style={{ marginBottom: '20px', color: '#374151' }}>Scan QR Code</h2>
        
        {/* Camera Scanner */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          {scanMode ? (
            <div style={{
              width: '100%',
              maxWidth: '400px',
              height: '300px',
              margin: '0 auto',
              background: '#000',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative'
            }}>
              <div style={{ color: 'white', textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '10px' }}>📷</div>
                <p>Camera scanning in progress...</p>
                <div style={{
                  width: '200px',
                  height: '200px',
                  border: '2px solid #10b981',
                  borderRadius: '8px',
                  margin: '20px auto',
                  animation: 'pulse 2s infinite'
                }} />
              </div>
            </div>
          ) : (
            <button 
              onClick={handleCameraScan}
              className="btn btn-primary"
              style={{ fontSize: '18px', padding: '15px 30px' }}
            >
              📷 Open Camera Scanner
            </button>
          )}
        </div>

        {/* Manual Entry */}
        <div style={{ maxWidth: '400px', margin: '0 auto' }}>
          <h3 style={{ marginBottom: '15px', color: '#374151', fontSize: '16px' }}>Or Enter Code Manually</h3>
          <form onSubmit={handleManualScan} style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              placeholder="Enter QR code (e.g., FAB001, MFG002)"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              style={{
                flex: 1,
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
            <button type="submit" className="btn btn-primary">
              Scan
            </button>
          </form>
        </div>
      </div>

      {/* Last Scanned Item */}
      {lastScanned && (
        <div className="content-card" style={{ background: '#f0f9ff', border: '1px solid #0284c7' }}>
          <h2 style={{ marginBottom: '20px', color: '#0284c7' }}>Last Scanned Item</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            <div>
              <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '4px' }}>ID</p>
              <p style={{ fontWeight: '500', fontSize: '16px' }}>{lastScanned.id}</p>
            </div>
            <div>
              <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '4px' }}>Type</p>
              <span className={`badge ${getTypeBadgeClass(lastScanned.type)}`}>
                {lastScanned.type}
              </span>
            </div>
            <div>
              <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '4px' }}>Name</p>
              <p style={{ fontWeight: '500', fontSize: '16px' }}>{lastScanned.name}</p>
            </div>
            <div>
              <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '4px' }}>Details</p>
              <p style={{ fontSize: '14px' }}>{lastScanned.details}</p>
            </div>
            <div>
              <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '4px' }}>Location</p>
              <p style={{ fontSize: '14px' }}>{lastScanned.location}</p>
            </div>
            <div>
              <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '4px' }}>Timestamp</p>
              <p style={{ fontSize: '14px' }}>{lastScanned.timestamp}</p>
            </div>
          </div>
          <div className="btn-group" style={{ marginTop: '20px' }}>
            <button className="btn btn-primary">View Full Details</button>
            <button className="btn btn-secondary">Update Location</button>
            <button className="btn btn-success">Print Label</button>
          </div>
        </div>
      )}

      {/* Scan History */}
      <div className="content-card">
        <h2 style={{ marginBottom: '20px', color: '#374151' }}>Recent Scan History</h2>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Type</th>
                <th>Name</th>
                <th>Details</th>
                <th>Location</th>
                <th>Timestamp</th>
                <th>Scanned By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {scanHistory.length > 0 ? (
                scanHistory.map((item, index) => (
                  <tr key={`${item.id}-${index}`}>
                    <td style={{ fontWeight: '500' }}>{item.id}</td>
                    <td>
                      <span className={`badge ${getTypeBadgeClass(item.type)}`}>
                        {item.type}
                      </span>
                    </td>
                    <td>{item.name}</td>
                    <td>{item.details}</td>
                    <td>{item.location}</td>
                    <td>{item.timestamp}</td>
                    <td>{item.scannedBy}</td>
                    <td>
                      <div className="action-buttons">
                        <button className="action-btn view">View</button>
                        <button className="action-btn edit">Edit</button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '40px' }}>
                    <div className="empty-state">
                      <div className="empty-state-icon">📱</div>
                      <h3>No scan history</h3>
                      <p>Start scanning QR codes to see history</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Today's Scans</h3>
          <p className="stat-value">24</p>
        </div>
        <div className="stat-card">
          <h3>This Week</h3>
          <p className="stat-value">156</p>
        </div>
        <div className="stat-card">
          <h3>This Month</h3>
          <p className="stat-value">892</p>
        </div>
        <div className="stat-card">
          <h3>Total Scans</h3>
          <p className="stat-value">5,234</p>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(16, 185, 129, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
          }
        }
      `}</style>
    </div>
  )
}