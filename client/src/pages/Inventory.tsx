import { useState, useEffect } from 'react'
import '../styles/common.css'

interface InventoryItem {
  id: string
  name: string
  color: string
  category: string
  quantity: number
  location: string
  status: string
}

export default function Inventory() {
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
      const response = await fetch('http://localhost:4000/api/fabrics')
      if (response.ok) {
        const fabrics = await response.json()
        const inventoryItems = fabrics.map((fabric: any) => ({
          id: generateProductId(fabric.fabricType, fabric.color, Math.floor(fabric.quantity)),
          name: fabric.fabricType,
          color: fabric.color,
          category: 'Fabric',
          quantity: fabric.quantity,
          location: fabric.location || 'N/A',
          status: fabric.status
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
        const response = await fetch('http://localhost:4000/api/fabrics')
        if (response.ok) {
          const fabrics = await response.json()
          const fabricToDelete = fabrics.find((fabric: any) => 
            fabric.fabricType === item.name && fabric.color === item.color
          )
          
          if (fabricToDelete) {
            const deleteResponse = await fetch(`http://localhost:4000/api/fabrics/${fabricToDelete._id}`, {
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
      const response = await fetch('http://localhost:4000/api/fabrics')
      if (response.ok) {
        const fabrics = await response.json()
        const fabricToUpdate = fabrics.find((fabric: any) => 
          fabric.fabricType === editingItem?.name && fabric.color === editingItem?.color
        )
        
        if (fabricToUpdate) {
          const updateResponse = await fetch(`http://localhost:4000/api/fabrics/${fabricToUpdate._id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              fabricType: updatedItem.name,
              color: updatedItem.color,
              location: updatedItem.location
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
        <h1>Inventory Management</h1>
        <p>Manage your products and stock levels</p>
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
            <button className="btn btn-primary">
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
                        <button className="action-btn edit">✏️</button>
                        <button className="action-btn delete">🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                    {isLoading ? 'Loading inventory...' : 'No inventory items found'}
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