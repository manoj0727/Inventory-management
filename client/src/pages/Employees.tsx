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
  aadharNumber?: string
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
    aadharNumber: '',
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
        aadharNumber: formData.aadharNumber.trim(),
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
      aadharNumber: employee.aadharNumber || '',
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
      aadharNumber: '',
      address: '',
      salary: '',
      work: '',
      photo: ''
    })
    setPhotoData(null)
    setEditingEmployee(null)
    setShowForm(false)
  }

  const generateIDCard = (employee: Employee) => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const idCardHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Employee ID Card - ${employee.name}</title>
        <style>
          @page {
            size: 3.5in 2.25in;
            margin: 0;
          }
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Arial', 'Helvetica', sans-serif;
            margin: 0;
            padding: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background: white;
          }
          .id-card {
            width: 3.5in;
            height: 2.25in;
            background: white;
            border: 2px solid #1e40af;
            border-radius: 10px;
            overflow: hidden;
            position: relative;
            display: flex;
            flex-direction: column;
          }
          .id-card-header {
            background: linear-gradient(90deg, #1e40af 0%, #3b82f6 100%);
            padding: 10px 0;
            text-align: center;
            color: white;
          }
          .company-name {
            font-size: 18px;
            font-weight: bold;
            margin: 0;
            letter-spacing: 1px;
            text-transform: uppercase;
          }
          .id-card-body {
            flex: 1;
            padding: 15px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: white;
          }
          .photo-container {
            margin-bottom: 12px;
            text-align: center;
          }
          .photo {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            border: 3px solid #1e40af;
            background: #f3f4f6;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 32px;
            color: #6b7280;
            font-weight: bold;
            overflow: hidden;
            margin: 0 auto;
          }
          .photo img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          .employee-info {
            text-align: center;
            width: 100%;
          }
          .employee-name {
            font-size: 20px;
            font-weight: bold;
            color: #1e293b;
            margin-bottom: 4px;
          }
          .employee-id {
            display: inline-block;
            background: #1e40af;
            color: white;
            padding: 4px 12px;
            border-radius: 15px;
            font-weight: bold;
            font-size: 14px;
            margin-bottom: 10px;
          }
          .employee-role {
            font-size: 14px;
            color: #64748b;
            font-weight: 600;
            margin-bottom: 12px;
            text-transform: uppercase;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
            width: 100%;
            max-width: 280px;
            margin: 0 auto;
            font-size: 11px;
          }
          .info-item {
            text-align: left;
          }
          .info-label {
            font-weight: 600;
            color: #64748b;
            display: inline;
          }
          .info-value {
            color: #1e293b;
            display: inline;
            margin-left: 4px;
          }
          .id-card-footer {
            background: #f8fafc;
            padding: 6px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
            font-size: 9px;
            color: #94a3b8;
          }
          @media print {
            body {
              margin: 0;
              padding: 0;
              background: white;
              min-height: auto;
            }
            .id-card {
              border: 2px solid #1e40af;
              page-break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div class="id-card">
          <div class="id-card-header">
            <h1 class="company-name">Employee ID Card</h1>
          </div>
          <div class="id-card-body">
            <div class="photo-container">
              <div class="photo">
                ${employee.photo
                  ? `<img src="${employee.photo}" alt="${employee.name}" />`
                  : employee.name.charAt(0).toUpperCase()
                }
              </div>
            </div>
            <div class="employee-info">
              <div class="employee-name">${employee.name}</div>
              <div class="employee-id">${employee.employeeId}</div>
              <div class="employee-role">${employee.work}</div>
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">Mobile:</span>
                  <span class="info-value">${employee.mobile}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Joined:</span>
                  <span class="info-value">${new Date(employee.joiningDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                </div>
                ${employee.aadharNumber ? `
                <div class="info-item">
                  <span class="info-label">Aadhar:</span>
                  <span class="info-value">****-${employee.aadharNumber.slice(-4)}</span>
                </div>
                ` : ''}
                <div class="info-item">
                  <span class="info-label">Status:</span>
                  <span class="info-value" style="color: ${employee.status === 'active' ? '#10b981' : '#ef4444'}; font-weight: 600;">${employee.status.toUpperCase()}</span>
                </div>
              </div>
            </div>
          </div>
          <div class="id-card-footer">
            This card is property of the company. If found, please return.
          </div>
        </div>
        <script>
          window.onload = () => {
            setTimeout(() => {
              window.print();
            }, 500);
          };
        </script>
      </body>
      </html>
    `

    printWindow.document.write(idCardHTML)
    printWindow.document.close()
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
            {/* Photo Section - Upload or URL */}
            <div style={{ marginBottom: '24px', padding: '20px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <label style={{ display: 'block', marginBottom: '12px', fontWeight: '600', fontSize: '16px', color: '#1e293b' }}>
                Employee Photo
              </label>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
                <label style={{
                  padding: '10px 20px',
                  background: '#4f46e5',
                  color: 'white',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  fontSize: '14px',
                  transition: 'background 0.2s',
                  display: 'inline-block'
                }}>
                  Upload Photo
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        if (file.size > 5 * 1024 * 1024) {
                          alert('Image size should be less than 5MB')
                          return
                        }
                        const reader = new FileReader()
                        reader.onloadend = () => {
                          const base64String = reader.result as string
                          setPhotoData(base64String)
                          setFormData({...formData, photo: base64String})
                        }
                        reader.readAsDataURL(file)
                      }
                    }}
                  />
                </label>

                <span style={{ color: '#64748b', fontSize: '14px' }}>OR</span>

                <input
                  type="text"
                  placeholder="Enter photo URL"
                  value={formData.photo.startsWith('data:') ? '' : formData.photo}
                  onChange={(e) => {
                    setFormData({...formData, photo: e.target.value})
                    setPhotoData(e.target.value)
                  }}
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '15px'
                  }}
                />
              </div>

              {(photoData || formData.photo) && (
                <div style={{ textAlign: 'center' }}>
                  <img
                    src={photoData || formData.photo}
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
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoData(null)
                      setFormData({...formData, photo: ''})
                    }}
                    style={{
                      display: 'block',
                      margin: '8px auto 0',
                      padding: '4px 12px',
                      background: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    Remove Photo
                  </button>
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
                  pattern="[0-9]{10}"
                  maxLength={10}
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
                <label style={{ fontWeight: '500', fontSize: '14px', color: '#475569' }}>Aadhar Number</label>
                <input
                  type="text"
                  value={formData.aadharNumber}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '')
                    if (value.length <= 12) {
                      setFormData({...formData, aadharNumber: value})
                    }
                  }}
                  placeholder="Enter 12-digit Aadhar number"
                  pattern="[0-9]{12}"
                  maxLength={12}
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
                <select
                  value={formData.work}
                  onChange={(e) => setFormData({...formData, work: e.target.value})}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '15px'
                  }}
                >
                  <option value="">Select Work Type</option>
                  <option value="Tailor">Tailor</option>
                  <option value="Cutter">Cutter</option>
                  <option value="Helper">Helper</option>
                  <option value="Supervisor">Supervisor</option>
                  <option value="Quality Check">Quality Check</option>
                  <option value="Packing">Packing</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontWeight: '500', fontSize: '14px', color: '#475569' }}>Monthly Salary (₹) *</label>
                <input
                  type="number"
                  value={formData.salary}
                  onChange={(e) => setFormData({...formData, salary: e.target.value})}
                  required
                  min="0"
                  step="500"
                  placeholder="Enter monthly salary"
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
                <label style={{ fontWeight: '500', fontSize: '14px', color: '#475569' }}>Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  placeholder="Enter complete address"
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '15px',
                    resize: 'vertical',
                    minHeight: '60px'
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
                <th>Aadhar</th>
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
                  <td colSpan={11} style={{ textAlign: 'center', padding: '40px' }}>
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
                    <td>{employee.aadharNumber ? `XXXX-${employee.aadharNumber.slice(-4)}` : '-'}</td>
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
                        <button onClick={() => generateIDCard(employee)} className="action-btn" style={{ background: '#10b981' }}>
                          ID Card
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
                  <td colSpan={11} className="empty-state">
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