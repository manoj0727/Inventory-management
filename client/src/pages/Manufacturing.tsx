import { useState } from 'react'
import '../styles/common.css'

interface ManufacturingOrder {
  orderId: string
  productName: string
  quantity: string
  fabricRequired: string
  startDate: string
  endDate: string
  assignedTo: string
  priority: string
  status: string
  notes: string
}

export default function Manufacturing() {
  const [formData, setFormData] = useState<ManufacturingOrder>({
    orderId: '',
    productName: '',
    quantity: '',
    fabricRequired: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    assignedTo: '',
    priority: 'Normal',
    status: 'Pending',
    notes: ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Manufacturing Order:', formData)
    alert('✅ Manufacturing order created successfully!')
    
    // Reset form
    setFormData({
      orderId: '',
      productName: '',
      quantity: '',
      fabricRequired: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      assignedTo: '',
      priority: 'Normal',
      status: 'Pending',
      notes: ''
    })
  }

  const activeOrders = [
    {
      id: 'MFG001',
      product: 'T-Shirt',
      quantity: 100,
      progress: 75,
      status: 'In Progress',
      dueDate: '2024-01-25'
    },
    {
      id: 'MFG002',
      product: 'Dress',
      quantity: 50,
      progress: 40,
      status: 'In Progress',
      dueDate: '2024-01-28'
    },
    {
      id: 'MFG003',
      product: 'Jeans',
      quantity: 75,
      progress: 10,
      status: 'Started',
      dueDate: '2024-02-01'
    }
  ]

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Manufacturing</h1>
        <p>Create and manage manufacturing orders</p>
      </div>

      {/* Statistics */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Active Orders</h3>
          <p className="stat-value">8</p>
        </div>
        <div className="stat-card">
          <h3>In Production</h3>
          <p className="stat-value">5</p>
        </div>
        <div className="stat-card">
          <h3>Completed Today</h3>
          <p className="stat-value">3</p>
        </div>
        <div className="stat-card">
          <h3>Pending</h3>
          <p className="stat-value">2</p>
        </div>
        <div className="stat-card">
          <h3>Efficiency</h3>
          <p className="stat-value">92%</p>
        </div>
      </div>

      {/* Create Manufacturing Order */}
      <div className="content-card">
        <h2 style={{ marginBottom: '20px', color: '#374151' }}>Create Manufacturing Order</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="orderId">Order ID *</label>
              <input
                type="text"
                id="orderId"
                name="orderId"
                value={formData.orderId}
                onChange={handleChange}
                placeholder="e.g., MFG004"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="productName">Product Name *</label>
              <input
                type="text"
                id="productName"
                name="productName"
                value={formData.productName}
                onChange={handleChange}
                placeholder="e.g., T-Shirt, Dress"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="quantity">Quantity *</label>
              <input
                type="number"
                id="quantity"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                placeholder="Number of units"
                min="1"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="fabricRequired">Fabric Required (meters)</label>
              <input
                type="number"
                id="fabricRequired"
                name="fabricRequired"
                value={formData.fabricRequired}
                onChange={handleChange}
                placeholder="Total fabric needed"
                min="0.1"
                step="0.1"
              />
            </div>

            <div className="form-group">
              <label htmlFor="startDate">Start Date *</label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="endDate">Due Date *</label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="assignedTo">Assigned To *</label>
              <input
                type="text"
                id="assignedTo"
                name="assignedTo"
                value={formData.assignedTo}
                onChange={handleChange}
                placeholder="Team or employee name"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="priority">Priority</label>
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
              >
                <option value="Low">Low</option>
                <option value="Normal">Normal</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="notes">Special Instructions</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Any special instructions for manufacturing"
              rows={3}
              style={{ resize: 'vertical' }}
            />
          </div>

          <div className="btn-group">
            <button type="submit" className="btn btn-primary">
              Create Order
            </button>
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={() => setFormData({
                orderId: '',
                productName: '',
                quantity: '',
                fabricRequired: '',
                startDate: new Date().toISOString().split('T')[0],
                endDate: '',
                assignedTo: '',
                priority: 'Normal',
                status: 'Pending',
                notes: ''
              })}
            >
              Clear Form
            </button>
          </div>
        </form>
      </div>

      {/* Active Orders */}
      <div className="content-card">
        <h2 style={{ marginBottom: '20px', color: '#374151' }}>Active Manufacturing Orders</h2>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Product</th>
                <th>Quantity</th>
                <th>Progress</th>
                <th>Status</th>
                <th>Due Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {activeOrders.map((order) => (
                <tr key={order.id}>
                  <td style={{ fontWeight: '500' }}>{order.id}</td>
                  <td>{order.product}</td>
                  <td>{order.quantity}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ 
                        width: '100px', 
                        height: '8px', 
                        background: '#e5e7eb', 
                        borderRadius: '4px',
                        overflow: 'hidden'
                      }}>
                        <div style={{ 
                          width: `${order.progress}%`, 
                          height: '100%', 
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          transition: 'width 0.3s'
                        }} />
                      </div>
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>{order.progress}%</span>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${order.status === 'In Progress' ? 'badge-info' : 'badge-warning'}`}>
                      {order.status}
                    </span>
                  </td>
                  <td>{order.dueDate}</td>
                  <td>
                    <div className="action-buttons">
                      <button className="action-btn view">View</button>
                      <button className="action-btn edit">Update</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Production Timeline */}
      <div className="content-card">
        <h2 style={{ marginBottom: '20px', color: '#374151' }}>Production Timeline</h2>
        <div style={{ padding: '20px', background: '#f9fafb', borderRadius: '8px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ 
                width: '12px', 
                height: '12px', 
                borderRadius: '50%', 
                background: '#10b981' 
              }} />
              <div>
                <strong>MFG001 - T-Shirt (100 units)</strong>
                <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#6b7280' }}>75% Complete - Due: Jan 25</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ 
                width: '12px', 
                height: '12px', 
                borderRadius: '50%', 
                background: '#f59e0b' 
              }} />
              <div>
                <strong>MFG002 - Dress (50 units)</strong>
                <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#6b7280' }}>40% Complete - Due: Jan 28</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ 
                width: '12px', 
                height: '12px', 
                borderRadius: '50%', 
                background: '#3b82f6' 
              }} />
              <div>
                <strong>MFG003 - Jeans (75 units)</strong>
                <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#6b7280' }}>10% Complete - Due: Feb 1</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}