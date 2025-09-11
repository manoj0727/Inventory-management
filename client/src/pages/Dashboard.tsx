import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { 
  ChartBarIcon, 
  CubeIcon, 
  UsersIcon, 
  ClipboardDocumentListIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { dashboardService } from '@/services/dashboardService'
import StatsCard from '@/components/StatsCard'
import ActivityFeed from '@/components/ActivityFeed'
import InventoryChart from '@/components/InventoryChart'
import LowStockAlert from '@/components/LowStockAlert'
import { useAuthStore } from '@/stores/authStore'

export default function Dashboard() {
  const navigate = useNavigate()
  const user = useAuthStore(state => state.user)
  
  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardService.getDashboard,
    refetchInterval: 30000 // Refresh every 30 seconds
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Failed to load dashboard data</p>
        </div>
      </div>
    )
  }

  const stats = [
    {
      title: 'Total Fabrics',
      value: dashboardData?.totalFabrics || 0,
      icon: CubeIcon,
      color: 'bg-blue-500',
      trend: '+12%',
      onClick: () => navigate('/fabric-tracking')
    },
    {
      title: 'Total Products',
      value: dashboardData?.totalProducts || 0,
      icon: ChartBarIcon,
      color: 'bg-green-500',
      trend: '+8%',
      onClick: () => navigate('/inventory')
    },
    {
      title: 'Active Employees',
      value: dashboardData?.activeEmployees || 0,
      icon: UsersIcon,
      color: 'bg-purple-500',
      trend: '+2%',
      onClick: () => navigate('/employees')
    },
    {
      title: 'Pending Orders',
      value: dashboardData?.pendingOrders || 0,
      icon: ClipboardDocumentListIcon,
      color: 'bg-orange-500',
      trend: '-5%',
      onClick: () => navigate('/manufacturing')
    }
  ]

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          Welcome back, {user?.name?.split(' ')[0] || 'SIR'}!
        </h1>
        <p className="text-primary-100">
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <StatsCard
            key={index}
            {...stat}
            className="hover:shadow-lg transition-shadow cursor-pointer"
          />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Inventory Chart */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Inventory Overview
          </h2>
          <InventoryChart data={dashboardData?.productionStats} />
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Low Stock Alerts
          </h2>
          <LowStockAlert items={dashboardData?.lowStockItems || []} />
        </div>
      </div>

      {/* Activity Feed */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Recent Activities
        </h2>
        <ActivityFeed activities={dashboardData?.recentActivities || []} />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={() => navigate('/qr-generator')}
          className="p-4 bg-primary-50 hover:bg-primary-100 rounded-lg text-center transition-colors"
        >
          <div className="text-primary-600 font-medium">Generate QR Code</div>
        </button>
        <button
          onClick={() => navigate('/fabric-tracking?action=add')}
          className="p-4 bg-green-50 hover:bg-green-100 rounded-lg text-center transition-colors"
        >
          <div className="text-green-600 font-medium">Add Fabric</div>
        </button>
        <button
          onClick={() => navigate('/manufacturing?action=new')}
          className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg text-center transition-colors"
        >
          <div className="text-purple-600 font-medium">New Order</div>
        </button>
        <button
          onClick={() => navigate('/reports')}
          className="p-4 bg-orange-50 hover:bg-orange-100 rounded-lg text-center transition-colors"
        >
          <div className="text-orange-600 font-medium">View Reports</div>
        </button>
      </div>
    </div>
  )
}