import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'

// Pages
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import AdminDashboard from './pages/AdminDashboard'
import EmployeePortal from './pages/EmployeePortal'
import Inventory from './pages/Inventory'
import AdminFabricTracking from './pages/AdminFabricTracking'
import EmployeeFabricTracking from './pages/EmployeeFabricTracking'
import FabricRegistration from './pages/FabricRegistration'
import ViewFabrics from './pages/ViewFabrics'
import Cutting from './pages/Cutting'
import CuttingInventory from './pages/CuttingInventory'
import Manufacturing from './pages/Manufacturing'
import ManufacturingInventory from './pages/ManufacturingInventory'
import Employees from './pages/Employees'
import TailorManagement from './pages/TailorManagement'
import QRGenerator from './pages/QRGenerator'
import QRScanner from './pages/QRScanner'
import Reports from './pages/Reports'
import Settings from './pages/Settings'

function App() {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated)
  const user = useAuthStore(state => state.user)

  return (
    <Routes>
      <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to={user?.role === 'admin' ? "/admin-dashboard" : "/employee-portal"} />} />
      
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to={user?.role === 'admin' ? "/admin-dashboard" : "/employee-portal"} />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/employee-portal" element={<EmployeePortal />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/fabric-tracking" element={user?.role === 'admin' ? <AdminFabricTracking /> : <EmployeeFabricTracking />} />
          <Route path="/fabric-registration" element={<FabricRegistration />} />
          <Route path="/view-fabrics" element={<ViewFabrics />} />
          <Route path="/cutting" element={<Cutting />} />
          <Route path="/cutting-inventory" element={<CuttingInventory />} />
          <Route path="/manufacturing" element={<Manufacturing />} />
          <Route path="/manufacturing-inventory" element={<ManufacturingInventory />} />
          <Route path="/employees" element={<Employees />} />
          <Route path="/tailor-management" element={<TailorManagement />} />
          <Route path="/qr-generator" element={<QRGenerator />} />
          <Route path="/qr-scanner" element={<QRScanner />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Route>
      
      <Route path="*" element={<Navigate to={user?.role === 'admin' ? "/admin-dashboard" : "/employee-portal"} />} />
    </Routes>
  )
}

export default App