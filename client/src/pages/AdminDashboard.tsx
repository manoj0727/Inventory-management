import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  ChartBarIcon, 
  CubeIcon, 
  UsersIcon, 
  ClipboardDocumentListIcon,
  ScissorsIcon,
  ShoppingBagIcon,
  CogIcon,
  ClockIcon
} from '@heroicons/react/24/outline'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [currentTime, setCurrentTime] = useState(new Date())
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    
    return () => clearInterval(timer)
  }, [])

  const stats = [
    { 
      title: 'Total Fabric', 
      value: '1,245', 
      icon: CubeIcon, 
      color: 'bg-blue-500',
      bgLight: 'bg-blue-100',
      textColor: 'text-blue-600'
    },
    { 
      title: 'Fabric Cut', 
      value: '856', 
      icon: ScissorsIcon, 
      color: 'bg-green-500',
      bgLight: 'bg-green-100',
      textColor: 'text-green-600'
    },
    { 
      title: 'Products', 
      value: '342', 
      icon: ShoppingBagIcon, 
      color: 'bg-purple-500',
      bgLight: 'bg-purple-100',
      textColor: 'text-purple-600'
    },
    { 
      title: 'Manufacturing', 
      value: '127', 
      icon: CogIcon, 
      color: 'bg-orange-500',
      bgLight: 'bg-orange-100',
      textColor: 'text-orange-600'
    },
    { 
      title: 'Active Tailors', 
      value: '45', 
      icon: UsersIcon, 
      color: 'bg-pink-500',
      bgLight: 'bg-pink-100',
      textColor: 'text-pink-600'
    },
    { 
      title: 'Employees', 
      value: '89', 
      icon: UsersIcon, 
      color: 'bg-indigo-500',
      bgLight: 'bg-indigo-100',
      textColor: 'text-indigo-600'
    }
  ]

  const quickActions = [
    { name: 'Fabric Tracking', icon: '📦', route: '/fabric-tracking', color: 'from-blue-400 to-blue-600' },
    { name: 'Manufacturing', icon: '🏭', route: '/manufacturing', color: 'from-green-400 to-green-600' },
    { name: 'Tailor Management', icon: '✂️', route: '/tailor-management', color: 'from-purple-400 to-purple-600' },
    { name: 'QR Scanner', icon: '📱', route: '/qr-scanner', color: 'from-orange-400 to-orange-600' },
    { name: 'Reports', icon: '📊', route: '/reports', color: 'from-pink-400 to-pink-600' },
    { name: 'Settings', icon: '⚙️', route: '/settings', color: 'from-gray-400 to-gray-600' }
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="mt-2 text-gray-600">Welcome to QR Inventory Management System</p>
            </div>
            <div className="mt-4 sm:mt-0 text-right">
              <div className="flex items-center justify-end text-gray-500">
                <ClockIcon className="h-5 w-5 mr-2" />
                <span className="text-lg">
                  {currentTime.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  })}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {currentTime.toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid - 3x2 Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div
              key={index}
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                </div>
                <div className={`${stat.bgLight} p-4 rounded-full`}>
                  <Icon className={`h-8 w-8 ${stat.textColor}`} />
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center text-sm">
                  <span className="text-green-500 font-semibold">↑ 12%</span>
                  <span className="text-gray-500 ml-2">from last month</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={() => navigate(action.route)}
              className={`bg-gradient-to-br ${action.color} text-white rounded-lg p-4 hover:shadow-lg transition-all duration-300 transform hover:scale-105`}
            >
              <div className="text-3xl mb-2">{action.icon}</div>
              <p className="text-sm font-medium">{action.name}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Activity & Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">New fabric stock added</p>
                <p className="text-xs text-gray-500">Cotton Roll - 500 meters</p>
                <p className="text-xs text-gray-400">2 minutes ago</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">Manufacturing completed</p>
                <p className="text-xs text-gray-500">Order #MFG-2024-156</p>
                <p className="text-xs text-gray-400">15 minutes ago</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">Tailor assigned</p>
                <p className="text-xs text-gray-500">John Smith - Order #ORD-789</p>
                <p className="text-xs text-gray-400">1 hour ago</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">Low stock alert</p>
                <p className="text-xs text-gray-500">Silk fabric below threshold</p>
                <p className="text-xs text-gray-400">2 hours ago</p>
              </div>
            </div>
          </div>
        </div>

        {/* Production Chart */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Production Overview</h2>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center">
              <ChartBarIcon className="h-16 w-16 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Production chart will appear here</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}