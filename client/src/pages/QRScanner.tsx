import { useState, useEffect, useRef } from 'react'
import QrScanner from 'qr-scanner'
import { API_URL } from '@/config/api'
import '../styles/common.css'

// Add CSS animations
const style = document.createElement('style')
style.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`
document.head.appendChild(style)

interface ScannedItem {
  _id: string
  manufacturingId?: string
  fabricId?: string
  productId?: string
  type: 'FABRIC' | 'MANUFACTURING' | 'CUTTING' | 'UNKNOWN'
  name: string
  currentStock: number
  details: any
}

export default function QRScanner() {
  const [scanMode, setScanMode] = useState(false)
  const [manualCode, setManualCode] = useState('')
  const [scannedItem, setScannedItem] = useState<ScannedItem | null>(null)
  const [stockAction, setStockAction] = useState<'add' | 'remove'>('add')
  const [quantity, setQuantity] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null)
  const [showModal, setShowModal] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [qrScanner, setQrScanner] = useState<QrScanner | null>(null)

  useEffect(() => {
    return () => {
      if (qrScanner) {
        qrScanner.destroy()
      }
    }
  }, [])

  const showMessage = (type: 'success' | 'error' | 'info', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }

  const processScannedData = async (scannedText: string) => {
    try {
      setIsLoading(true)
      let qrData

      try {
        qrData = JSON.parse(scannedText)
      } catch {
        qrData = { id: scannedText }
      }

      // Determine type and fetch data
      let itemData: ScannedItem | null = null

      // Check if it's a fabric
      if (qrData.fabricId || qrData.type === 'fabric') {
        try {
          const response = await fetch(`${API_URL}/api/fabrics`)
          if (response.ok) {
            const fabrics = await response.json()
            const fabric = fabrics.find((f: any) =>
              f.fabricId === qrData.fabricId ||
              f.productId === qrData.productId ||
              f._id === qrData.id
            )

            if (fabric) {
              itemData = {
                _id: fabric._id,
                fabricId: fabric.fabricId,
                productId: fabric.productId,
                type: 'FABRIC',
                name: `${fabric.fabricType} - ${fabric.color}`,
                currentStock: fabric.quantity || 0,
                details: fabric
              }
            }
          }
        } catch (error) {
          console.error('Error fetching fabric:', error)
        }
      }

      // Check if it's a manufactured product or custom product from QR generation
      if (!itemData && (qrData.manufacturingId || qrData.type === 'MANUFACTURED_PRODUCT' || qrData.type === 'CUSTOM_PRODUCT')) {
        try {
          // First check QR products database
          const qrResponse = await fetch(`${API_URL}/api/qr-products`)
          if (qrResponse.ok) {
            const qrProducts = await qrResponse.json()
            const qrProduct = qrProducts.find((p: any) =>
              p.productId === qrData.manufacturingId ||
              p.manufacturingId === qrData.manufacturingId ||
              p.productId === qrData.productId
            )

            if (qrProduct) {
              itemData = {
                _id: qrProduct._id,
                manufacturingId: qrProduct.manufacturingId,
                productId: qrProduct.productId,
                type: 'MANUFACTURING',
                name: qrProduct.productName,
                currentStock: qrProduct.quantity || 0,
                details: {
                  ...qrProduct,
                  color: qrProduct.color,
                  size: qrProduct.size,
                  tailorName: qrProduct.tailorName
                }
              }
            }
          }

          // If not found in QR products, check manufacturing inventory
          if (!itemData) {
            const response = await fetch(`${API_URL}/api/manufacturing-inventory`)
            if (response.ok) {
              const items = await response.json()
              const item = items.find((m: any) =>
                m.id === qrData.manufacturingId ||
                m.productId === qrData.productId ||
                m._id === qrData.id
              )

              if (item) {
                itemData = {
                  _id: item._id,
                  manufacturingId: item.id,
                  productId: item.productId,
                  type: 'MANUFACTURING',
                  name: item.productName,
                  currentStock: item.quantityProduced || item.quantity || 0,
                  details: item
                }
              }
            }
          }
        } catch (error) {
          console.error('Error fetching manufacturing item:', error)
        }
      }

      // Check if it's a cutting item
      if (!itemData && (qrData.cuttingId || qrData.type === 'cutting')) {
        try {
          const response = await fetch(`${API_URL}/api/cutting-inventory`)
          if (response.ok) {
            const items = await response.json()
            const item = items.find((c: any) =>
              c.cuttingId === qrData.cuttingId ||
              c._id === qrData.id
            )

            if (item) {
              itemData = {
                _id: item._id,
                type: 'CUTTING',
                name: `${item.fabricType} - ${item.color}`,
                currentStock: item.piecesProduced || 0,
                details: item
              }
            }
          }
        } catch (error) {
          console.error('Error fetching cutting item:', error)
        }
      }

      if (!itemData) {
        itemData = {
          _id: scannedText,
          type: 'UNKNOWN',
          name: 'Unknown Item',
          currentStock: 0,
          details: { raw: scannedText }
        }
      }

      setScannedItem(itemData)

      if (itemData.type === 'UNKNOWN') {
        showMessage('error', 'Item not found in database!')
      } else {
        showMessage('success', `Found: ${itemData.name}`)
      }

      return itemData
    } catch (error) {
      showMessage('error', 'Error processing QR code')
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const handleManualScan = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualCode.trim()) return

    const item = await processScannedData(manualCode.trim())
    if (item && item.type !== 'UNKNOWN') {
      setShowModal(true) // Show the modal for stock action
    }
    setManualCode('')
  }

  const handleStockUpdate = async () => {
    if (!scannedItem || scannedItem.type === 'UNKNOWN') {
      showMessage('error', 'Cannot update stock for unknown item')
      return
    }

    setIsLoading(true)
    try {
      let endpoint = ''
      let method = 'PUT'
      let updateData: any = {}

      const newQuantity = stockAction === 'add'
        ? scannedItem.currentStock + quantity
        : Math.max(0, scannedItem.currentStock - quantity)

      switch (scannedItem.type) {
        case 'FABRIC':
          // Use PATCH for partial update
          endpoint = `${API_URL}/api/fabrics/${scannedItem._id}`
          method = 'PATCH'
          updateData = { quantity: newQuantity }
          break

        case 'MANUFACTURING':
          // Check if it's a QR product or manufacturing inventory item
          if (scannedItem.details && scannedItem.details.manufacturingId) {
            // Update QR product quantity
            endpoint = `${API_URL}/api/qr-products/${scannedItem._id}`
            method = 'PATCH'
            updateData = { quantity: newQuantity }
          } else {
            // Update manufacturing inventory
            endpoint = `${API_URL}/api/manufacturing-inventory/${scannedItem._id}`
            method = 'PATCH'
            updateData = {
              quantityProduced: newQuantity,
              quantity: newQuantity
            }
          }
          break

        case 'CUTTING':
          endpoint = `${API_URL}/api/cutting-inventory/${scannedItem._id}`
          method = 'PATCH'
          updateData = {
            piecesProduced: newQuantity,
            quantity: newQuantity
          }
          break
      }

      const response = await fetch(endpoint, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      })

      if (response.ok || response.status === 200 || response.status === 204) {
        // Log transaction to database
        const transaction = {
          timestamp: new Date().toISOString(),
          itemType: scannedItem.type,
          itemId: scannedItem.fabricId || scannedItem.manufacturingId || scannedItem._id,
          itemName: scannedItem.name,
          action: stockAction.toUpperCase() as 'ADD' | 'REMOVE',
          quantity: quantity,
          previousStock: scannedItem.currentStock,
          newStock: newQuantity,
          performedBy: 'QR Scanner User',
          source: 'QR_SCANNER' as const
        }

        // Save to database
        try {
          const transResponse = await fetch(`${API_URL}/api/transactions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(transaction)
          })

          if (!transResponse.ok) {
            console.error('Transaction save failed:', await transResponse.text())
            // Fallback to localStorage if API fails
            const existingTransactions = JSON.parse(localStorage.getItem('inventory_transactions') || '[]')
            existingTransactions.push({
              id: `trans_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              ...transaction
            })
            localStorage.setItem('inventory_transactions', JSON.stringify(existingTransactions))
          }
        } catch (error) {
          console.error('Failed to log transaction:', error)
          // Fallback to localStorage if API fails
          const existingTransactions = JSON.parse(localStorage.getItem('inventory_transactions') || '[]')
          existingTransactions.push({
            id: `trans_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            ...transaction
          })
          localStorage.setItem('inventory_transactions', JSON.stringify(existingTransactions))
        }

        setScannedItem({
          ...scannedItem,
          currentStock: newQuantity
        })

        showMessage('success', `Stock ${stockAction === 'add' ? 'added' : 'removed'} successfully!`)

        // Auto close modal after 1.5 seconds
        setTimeout(() => {
          setShowModal(false)
          setQuantity(1)
          setStockAction('add')
          setScannedItem(null)
        }, 1500)
      } else {
        const errorText = await response.text()
        console.error('Update failed:', errorText)
        throw new Error(`Failed to update stock: ${response.status}`)
      }
    } catch (error: any) {
      console.error('Stock update error:', error)
      showMessage('error', `Failed to update stock: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const startCamera = async () => {
    try {
      setIsLoading(true)
      setScanMode(true) // Set scan mode first to render video element

      // Wait for next tick to ensure video element is rendered
      await new Promise(resolve => setTimeout(resolve, 100))

      if (qrScanner) {
        qrScanner.destroy()
        setQrScanner(null)
      }

      if (!videoRef.current) {
        // Try once more after a short delay
        await new Promise(resolve => setTimeout(resolve, 200))
        if (!videoRef.current) {
          throw new Error('Video element not ready')
        }
      }

      const scanner = new QrScanner(
        videoRef.current,
        async (result) => {
          // Stop and destroy scanner immediately after detecting QR code
          scanner.stop()
          scanner.destroy()
          setQrScanner(null)
          setScanMode(false) // Hide camera view immediately

          const item = await processScannedData(result.data)
          if (item && item.type !== 'UNKNOWN') {
            setShowModal(true) // Show the modal for stock action
          }
        },
        {
          returnDetailedScanResult: true,
          highlightScanRegion: true,
          highlightCodeOutline: true,
          preferredCamera: 'environment',
          maxScansPerSecond: 1
        }
      )

      await scanner.start()
      setQrScanner(scanner)

    } catch (error: any) {
      console.error('Camera error:', error)

      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        showMessage('error', 'Camera permission denied. Please allow camera access.')
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        showMessage('error', 'No camera found on this device.')
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        showMessage('error', 'Camera is already in use by another application.')
      } else if (error.name === 'OverconstrainedError' || error.name === 'ConstraintNotSatisfiedError') {
        showMessage('error', 'Camera constraints could not be satisfied.')
      } else {
        showMessage('error', `Camera error: ${error.message || 'Unknown error'}`)
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

  const resetScanner = () => {
    setScannedItem(null)
    setQuantity(1)
    setStockAction('add')
    setMessage(null)
    setShowModal(false)
  }

  const closeModal = () => {
    setShowModal(false)
    setQuantity(1)
    setStockAction('add')
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>QR Stock Manager</h1>
        <p>Scan QR codes to add or remove stock from inventory</p>
      </div>

      {/* Message Display */}
      {message && (
        <div style={{
          padding: '12px 20px',
          marginBottom: '20px',
          borderRadius: '8px',
          backgroundColor: message.type === 'success' ? '#10b981' : message.type === 'error' ? '#ef4444' : '#3b82f6',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>{message.text}</span>
          <button
            onClick={() => setMessage(null)}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              fontSize: '20px'
            }}
          >
            ×
          </button>
        </div>
      )}

      <div className="content-card">
        <h2 style={{ marginBottom: '24px' }}>Step 1: Scan Item</h2>

        {/* Camera Scanner */}
        {scanMode ? (
          <div style={{ marginBottom: '32px' }}>
            <div style={{
              position: 'relative',
              width: '100%',
              maxWidth: '500px',
              margin: '0 auto',
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
                  background: '#000',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />

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
              }}>
                <div style={{
                  position: 'absolute',
                  top: '-30px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  color: '#10b981',
                  fontWeight: 'bold',
                  background: 'rgba(0,0,0,0.7)',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}>
                  Align QR Code
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <button
                onClick={stopCamera}
                className="btn btn-danger"
                style={{ fontSize: '16px', padding: '12px 24px' }}
              >
                Stop Camera
              </button>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <button
              onClick={startCamera}
              className="btn btn-primary"
              style={{ fontSize: '18px', padding: '14px 32px' }}
              disabled={isLoading}
            >
              {isLoading ? 'Starting Camera...' : '📷 Start Camera Scanner'}
            </button>
          </div>
        )}

        {/* Manual Entry */}
        <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '24px' }}>
          <h3 style={{ marginBottom: '16px' }}>Or Enter Code Manually</h3>
          <form onSubmit={handleManualScan}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <input
                type="text"
                placeholder="Enter QR code or ID"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                style={{
                  flex: 1,
                  padding: '12px',
                  fontSize: '16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px'
                }}
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isLoading}
                style={{ padding: '12px 24px' }}
              >
                {isLoading ? 'Processing...' : 'Process'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Modal Popup for Stock Management */}
      {showModal && scannedItem && (
        <>
          {/* Modal Backdrop with animation */}
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(4px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'fadeIn 0.2s ease-in'
          }} onClick={closeModal}>
            {/* Modal Content */}
            <div
              style={{
                maxWidth: '550px',
                width: '90%',
                maxHeight: '85vh',
                overflowY: 'auto',
                position: 'relative',
                zIndex: 1001,
                background: 'white',
                borderRadius: '16px',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                animation: 'slideUp 0.3s ease-out',
                padding: '0'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header with white background */}
              <div style={{
                background: 'white',
                borderRadius: '16px 16px 0 0',
                padding: '20px',
                position: 'relative',
                borderBottom: '2px solid #e5e7eb'
              }}>
                {/* Close Button */}
                <button
                  onClick={closeModal}
                  style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    background: '#f3f4f6',
                    border: 'none',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    fontSize: '20px',
                    cursor: 'pointer',
                    color: '#6b7280',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#e5e7eb'
                    e.currentTarget.style.color = '#374151'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#f3f4f6'
                    e.currentTarget.style.color = '#6b7280'
                  }}
                >
                  ×
                </button>

                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>
                    {scannedItem.type === 'UNKNOWN' ? '❌' : '📦'}
                  </div>
                  <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '600', color: '#1f2937' }}>
                    Stock Management
                  </h2>
                  <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#6b7280' }}>
                    Update inventory levels
                  </p>
                </div>
              </div>

              <div style={{ padding: '24px' }}>

                {/* Item Info Card */}
                <div style={{
                  background: 'linear-gradient(135deg, #f3f4f6, #e5e7eb)',
                  padding: '20px',
                  borderRadius: '12px',
                  marginBottom: '24px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div>
                      <label style={{
                        fontSize: '11px',
                        color: '#6b7280',
                        display: 'block',
                        marginBottom: '6px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        fontWeight: '500'
                      }}>
                        Item Type
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '6px 12px',
                          borderRadius: '20px',
                          fontSize: '13px',
                          fontWeight: '600',
                          background: scannedItem.type === 'FABRIC' ? '#3b82f6' :
                                    scannedItem.type === 'MANUFACTURING' ? '#10b981' :
                                    scannedItem.type === 'CUTTING' ? '#f59e0b' :
                                    '#ef4444',
                          color: 'white'
                        }}>
                          {scannedItem.type}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label style={{
                        fontSize: '11px',
                        color: '#6b7280',
                        display: 'block',
                        marginBottom: '6px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        fontWeight: '500'
                      }}>
                        Current Stock
                      </label>
                      <div style={{
                        fontWeight: '700',
                        fontSize: '28px',
                        color: '#059669',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <span>{scannedItem.currentStock}</span>
                        <span style={{ fontSize: '14px', color: '#6b7280', fontWeight: '400' }}>units</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: '16px' }}>
                    <label style={{
                      fontSize: '11px',
                      color: '#6b7280',
                      display: 'block',
                      marginBottom: '6px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      fontWeight: '500'
                    }}>
                      Item Name
                    </label>
                    <div style={{
                      fontWeight: '600',
                      fontSize: '18px',
                      color: '#1f2937'
                    }}>
                      {scannedItem.name}
                    </div>
                    {(scannedItem.fabricId || scannedItem.manufacturingId) && (
                      <div style={{
                        fontSize: '12px',
                        color: '#6b7280',
                        marginTop: '4px'
                      }}>
                        ID: {scannedItem.fabricId || scannedItem.manufacturingId || scannedItem._id}
                      </div>
                    )}
                  </div>
                </div>

                {scannedItem.type !== 'UNKNOWN' && (
                  <>
                    {/* Stock Action Selection */}
                    <div style={{ marginBottom: '20px' }}>
                      <label style={{
                        display: 'block',
                        marginBottom: '12px',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#374151'
                      }}>
                        Choose Action
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <button
                          onClick={() => setStockAction('add')}
                          style={{
                            padding: '14px',
                            fontSize: '15px',
                            fontWeight: '600',
                            border: '2px solid',
                            borderColor: stockAction === 'add' ? '#10b981' : '#e5e7eb',
                            background: stockAction === 'add' ? '#10b981' : 'white',
                            color: stockAction === 'add' ? 'white' : '#6b7280',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <span style={{ fontSize: '20px' }}>📥</span>
                          Add Stock
                        </button>
                        <button
                          onClick={() => setStockAction('remove')}
                          style={{
                            padding: '14px',
                            fontSize: '15px',
                            fontWeight: '600',
                            border: '2px solid',
                            borderColor: stockAction === 'remove' ? '#ef4444' : '#e5e7eb',
                            background: stockAction === 'remove' ? '#ef4444' : 'white',
                            color: stockAction === 'remove' ? 'white' : '#6b7280',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <span style={{ fontSize: '20px' }}>📤</span>
                          Remove Stock
                        </button>
                      </div>
                    </div>

                    {/* Quantity Input */}
                    <div style={{ marginBottom: '20px' }}>
                      <label style={{
                        display: 'block',
                        marginBottom: '12px',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#374151'
                      }}>
                        Quantity
                      </label>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '16px',
                        background: '#f9fafb',
                        padding: '12px',
                        borderRadius: '10px'
                      }}>
                        <button
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            border: '2px solid #e5e7eb',
                            background: 'white',
                            fontSize: '20px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                        >
                          −
                        </button>
                        <input
                          type="number"
                          value={quantity}
                          onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                          style={{
                            width: '100px',
                            padding: '10px',
                            fontSize: '24px',
                            fontWeight: '600',
                            textAlign: 'center',
                            border: '2px solid #e5e7eb',
                            borderRadius: '8px',
                            background: 'white'
                          }}
                          min="1"
                        />
                        <button
                          onClick={() => setQuantity(quantity + 1)}
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            border: '2px solid #e5e7eb',
                            background: 'white',
                            fontSize: '20px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Preview Card */}
                    <div style={{
                      background: `linear-gradient(135deg, ${
                        stockAction === 'add' ? '#f0fdf4' : '#fef2f2'
                      }, ${
                        stockAction === 'add' ? '#dcfce7' : '#fee2e2'
                      })`,
                      border: `2px solid ${stockAction === 'add' ? '#86efac' : '#fca5a5'}`,
                      padding: '16px',
                      borderRadius: '12px',
                      marginBottom: '20px',
                      textAlign: 'center'
                    }}>
                      <div style={{
                        fontSize: '12px',
                        marginBottom: '8px',
                        color: '#6b7280',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        fontWeight: '500'
                      }}>
                        Stock After {stockAction === 'add' ? 'Addition' : 'Removal'}
                      </div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '12px'
                      }}>
                        <span style={{
                          fontSize: '16px',
                          color: '#6b7280'
                        }}>
                          {scannedItem.currentStock}
                        </span>
                        <span style={{
                          fontSize: '20px',
                          color: stockAction === 'add' ? '#10b981' : '#ef4444'
                        }}>
                          {stockAction === 'add' ? '→' : '→'}
                        </span>
                        <span style={{
                          fontSize: '32px',
                          fontWeight: 'bold',
                          color: stockAction === 'add' ? '#059669' : '#dc2626'
                        }}>
                          {stockAction === 'add'
                            ? scannedItem.currentStock + quantity
                            : Math.max(0, scannedItem.currentStock - quantity)}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button
                        onClick={closeModal}
                        style={{
                          flex: 1,
                          padding: '14px',
                          fontSize: '16px',
                          fontWeight: '600',
                          border: '2px solid #e5e7eb',
                          background: 'white',
                          color: '#6b7280',
                          borderRadius: '10px',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleStockUpdate}
                        style={{
                          flex: 2,
                          padding: '14px',
                          fontSize: '16px',
                          fontWeight: '600',
                          border: 'none',
                          background: stockAction === 'add'
                            ? 'linear-gradient(135deg, #10b981, #059669)'
                            : 'linear-gradient(135deg, #ef4444, #dc2626)',
                          color: 'white',
                          borderRadius: '10px',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          opacity: isLoading ? 0.7 : 1
                        }}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            <span>Updating...</span>
                          </span>
                        ) : (
                          `Confirm ${stockAction === 'add' ? 'Addition' : 'Removal'}`
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}