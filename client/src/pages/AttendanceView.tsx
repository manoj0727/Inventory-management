import { useState, useEffect } from 'react'
import '../styles/common.css'
import { API_URL } from '@/config/api'

interface AttendanceRecord {
  _id: string
  employeeId: string
  employeeName: string
  date: string
  checkIn: string
  checkOut: string | null
  status: string
  workHours: number
  photo: string
}

interface Employee {
  _id: string
  employeeId: string
  name: string
}

export default function AttendanceView() {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  })
  const [viewMode, setViewMode] = useState<'daily' | 'range'>('daily')
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetchEmployees()
    fetchAttendance()
  }, [])

  useEffect(() => {
    fetchAttendance()
  }, [selectedEmployee, selectedDate, dateRange, viewMode])

  const fetchEmployees = async () => {
    try {
      const response = await fetch('${API_URL}/api/employees')
      if (response.ok) {
        const data = await response.json()
        setEmployees(data)
      }
    } catch (error) {
      console.error('Error fetching employees:', error)
    }
  }

  const fetchAttendance = async () => {
    setIsLoading(true)
    try {
      let url = '${API_URL}/api/attendance?'
      
      if (viewMode === 'daily') {
        url += `date=${selectedDate}`
      } else {
        url += `startDate=${dateRange.start}&endDate=${dateRange.end}`
      }
      
      if (selectedEmployee) {
        url += `&employeeId=${selectedEmployee}`
      }

      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setAttendance(data)
      }
    } catch (error) {
      console.error('Error fetching attendance:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadgeClass = (status: string) => {
    switch(status) {
      case 'present': return 'badge-success'
      case 'late': return 'badge-warning'
      case 'absent': return 'badge-danger'
      case 'leave': return 'badge-info'
      default: return 'badge-secondary'
    }
  }

  const calculateTotalHours = () => {
    return attendance.reduce((sum, record) => sum + (record.workHours || 0), 0)
  }

  const calculateAttendanceStats = () => {
    const stats = {
      present: attendance.filter(a => a.status === 'present').length,
      late: attendance.filter(a => a.status === 'late').length,
      absent: attendance.filter(a => a.status === 'absent').length,
      leaves: attendance.filter(a => a.status === 'leave').length
    }
    return stats
  }

  const stats = calculateAttendanceStats()

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Attendance Management</h1>
        <p>View and manage employee attendance records</p>
      </div>

      {/* Filters */}
      <div className="content-card" style={{ background: 'white' }}>
        <div className="toolbar">
          <div className="filter-group">
            <select 
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as 'daily' | 'range')}
              style={{ padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }}
            >
              <option value="daily">Daily View</option>
              <option value="range">Date Range</option>
            </select>

            {viewMode === 'daily' ? (
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{ padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }}
              />
            ) : (
              <>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                  style={{ padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                />
                <span>to</span>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                  style={{ padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                />
              </>
            )}

            <select 
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              style={{ padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }}
            >
              <option value="">All Employees</option>
              {employees.map(emp => (
                <option key={emp._id} value={emp.employeeId}>{emp.name}</option>
              ))}
            </select>

            <button onClick={fetchAttendance} className="btn btn-primary">
              🔄 Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="stats-grid">
        <div className="stat-card" style={{ background: 'white', color: 'black' }}>
          <h3 style={{ color: 'black' }}>Total Present</h3>
          <p className="stat-value" style={{ color: 'black', fontSize: '24px', fontWeight: 'bold' }}>{stats.present}</p>
        </div>
        <div className="stat-card" style={{ background: 'white', color: 'black' }}>
          <h3 style={{ color: 'black' }}>Late Arrivals</h3>
          <p className="stat-value" style={{ color: 'black', fontSize: '24px', fontWeight: 'bold' }}>{stats.late}</p>
        </div>
        <div className="stat-card" style={{ background: 'white', color: 'black' }}>
          <h3 style={{ color: 'black' }}>Absent</h3>
          <p className="stat-value" style={{ color: 'black', fontSize: '24px', fontWeight: 'bold' }}>{stats.absent}</p>
        </div>
        <div className="stat-card" style={{ background: 'white', color: 'black' }}>
          <h3 style={{ color: 'black' }}>Total Hours</h3>
          <p className="stat-value" style={{ color: 'black', fontSize: '24px', fontWeight: 'bold' }}>{calculateTotalHours().toFixed(1)}</p>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="content-card" style={{ background: 'white', color: 'black' }}>
        <h2 style={{ marginBottom: '20px', color: 'black' }}>Attendance Records</h2>
        <div className="table-container">
          <table className="data-table" style={{ color: 'black' }}>
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Name</th>
                <th>Date</th>
                <th>Check-in</th>
                <th>Check-out</th>
                <th>Status</th>
                <th>Hours</th>
                <th>Photo</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: 'black' }}>
                    Loading attendance records...
                  </td>
                </tr>
              ) : attendance.length > 0 ? (
                attendance.map(record => (
                  <tr key={record._id}>
                    <td style={{ fontWeight: '600', color: 'black' }}>{record.employeeId}</td>
                    <td style={{ color: 'black' }}>{record.employeeName}</td>
                    <td style={{ color: 'black' }}>{formatDate(record.date)}</td>
                    <td style={{ color: 'black' }}>{formatTime(record.checkIn)}</td>
                    <td style={{ color: 'black' }}>{record.checkOut ? formatTime(record.checkOut) : '-'}</td>
                    <td>
                      <span className={`badge ${getStatusBadgeClass(record.status)}`}>
                        {record.status}
                      </span>
                    </td>
                    <td style={{ color: 'black' }}>{record.workHours ? `${record.workHours.toFixed(2)}h` : '-'}</td>
                    <td>
                      <button 
                        className="btn btn-secondary"
                        onClick={() => setSelectedPhoto(record.photo)}
                        style={{ padding: '4px 8px', fontSize: '12px' }}
                      >
                        👁️ View
                      </button>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="action-btn edit">Edit</button>
                        <button className="action-btn delete">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="empty-state">
                    <div className="empty-state-icon">📅</div>
                    <h3>No Attendance Records</h3>
                    <p>No attendance records found for the selected criteria</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Photo Modal */}
      {selectedPhoto && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }} onClick={() => setSelectedPhoto(null)}>
          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '8px',
            maxWidth: '500px',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <img 
              src={selectedPhoto} 
              alt="Attendance Photo" 
              style={{ 
                width: '100%', 
                height: 'auto',
                borderRadius: '8px',
                transform: 'scaleX(-1)'
              }}
            />
            <button 
              onClick={() => setSelectedPhoto(null)}
              className="btn btn-secondary"
              style={{ marginTop: '16px', width: '100%' }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}