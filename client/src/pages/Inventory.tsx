import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/common.css'

interface InventoryItem {
import { API_URL } from '@/config/api'
  id: string
  name: string
  color: string
  category: string
  quantity: number
  location: string
  status: string
  quality: string
  length: number
  width: number
  supplier: string
  purchasePrice: number
  notes: string
}

export default function Inventory() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)

  const generateProductId = (name: string, color: string, quantity: number) => {
    const nameCode = name.substring(0, 3).toUpperCase()
    const colorCode = color.substring(0, 2).toUpperCase()
    const quantityCode = quantity.toString().padStart(3, '0')
    return `${nameCode}${colorCode}${quantityCode}`
  }

  const fetchInventoryItems = async () => {
    setIsLoading(true)
    try {
      // This would connect to fabric API to show fabrics as inventory
      const response = await fetch('${API_URL}/api/fabrics')
      if (response.ok) {
        const fabrics = await response.json()
        const inventoryItems = fabrics.map((fabric: any) => ({
          id: fabric.productId || generateProductId(fabric.fabricType, fabric.color, Math.floor(fabric.quantity)),
          name: fabric.fabricType,
          color: fabric.color,
          category: 'Fabric',
          quantity: fabric.quantity,
          location: fabric.location || 'N/A',
          status: fabric.status,
          quality: fabric.quality,
          length: fabric.length,
          width: fabric.width,
          supplier: fabric.supplier,
          purchasePrice: fabric.purchasePrice || 0,
          notes: fabric.notes || ''
        }))
        setInventoryItems(inventoryItems)
      }
    } catch (error) {
      console.error('Error fetching inventory:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchInventoryItems()
  }, [])

  const filteredItems = inventoryItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.color.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.id.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item)
    setShowEditModal(true)
  }

  const handleDelete = async (item: InventoryItem) => {
    if (window.confirm(`Are you sure you want to delete ${item.name} - ${item.color}?`)) {
      try {
        // Find the fabric by matching name and color since we need the MongoDB _id
        const response = await fetch('${API_URL}/api/fabrics')
        if (response.ok) {
          const fabrics = await response.json()
          const fabricToDelete = fabrics.find((fabric: any) => 
            fabric.fabricType === item.name && fabric.color === item.color
          )
          
          if (fabricToDelete) {
            const deleteResponse = await fetch(`${API_URL}/api/fabrics/${fabricToDelete._id}`, {
              method: 'DELETE'
            })
            
            if (deleteResponse.ok) {
              alert('✅ Item deleted successfully!')
              fetchInventoryItems() // Refresh the list
            } else {
              alert('❌ Error deleting item. Please try again.')
            }
          }
        }
      } catch (error) {
        console.error('Error deleting item:', error)
        alert('❌ Error deleting item. Please try again.')
      }
    }
  }

  const handleSaveEdit = async (updatedItem: InventoryItem) => {
    try {
      // Find the fabric by matching name and color since we need the MongoDB _id
      const response = await fetch('${API_URL}/api/fabrics')
      if (response.ok) {
        const fabrics = await response.json()
        const fabricToUpdate = fabrics.find((fabric: any) => 
          fabric.fabricType === editingItem?.name && fabric.color === editingItem?.color
        )
        
        if (fabricToUpdate) {
          const updateResponse = await fetch(`${API_URL}/api/fabrics/${fabricToUpdate._id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              fabricType: updatedItem.name,
              color: updatedItem.color,
              quality: updatedItem.quality,
              length: updatedItem.length,
              width: updatedItem.width,
              supplier: updatedItem.supplier,
              purchasePrice: updatedItem.purchasePrice,
              location: updatedItem.location,
              notes: updatedItem.notes
            })
          })
          
          if (updateResponse.ok) {
            alert('✅ Item updated successfully!')
            setShowEditModal(false)
            setEditingItem(null)
            fetchInventoryItems() // Refresh the list
          } else {
            alert('❌ Error updating item. Please try again.')
          }
        }
      }
    } catch (error) {
      console.error('Error updating item:', error)
      alert('❌ Error updating item. Please try again.')
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Fabric Inventory Management</h1>
        <p>Manage your fabric products and stock levels</p>
      </div>

      <div className="content-card">
        <div className="toolbar">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-group">
            <button 
              className="btn btn-secondary"
              onClick={fetchInventoryItems}
              disabled={isLoading}
            >
              {isLoading ? 'Refreshing...' : 'Refresh'}
            </button>
            <button 
              className="btn btn-primary"
              onClick={() => navigate('/fabric-registration')}
            >
              Add Product
            </button>
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Product ID</th>
                <th>Name</th>
                <th>Color</th>
                <th>Category</th>
                <th>Quantity</th>
                <th>Price/m</th>
                <th>Location</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: '500' }}>{item.id}</td>
                    <td>{item.name}</td>
                    <td>{item.color}</td>
                    <td>{item.category}</td>
                    <td>{item.quantity} sq.m</td>
                    <td>₹{item.purchasePrice > 0 ? item.purchasePrice.toFixed(2) : 'N/A'}</td>
                    <td>{item.location}</td>
                    <td>
                      <span className={`badge ${
                        item.status === 'In Stock' ? 'badge-success' : 
                        item.status === 'Low Stock' ? 'badge-warning' : 'badge-danger'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="action-btn edit" onClick={() => handleEdit(item)}>✏️</button>
                        <button className="action-btn delete" onClick={() => handleDelete(item)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                    {isLoading ? 'Loading inventory...' : 'No inventory items found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && editingItem && (
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
            <h2 style={{ marginBottom: '20px', color: '#374151' }}>Edit Item</h2>
            <form onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.target as HTMLFormElement)
              const updatedItem: InventoryItem = {
                ...editingItem,
                name: formData.get('name') as string,
                color: formData.get('color') as string,
                quality: formData.get('quality') as string,
                length: parseFloat(formData.get('length') as string),
                width: parseFloat(formData.get('width') as string),
                supplier: formData.get('supplier') as string,
                purchasePrice: parseFloat(formData.get('purchasePrice') as string) || 0,
                location: formData.get('location') as string,
                notes: formData.get('notes') as string
              }
              handleSaveEdit(updatedItem)
            }}>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="name">Fabric Type *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    defaultValue={editingItem.name}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="color">Color *</label>
                  <input
                    type="text"
                    id="color"
                    name="color"
                    defaultValue={editingItem.color}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="quality">Quality Grade *</label>
                  <select
                    id="quality"
                    name="quality"
                    defaultValue={editingItem.quality}
                    required
                  >
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
                    defaultValue={editingItem.length}
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
                    defaultValue={editingItem.width}
                    min="0.1"
                    step="0.1"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="supplier">Supplier *</label>
                  <input
                    type="text"
                    id="supplier"
                    name="supplier"
                    defaultValue={editingItem.supplier}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="purchasePrice">Purchase Price (per meter)</label>
                  <input
                    type="number"
                    id="purchasePrice"
                    name="purchasePrice"
                    defaultValue={editingItem.purchasePrice}
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="location">Storage Location</label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    defaultValue={editingItem.location}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="notes">Additional Notes</label>
                <textarea
                  id="notes"
                  name="notes"
                  defaultValue={editingItem.notes}
                  rows={4}
                  style={{ resize: 'vertical' }}
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
                    setEditingItem(null)
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