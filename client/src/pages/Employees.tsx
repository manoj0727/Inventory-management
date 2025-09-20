import { useState, useEffect, useRef } from 'react'
import '../styles/common.css'
import { API_URL } from '@/config/api'
import { compressImage, getBase64SizeInKB } from '@/utils/imageCompression'

interface Employee {
  _id: string
  employeeId: string
  username: string
  name: string
  email: string
  mobile: string
  dob: string
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
    dob: '',
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

    if (!formData.dob) {
      alert('Please enter date of birth')
      return
    }

    setIsLoading(true)
    
    try {
      const employeeData: any = {
        username: formData.username.trim().toLowerCase(),
        name: formData.name.trim(),
        email: `${formData.username.trim().toLowerCase()}@company.com`,
        mobile: formData.mobile.trim(),
        dob: formData.dob || null,
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
      dob: employee.dob ? new Date(employee.dob).toISOString().split('T')[0] : '',
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
      dob: '',
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
    // Format DOB for display
    const dob = employee.dob && employee.dob !== ''
      ? new Date(employee.dob).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })
      : 'Not Available'

    const idCardContent = `
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
            font-family: 'Times New Roman', serif;
            margin: 0;
            padding: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background: white;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            color-adjust: exact;
          }
          .id-card {
            width: 3.5in;
            height: 2.25in;
            background: white;
            border: 3px solid #001f3f;
            border-radius: 8px;
            overflow: hidden;
            position: relative;
            display: flex;
            flex-direction: column;
          }
          .id-card-header {
            background: #001f3f !important;
            padding: 10px 0;
            text-align: center;
            color: white !important;
            border-bottom: 2px solid #ffd700;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .company-name {
            font-size: 22px;
            font-weight: bold;
            margin: 0;
            letter-spacing: 3px;
            text-transform: uppercase;
            font-family: 'Times New Roman', serif;
            color: white !important;
          }
          .company-tagline {
            font-size: 7px;
            margin-top: 3px;
            letter-spacing: 1px;
            text-transform: uppercase;
            color: #ffd700 !important;
            font-family: 'Times New Roman', serif;
          }
          .id-card-body {
            flex: 1;
            padding: 12px;
            display: flex;
            gap: 15px;
            background: white;
            position: relative;
          }
          .left-section {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
          }
          .photo {
            width: 90px;
            height: 90px;
            border-radius: 6px;
            border: 2px solid #001f3f;
            background: #f8f9fa;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 36px;
            color: #000000;
            font-weight: bold;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          .photo img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          .right-section {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
            padding-left: 5px;
          }
          .info-row {
            margin-bottom: 6px;
            display: flex;
            align-items: baseline;
            font-size: 11px;
          }
          .info-label {
            font-weight: 600;
            color: #000000;
            min-width: 65px;
            font-family: 'Times New Roman', serif;
          }
          .info-value {
            color: #000000;
            font-weight: 500;
            flex: 1;
            font-family: 'Times New Roman', serif;
          }
          .employee-name {
            font-size: 15px;
            font-weight: bold;
            color: #000000;
            font-family: 'Times New Roman', serif;
          }
          .employee-id {
            font-size: 13px;
            font-weight: bold;
            color: #001f3f;
            font-family: 'Times New Roman', serif;
          }
          .signature-section {
            position: absolute;
            bottom: 8px;
            right: 15px;
            text-align: center;
            width: 80px;
          }
          .signature-label {
            font-size: 9px;
            color: #000000;
            margin-top: 20px;
            border-top: 1px solid #001f3f;
            padding-top: 3px;
            font-family: 'Times New Roman', serif;
            font-weight: 600;
          }
          @media print {
            body {
              margin: 0;
              padding: 0;
              background: white;
              min-height: auto;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .id-card {
              border: 3px solid #001f3f !important;
              page-break-inside: avoid;
            }
            .id-card-header {
              background: #001f3f !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
        </style>
      </head>
      <body>
        <div class="id-card">
          <div class="id-card-header">
            <h1 class="company-name">WESTO INDIA</h1>
            <div class="company-tagline">A NAME BEHIND MANY SUCCESSFUL BRANDS</div>
          </div>
          <div class="id-card-body">
            <div class="left-section">
              <div class="photo">
                ${employee.photo
                  ? `<img src="${employee.photo}" alt="${employee.name}" />`
                  : employee.name.charAt(0).toUpperCase()
                }
              </div>
            </div>
            <div class="right-section">
              <div class="info-row">
                <span class="info-label">Name:</span>
                <span class="info-value employee-name">${employee.name}</span>
              </div>
              <div class="info-row">
                <span class="info-label">DOB:</span>
                <span class="info-value">${dob}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Mobile:</span>
                <span class="info-value">${employee.mobile}</span>
              </div>
              <div class="info-row">
                <span class="info-label">EMP ID:</span>
                <span class="info-value employee-id">${employee.employeeId}</span>
              </div>
            </div>
            <div class="signature-section">
              <div class="signature-label">Authorized Sign</div>
            </div>
          </div>
        </div>
        <script>
          function printCard() {
            window.print();
          }
        </script>
        <div class="print-button-container" style="
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 1000;
          text-align: center;
        ">
          <button onclick="printCard()" style="
            background: #001f3f;
            color: white;
            padding: 12px 40px;
            border: none;
            border-radius: 5px;
            font-size: 16px;
            cursor: pointer;
            font-family: 'Times New Roman', serif;
            font-weight: bold;
            box-shadow: 0 4px 8px rgba(0,0,0,0.3);
            transition: all 0.3s ease;
          "
          onmouseover="this.style.background='#003366'; this.style.transform='scale(1.05)';"
          onmouseout="this.style.background='#001f3f'; this.style.transform='scale(1)';"
          >Print ID Card</button>
        </div>
        <style>
          @media print {
            .print-button-container { display: none !important; }
          }
        </style>
      </body>
      </html>
    `

    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    printWindow.document.write(idCardContent)
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
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        if (file.size > 5 * 1024 * 1024) {
                          alert('Image size should be less than 5MB')
                          return
                        }
                        try {
                          // Compress the image before storing
                          const compressedBase64 = await compressImage(file, 200, 200, 0.6)
                          const sizeInKB = getBase64SizeInKB(compressedBase64)
                          console.log(`Image compressed to ${sizeInKB}KB`)
                          setPhotoData(compressedBase64)
                          setFormData({...formData, photo: compressedBase64})
                        } catch (error) {
                          console.error('Error compressing image:', error)
                          alert('Failed to process image. Please try again.')
                        }
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
                    // For URL images, store as-is (they're already optimized on the server)
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
                  {photoData && photoData.startsWith('data:') && (
                    <p style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                      Image compressed to ~{getBase64SizeInKB(photoData)}KB
                    </p>
                  )}
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
                <label style={{ fontWeight: '500', fontSize: '14px', color: '#475569' }}>Date of Birth *</label>
                <input
                  type="date"
                  value={formData.dob}
                  onChange={(e) => setFormData({...formData, dob: e.target.value})}
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
                <th>DOB</th>
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
                  <td colSpan={12} style={{ textAlign: 'center', padding: '40px' }}>
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
                    <td>{employee.dob ? new Date(employee.dob).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-'}</td>
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
                  <td colSpan={12} className="empty-state">
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