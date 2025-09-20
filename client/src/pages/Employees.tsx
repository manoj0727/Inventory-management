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
          .signature-img {
            width: 80px;
            height: 25px;
            object-fit: contain;
            margin-bottom: -3px;
            opacity: 1;
          }
          .signature-label {
            font-size: 9px;
            color: #000000;
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
              <div class="info-row">
                <span class="info-label">Legal name:</span>
                <span class="info-value">Teezure</span>
              </div>
            </div>
            <div class="signature-section">
              <img src="data:image/png;base64,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" alt="Signature" class="signature-img" />
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