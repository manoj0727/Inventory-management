// API Configuration
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export const API_ENDPOINTS = {
  // Auth
  LOGIN: `${API_URL}/api/auth/login`,
  LOGOUT: `${API_URL}/api/auth/logout`,
  
  // Employees
  EMPLOYEES: `${API_URL}/api/employees`,
  
  // Attendance
  ATTENDANCE: `${API_URL}/api/attendance`,
  ATTENDANCE_MARK: `${API_URL}/api/attendance/mark`,
  ATTENDANCE_CHECK: (employeeId: string, date: string) => 
    `${API_URL}/api/attendance/check/${employeeId}/${date}`,
  ATTENDANCE_CHECKOUT: (id: string) => 
    `${API_URL}/api/attendance/checkout/${id}`,
  
  // Fabrics
  FABRICS: `${API_URL}/api/fabrics`,
  
  // Cutting Records
  CUTTING_RECORDS: `${API_URL}/api/cutting-records`,
  
  // Manufacturing
  MANUFACTURING: `${API_URL}/api/manufacturing`,
  
  // Tailors
  TAILORS: `${API_URL}/api/tailors`,
  
  // Inventory Stats
  INVENTORY_STATS: `${API_URL}/api/inventory/stats`,
}