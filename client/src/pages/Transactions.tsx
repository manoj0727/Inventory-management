import { useState, useEffect } from 'react'
import '../styles/common.css'
import { API_URL } from '@/config/api'

interface Transaction {
  id: string
  timestamp: string
  itemType: 'FABRIC' | 'MANUFACTURING' | 'CUTTING' | 'QR_GENERATED' | 'UNKNOWN'
  itemId: string
  itemName: string
  action: 'ADD' | 'REMOVE' | 'QR_GENERATED'
  quantity: number
  previousStock: number
  newStock: number
  performedBy: string
  source: 'QR_SCANNER' | 'MANUAL' | 'QR_GENERATION'
  type?: string
  productInfo?: any
  generatedBy?: string
}

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [filter, setFilter] = useState<'all' | 'add' | 'remove' | 'qr_generated'>('all')
  const [typeFilter, setTypeFilter] = useState<'all' | 'FABRIC' | 'MANUFACTURING' | 'CUTTING' | 'QR_GENERATED'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState('')

  useEffect(() => {
    loadTransactions()
  }, [])

  const loadTransactions = async () => {
    try {
      const response = await fetch(`${API_URL}/api/transactions`)
      if (response.ok) {
        const data = await response.json()
        setTransactions(data.transactions || data)
      }
    } catch (error) {
      console.error('Error loading transactions:', error)
      // Fallback to localStorage if API fails
      const savedTransactions = localStorage.getItem('inventory_transactions')
      if (savedTransactions) {
        const parsedTransactions = JSON.parse(savedTransactions)
        parsedTransactions.sort((a: Transaction, b: Transaction) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
        setTransactions(parsedTransactions)
      }
    }
  }

  const clearTransactions = async () => {
    if (window.confirm('Are you sure you want to clear all transaction history?')) {
      try {
        const response = await fetch(`${API_URL}/api/transactions`, {
          method: 'DELETE'
        })
        if (response.ok) {
          setTransactions([])
          localStorage.removeItem('inventory_transactions') // Also clear localStorage
        }
      } catch (error) {
        console.error('Error clearing transactions:', error)
        alert('Failed to clear transactions')
      }
    }
  }

  const exportTransactions = () => {
    const dataStr = JSON.stringify(transactions, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)

    const exportFileDefaultName = `transactions_${new Date().toISOString().split('T')[0]}.json`

    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  const filteredTransactions = transactions.filter(transaction => {
    // Filter by action
    if (filter !== 'all') {
      if (filter === 'qr_generated' && transaction.action !== 'QR_GENERATED') {
        return false
      } else if (filter !== 'qr_generated' && transaction.action.toLowerCase() !== filter) {
        return false
      }
    }

    // Filter by type
    if (typeFilter !== 'all' && transaction.itemType !== typeFilter) {
      return false
    }

    // Filter by search term
    if (searchTerm && !transaction.itemName.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !transaction.itemId.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false
    }

    // Filter by date
    if (dateFilter) {
      const transactionDate = new Date(transaction.timestamp).toISOString().split('T')[0]
      if (transactionDate !== dateFilter) {
        return false
      }
    }

    return true
  })

  const getActionBadgeClass = (action: string) => {
    switch(action) {
      case 'ADD': return 'badge-success'
      case 'REMOVE': return 'badge-danger'
      case 'QR_GENERATED': return 'badge-info'
      default: return 'badge-secondary'
    }
  }

  const getTypeBadgeClass = (type: string) => {
    switch(type) {
      case 'FABRIC': return 'badge-info'
      case 'MANUFACTURING': return 'badge-success'
      case 'CUTTING': return 'badge-warning'
      case 'QR_GENERATED': return 'badge-purple'
      default: return 'badge-secondary'
    }
  }

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
  }

  // Calculate statistics
  const stats = {
    total: transactions.length,
    additions: transactions.filter(t => t.action === 'ADD').length,
    removals: transactions.filter(t => t.action === 'REMOVE').length,
    qrGenerated: transactions.filter(t => t.action === 'QR_GENERATED').length,
    today: transactions.filter(t =>
      new Date(t.timestamp).toDateString() === new Date().toDateString()
    ).length
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Inventory Transactions</h1>
        <p>Track all inventory changes from QR scanner operations and QR code generation</p>
      </div>

      {/* Statistics Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '24px'
      }}>
        <div className="content-card" style={{
          background: 'white',
          padding: '20px',
          border: '2px solid #667eea'
        }}>
          <h3 style={{ margin: 0, fontSize: '14px', color: '#667eea' }}>Total Transactions</h3>
          <p style={{ margin: '8px 0 0 0', fontSize: '32px', fontWeight: 'bold', color: '#667eea' }}>{stats.total}</p>
        </div>

        <div className="content-card" style={{
          background: 'white',
          padding: '20px',
          border: '2px solid #10b981'
        }}>
          <h3 style={{ margin: 0, fontSize: '14px', color: '#10b981' }}>Stock Additions</h3>
          <p style={{ margin: '8px 0 0 0', fontSize: '32px', fontWeight: 'bold', color: '#10b981' }}>{stats.additions}</p>
        </div>

        <div className="content-card" style={{
          background: 'white',
          padding: '20px',
          border: '2px solid #ef4444'
        }}>
          <h3 style={{ margin: 0, fontSize: '14px', color: '#ef4444' }}>Stock Removals</h3>
          <p style={{ margin: '8px 0 0 0', fontSize: '32px', fontWeight: 'bold', color: '#ef4444' }}>{stats.removals}</p>
        </div>

        <div className="content-card" style={{
          background: 'white',
          padding: '20px',
          border: '2px solid #8b5cf6'
        }}>
          <h3 style={{ margin: 0, fontSize: '14px', color: '#8b5cf6' }}>QR Generated</h3>
          <p style={{ margin: '8px 0 0 0', fontSize: '32px', fontWeight: 'bold', color: '#8b5cf6' }}>{stats.qrGenerated}</p>
        </div>

        <div className="content-card" style={{
          background: 'white',
          padding: '20px',
          border: '2px solid #3b82f6'
        }}>
          <h3 style={{ margin: 0, fontSize: '14px', color: '#3b82f6' }}>Today's Transactions</h3>
          <p style={{ margin: '8px 0 0 0', fontSize: '32px', fontWeight: 'bold', color: '#3b82f6' }}>{stats.today}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="content-card">
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search */}
          <input
            type="text"
            placeholder="Search by item name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ flex: 1, minWidth: '200px' }}
          />

          {/* Date Filter */}
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            style={{ minWidth: '150px' }}
          />

          {/* Action Filter */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            style={{ minWidth: '120px' }}
          >
            <option value="all">All Actions</option>
            <option value="add">Additions</option>
            <option value="remove">Removals</option>
            <option value="qr_generated">QR Generated</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            style={{ minWidth: '120px' }}
          >
            <option value="all">All Types</option>
            <option value="FABRIC">Fabric</option>
            <option value="MANUFACTURING">Manufacturing</option>
            <option value="CUTTING">Cutting</option>
            <option value="QR_GENERATED">QR Generated</option>
          </select>

          {/* Action Buttons */}
          <button
            onClick={loadTransactions}
            className="btn btn-secondary"
          >
            🔄 Refresh
          </button>

          <button
            onClick={exportTransactions}
            className="btn btn-primary"
            disabled={transactions.length === 0}
          >
            📥 Export
          </button>

          <button
            onClick={clearTransactions}
            className="btn btn-danger"
            disabled={transactions.length === 0}
          >
            🗑️ Clear All
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="content-card">
        <h2 style={{ marginBottom: '20px' }}>Transaction History</h2>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Item Type</th>
                <th>Item Name</th>
                <th>Item ID</th>
                <th>Action</th>
                <th>Quantity</th>
                <th>Previous Stock</th>
                <th>New Stock</th>
                <th>Change</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td>{formatDate(transaction.timestamp)}</td>
                    <td>
                      <span className={`badge ${getTypeBadgeClass(transaction.itemType)}`}>
                        {transaction.itemType}
                      </span>
                    </td>
                    <td style={{ fontWeight: '500' }}>{transaction.itemName}</td>
                    <td style={{ fontSize: '12px', color: '#6b7280' }}>{transaction.itemId}</td>
                    <td>
                      <span className={`badge ${getActionBadgeClass(transaction.action)}`}>
                        {transaction.action === 'ADD' ? '➕ ADD' :
                         transaction.action === 'REMOVE' ? '➖ REMOVE' :
                         '📱 QR GENERATED'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: '600' }}>{transaction.quantity}</td>
                    <td style={{ textAlign: 'center' }}>{transaction.previousStock}</td>
                    <td style={{
                      textAlign: 'center',
                      fontWeight: '600',
                      color: transaction.newStock > transaction.previousStock ? '#10b981' : '#ef4444'
                    }}>
                      {transaction.newStock}
                    </td>
                    <td style={{
                      textAlign: 'center',
                      fontWeight: '600',
                      color: transaction.action === 'ADD' ? '#10b981' : '#ef4444'
                    }}>
                      {transaction.action === 'ADD' ? '+' : '-'}{transaction.quantity}
                    </td>
                    <td>
                      <span className="badge badge-secondary">
                        {transaction.source === 'QR_SCANNER' ? '📱 QR Scanner' :
                         transaction.source === 'QR_GENERATION' ? '🏷️ QR Gen' :
                         '✏️ Manual'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="empty-state">
                    <div className="empty-state-icon">📊</div>
                    <h3>No Transactions Found</h3>
                    <p>
                      {searchTerm || dateFilter || filter !== 'all' || typeFilter !== 'all'
                        ? 'Try adjusting your filters'
                        : 'Transactions will appear here when you add or remove stock using QR scanner'}
                    </p>
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