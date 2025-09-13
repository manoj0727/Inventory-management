import { useState, useEffect, useRef } from 'react'
import '../styles/common.css'
import { API_URL } from '@/config/api'

interface Employee {
  _id: string
  employeeId: string
  username: string
  name: string
  email: string
  mobile: string
  address: {
    street: string
    city: string
    state: string
    pincode: string
  }
  salary: number
  work: string
  photo: string | null
  joiningDate: string
  status: string
  role: string
}

export default function Employees() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [photoData, setPhotoData] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    mobile: '',
    address: '',
    salary: '',
    work: '',
    photo: ''
  })

  useEffect(() => {
    fetchEmployees()
  }, [])

  const fetchEmployees = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`${API_URL}/api/employees`)
      if (response.ok) {
        const data = await response.json()
        setEmployees(data)
      }
    } catch (error) {
      // Error fetching employees
    } finally {
      setIsLoading(false)
    }
  }


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!formData.username.trim()) {
      alert('Please enter a username')
      return
    }
    
    if (!editingEmployee && !formData.password.trim()) {
      alert('Please enter a password for new employee')
      return
    }
    
    if (!formData.name.trim()) {
      alert('Please enter employee name')
      return
    }
    
    if (!formData.mobile.trim()) {
      alert('Please enter mobile number')
      return
    }
    
    if (!formData.salary || parseFloat(formData.salary) <= 0) {
      alert('Please enter a valid salary')
      return
    }
    
    if (!formData.work.trim()) {
      alert('Please enter work type')
      return
    }
    
    setIsLoading(true)
    
    try {
      const employeeData: any = {
        username: formData.username.trim().toLowerCase(),
        name: formData.name.trim(),
        email: `${formData.username.trim().toLowerCase()}@company.com`,
        mobile: formData.mobile.trim(),
        address: {
          street: formData.address.trim(),
          city: '',
          state: '',
          pincode: ''
        },
        salary: parseFloat(formData.salary),
        work: formData.work.trim(),
        photo: photoData || null
      }
      
      // Only include password if it's provided (for new employees or password update)
      if (formData.password.trim()) {
        employeeData.password = formData.password.trim()
      }

      const url = editingEmployee 
        ? `${API_URL}/api/employees/${editingEmployee._id}`
        : `${API_URL}/api/employees`
      
      const method = editingEmployee ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(employeeData)
      })

      if (response.ok) {
        alert(editingEmployee ? 'Employee updated successfully!' : 'Employee created successfully!')
        await fetchEmployees()
        resetForm()
      } else {
        const error = await response.json()
        // Server error
        alert(error.message || 'Failed to save employee. Please check all fields.')
      }
    } catch (error) {
      // Error saving employee
      alert('Error saving employee. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee)
    setFormData({
      username: employee.username,
      password: '',
      name: employee.name,
      mobile: employee.mobile || '',
      address: employee.address?.street || '',
      salary: employee.salary?.toString() || '',
      work: employee.work || '',
      photo: employee.photo || ''
    })
    setPhotoData(employee.photo)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this employee?')) return
    
    try {
      const response = await fetch(`${API_URL}/api/employees/${id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        alert('Employee deleted successfully!')
        fetchEmployees()
      }
    } catch (error) {
      alert('Error deleting employee')
    }
  }

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      name: '',
      mobile: '',
      address: '',
      salary: '',
      work: '',
      photo: ''
    })
    setPhotoData(null)
    setEditingEmployee(null)
    setShowForm(false)
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Employee Management</h1>
        <p>Manage employee records and account access</p>
      </div>

      {/* Add Employee Button */}
      {!showForm && (
        <div className="content-card">
          <button onClick={() => setShowForm(true)} className="btn btn-primary">
            + Add New Employee
          </button>
        </div>
      )}

      {/* Employee Form */}
      {showForm && (
        <div className="content-card">
          <h2 style={{ marginBottom: '24px' }}>
            {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
          </h2>
          
          <form onSubmit={handleSubmit}>
            {/* Photo Section - Simplified */}
            <div style={{ marginBottom: '24px', padding: '20px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <label style={{ display: 'block', marginBottom: '12px', fontWeight: '600', fontSize: '16px', color: '#1e293b' }}>
                Employee Photo URL (Optional)
              </label>
              <input
                type="text"
                placeholder="Enter photo URL (optional)"
                value={formData.photo}
                onChange={(e) => setFormData({...formData, photo: e.target.value})}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '15px'
                }}
              />
              {formData.photo && (
                <div style={{ marginTop: '12px', textAlign: 'center' }}>
                  <img
                    src={formData.photo}
                    alt="Employee preview"
                    style={{
                      maxWidth: '150px',
                      maxHeight: '150px',
                      objectFit: 'cover',
                      borderRadius: '8px',
                      border: '2px solid #e5e7eb'
                    }}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                </div>
              )}
            </div>

            {/* Form Fields in Grid */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(2, 1fr)', 
              gap: '24px',
              padding: '24px',
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              marginBottom: '24px'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontWeight: '500', fontSize: '14px', color: '#475569' }}>Username *</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  required
                  disabled={editingEmployee !== null}
                  style={{ 
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '15px',
                    background: editingEmployee ? '#f1f5f9' : '#ffffff'
                  }}
                />
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontWeight: '500', fontSize: '14px', color: '#475569' }}>Password *</label>
                <input
                  type="text"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder={editingEmployee ? 'Leave blank to keep current' : 'Enter password'}
                  required={!editingEmployee}
                  style={{ 
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '15px'
                  }}
                />
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontWeight: '500', fontSize: '14px', color: '#475569' }}>Full Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  style={{ 
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '15px'
                  }}
                />
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontWeight: '500', fontSize: '14px', color: '#475569' }}>Mobile Number *</label>
                <input
                  type="tel"
                  value={formData.mobile}
                  onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                  required
                  style={{ 
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '15px'
                  }}
                />
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontWeight: '500', fontSize: '14px', color: '#475569' }}>Work Type *</label>
                <input
                  type="text"
                  value={formData.work}
                  onChange={(e) => setFormData({...formData, work: e.target.value})}
                  placeholder="e.g., Tailor, Cutter, Helper"
                  required
                  style={{ 
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '15px'
                  }}
                />
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontWeight: '500', fontSize: '14px', color: '#475569' }}>Monthly Salary *</label>
                <input
                  type="number"
                  value={formData.salary}
                  onChange={(e) => setFormData({...formData, salary: e.target.value})}
                  required
                  min="0"
                  step="100"
                  style={{ 
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '15px'
                  }}
                />
              </div>
              
              <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontWeight: '500', fontSize: '14px', color: '#475569' }}>Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  placeholder="Enter complete address"
                  style={{ 
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '15px'
                  }}
                />
              </div>
            </div>

            <div className="btn-group">
              <button type="submit" className="btn btn-primary" disabled={isLoading}>
                {isLoading ? 'Saving...' : editingEmployee ? 'Update Employee' : 'Create Employee'}
              </button>
              <button type="button" onClick={resetForm} className="btn btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Employees List */}
      <div className="content-card">
        <h2 style={{ marginBottom: '20px' }}>Employee List</h2>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Photo</th>
                <th>ID</th>
                <th>Name</th>
                <th>Username</th>
                <th>Mobile</th>
                <th>Address</th>
                <th>Work</th>
                <th>Salary</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '40px' }}>
                    Loading employees...
                  </td>
                </tr>
              ) : employees.length > 0 ? (
                employees.map(employee => (
                  <tr key={employee._id}>
                    <td>
                      {employee.photo ? (
                        <img 
                          src={employee.photo} 
                          alt={employee.name}
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            transform: 'scaleX(-1)'
                          }}
                        />
                      ) : (
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: '#e5e7eb',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '16px',
                          fontWeight: '600',
                          color: '#6b7280'
                        }}>
                          {employee.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </td>
                    <td style={{ fontWeight: '600' }}>{employee.employeeId}</td>
                    <td>{employee.name}</td>
                    <td>{employee.username}</td>
                    <td>{employee.mobile || '-'}</td>
                    <td>{employee.address?.street || '-'}</td>
                    <td>{employee.work || '-'}</td>
                    <td>₹{employee.salary?.toLocaleString() || '0'}</td>
                    <td>
                      <span className={`badge ${employee.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                        {employee.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button onClick={() => handleEdit(employee)} className="action-btn edit">
                          Edit
                        </button>
                        <button onClick={() => handleDelete(employee._id)} className="action-btn delete">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="empty-state">
                    <div className="empty-state-icon">👥</div>
                    <h3>No Employees</h3>
                    <p>Click "Add New Employee" to get started</p>
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