import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { ClockIcon, CalendarIcon, UserIcon, BriefcaseIcon } from '@heroicons/react/24/outline'

export default function EmployeePortal() {
  const user = useAuthStore(state => state.user)
  const [currentTime, setCurrentTime] = useState(new Date())
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    
    return () => clearInterval(timer)
  }, [])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Welcome Section */}
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <div className="text-center animate-fade-in">
          {/* Wave Animation */}
          <div className="mb-8">
            <div className="inline-block animate-bounce">
              <span className="text-6xl">👋</span>
            </div>
          </div>
          
          {/* Welcome Message - Exactly as original */}
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            Welcome back, <span className="text-primary-600" id="welcomeName">{user?.name?.split(' ')[0] || 'Employee'}</span>!
          </h1>
          
          <p className="text-xl text-gray-600 mb-8">
            Have a productive day at work
          </p>
          
          {/* Date and Time */}
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md mx-auto">
            <div className="flex items-center justify-center space-x-2 text-gray-700 mb-2">
              <CalendarIcon className="h-5 w-5" />
              <span className="text-lg font-medium">{formatDate(currentTime)}</span>
            </div>
            <div className="flex items-center justify-center space-x-2 text-primary-600">
              <ClockIcon className="h-6 w-6" />
              <span className="text-2xl font-bold">{formatTime(currentTime)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 pb-12">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Check In/Out */}
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer">
              <div className="flex items-center space-x-4">
                <div className="bg-green-100 p-3 rounded-full">
                  <ClockIcon className="h-8 w-8 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Check In/Out</h3>
                  <p className="text-sm text-gray-500">Mark your attendance</p>
                </div>
              </div>
            </div>

            {/* View Schedule */}
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer">
              <div className="flex items-center space-x-4">
                <div className="bg-blue-100 p-3 rounded-full">
                  <CalendarIcon className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">View Schedule</h3>
                  <p className="text-sm text-gray-500">Check your work schedule</p>
                </div>
              </div>
            </div>

            {/* My Tasks */}
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer">
              <div className="flex items-center space-x-4">
                <div className="bg-purple-100 p-3 rounded-full">
                  <BriefcaseIcon className="h-8 w-8 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">My Tasks</h3>
                  <p className="text-sm text-gray-500">View assigned tasks</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Summary */}
      <div className="px-4 pb-12">
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Today's Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600">0</div>
              <div className="text-sm text-gray-500">Tasks Pending</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">0</div>
              <div className="text-sm text-gray-500">Tasks Completed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">0</div>
              <div className="text-sm text-gray-500">Hours Worked</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">0%</div>
              <div className="text-sm text-gray-500">Efficiency</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}