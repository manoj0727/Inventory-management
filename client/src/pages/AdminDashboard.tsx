import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/common.css'

interface DashboardStats {
  overview: {
    totalEmployees: number
    activeEmployees: number
    presentToday: number
    todayAttendance: number
    totalFabrics: number
    activeFabrics: number
    totalFabricQuantity: number
    totalTailors: number
    activeTailors: number
    totalOrders: number
  }
  manufacturing: {
    total: number
    completed: number
    pending: number
    completionRate: number
  }
  cutting: {
    total: number
    today: number
  }
  trends: {
    monthlyAttendance: number
    monthlyManufacturing: number
    weeklyGrowth: number
  }
  recentActivities: {
    fabrics: any[]
    attendance: any[]
  }
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [chartData, setChartData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    fetchDashboardData()
    fetchChartData()
    
    // Auto refresh every 30 seconds
    const refreshInterval = setInterval(() => {
      setRefreshKey(prev => prev + 1)
    }, 30000)
    
    return () => clearInterval(refreshInterval)
  }, [refreshKey])

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/dashboard/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchChartData = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/dashboard/charts')
      if (response.ok) {
        const data = await response.json()
        setChartData(data)
      }
    } catch (error) {
      console.error('Error fetching chart data:', error)
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const quickActions = [
    { name: 'Register Fabric', icon: '📦', route: '/fabric-registration', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
    { name: 'Manufacturing', icon: '🏭', route: '/manufacturing', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
    { name: 'Employees', icon: '👥', route: '/employees', gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
    { name: 'Tailors', icon: '✂️', route: '/tailor-management', gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
    { name: 'Attendance', icon: '📋', route: '/attendance-view', gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
    { name: 'QR Scanner', icon: '📱', route: '/qr-scanner', gradient: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)' }
  ]

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6 lg:p-8">
      {/* Animated Header */}
      <div className="mb-8 animate-fadeIn">
        <div className="bg-white rounded-2xl shadow-xl p-6 backdrop-blur-lg bg-opacity-90">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
              <p className="mt-2 text-gray-600">Welcome to QR Inventory Management System</p>
            </div>
            <div className="mt-4 sm:mt-0 text-right">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 py-2 rounded-lg">
                <div className="flex items-center justify-end">
                  <span className="text-xl font-bold">
                    {formatTime(currentTime)}
                  </span>
                </div>
                <p className="text-sm opacity-90">
                  {formatDate(currentTime)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-lg p-6 transform hover:scale-105 transition-all duration-300 hover:shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-3 rounded-xl">
              <span className="text-2xl">👥</span>
            </div>
            <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full font-semibold">
              +{stats?.trends.weeklyGrowth || 0}%
            </span>
          </div>
          <h3 className="text-gray-500 text-sm mb-1">Total Employees</h3>
          <p className="text-3xl font-bold text-gray-800">{stats?.overview.totalEmployees || 0}</p>
          <p className="text-sm text-gray-500 mt-2">
            <span className="text-green-500 font-semibold">{stats?.overview.presentToday || 0}</span> present today
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 transform hover:scale-105 transition-all duration-300 hover:shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-3 rounded-xl">
              <span className="text-2xl">📦</span>
            </div>
            <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-full font-semibold">
              Active
            </span>
          </div>
          <h3 className="text-gray-500 text-sm mb-1">Total Fabrics</h3>
          <p className="text-3xl font-bold text-gray-800">{stats?.overview.totalFabrics || 0}</p>
          <p className="text-sm text-gray-500 mt-2">
            <span className="text-purple-500 font-semibold">{stats?.overview.totalFabricQuantity || 0}</span> meters
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 transform hover:scale-105 transition-all duration-300 hover:shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-gradient-to-r from-green-500 to-green-600 p-3 rounded-xl">
              <span className="text-2xl">✂️</span>
            </div>
            <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full font-semibold">
              {stats?.manufacturing.completionRate || 0}%
            </span>
          </div>
          <h3 className="text-gray-500 text-sm mb-1">Manufacturing</h3>
          <p className="text-3xl font-bold text-gray-800">{stats?.manufacturing.total || 0}</p>
          <p className="text-sm text-gray-500 mt-2">
            <span className="text-green-500 font-semibold">{stats?.manufacturing.completed || 0}</span> completed
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 transform hover:scale-105 transition-all duration-300 hover:shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-3 rounded-xl">
              <span className="text-2xl">👔</span>
            </div>
            <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full font-semibold">
              Today
            </span>
          </div>
          <h3 className="text-gray-500 text-sm mb-1">Tailors</h3>
          <p className="text-3xl font-bold text-gray-800">{stats?.overview.totalTailors || 0}</p>
          <p className="text-sm text-gray-500 mt-2">
            <span className="text-orange-500 font-semibold">{stats?.overview.activeTailors || 0}</span> active
          </p>
        </div>
      </div>

      {/* Quick Actions with Animation */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={() => navigate(action.route)}
              className="relative overflow-hidden rounded-xl p-4 text-white transform hover:scale-110 transition-all duration-300 hover:shadow-xl"
              style={{ background: action.gradient }}
            >
              <div className="relative z-10">
                <div className="text-3xl mb-2">{action.icon}</div>
                <p className="text-sm font-medium">{action.name}</p>
              </div>
              <div className="absolute inset-0 bg-white opacity-0 hover:opacity-20 transition-opacity duration-300"></div>
            </button>
          ))}
        </div>
      </div>

      {/* Progress Bars Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Today's Progress</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600">Attendance</span>
                <span className="text-sm font-semibold">{stats?.overview.presentToday || 0}/{stats?.overview.totalEmployees || 0}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${stats?.overview.totalEmployees ? (stats.overview.presentToday / stats.overview.totalEmployees * 100) : 0}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600">Manufacturing</span>
                <span className="text-sm font-semibold">{stats?.manufacturing.completionRate || 0}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${stats?.manufacturing.completionRate || 0}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600">Cutting Today</span>
                <span className="text-sm font-semibold">{stats?.cutting.today || 0}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-purple-400 to-purple-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((stats?.cutting.today || 0) * 10, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Chart */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Weekly Activity</h3>
          {chartData && (
            <div className="space-y-3">
              {chartData.labels?.map((day: string, index: number) => (
                <div key={index} className="flex items-center">
                  <span className="text-xs text-gray-500 w-12">{day}</span>
                  <div className="flex-1 flex items-center gap-2 ml-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-6 relative overflow-hidden">
                      <div 
                        className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full flex items-center justify-end pr-2 transition-all duration-500"
                        style={{ width: `${Math.min((chartData.attendance[index] || 0) * 5, 100)}%` }}
                      >
                        <span className="text-xs text-white font-semibold">{chartData.attendance[index] || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activities</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {stats?.recentActivities.attendance?.map((activity, index) => (
              <div key={index} className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 animate-pulse"></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{activity.employeeName}</p>
                  <p className="text-xs text-gray-500">Checked in - {activity.status}</p>
                  <p className="text-xs text-gray-400">{new Date(activity.checkIn).toLocaleTimeString()}</p>
                </div>
              </div>
            ))}
            {stats?.recentActivities.fabrics?.map((fabric, index) => (
              <div key={`fabric-${index}`} className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 animate-pulse"></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">Fabric {fabric.fabricId}</p>
                  <p className="text-xs text-gray-500">{fabric.fabricType} - {fabric.quantity} meters</p>
                  <p className="text-xs text-gray-400">{new Date(fabric.createdAt).toLocaleTimeString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Live Status Bar */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-lg p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="animate-pulse">
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
            </div>
            <span className="font-semibold">System Status: Online</span>
          </div>
          <div className="flex items-center space-x-6 text-sm">
            <div>
              <span className="opacity-75">Monthly Orders:</span>
              <span className="ml-2 font-bold">{stats?.trends.monthlyManufacturing || 0}</span>
            </div>
            <div>
              <span className="opacity-75">Active Users:</span>
              <span className="ml-2 font-bold">{stats?.overview.presentToday || 0}</span>
            </div>
            <button 
              onClick={() => setRefreshKey(prev => prev + 1)}
              className="bg-white bg-opacity-20 px-3 py-1 rounded-lg hover:bg-opacity-30 transition-all"
            >
              🔄 Refresh
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}