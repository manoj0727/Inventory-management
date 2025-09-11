// import axios from 'axios'

// const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export const dashboardService = {
  async getDashboard() {
    // For now, return mock data
    // In production, this would fetch from the GraphQL endpoint
    return {
      totalFabrics: 156,
      totalProducts: 324,
      activeEmployees: 45,
      pendingOrders: 12,
      lowStockItems: [
        { id: '1', name: 'Cotton Fabric', quantity: 5, minQuantity: 20 },
        { id: '2', name: 'Silk Thread', quantity: 10, minQuantity: 50 }
      ],
      recentActivities: [
        {
          id: '1',
          type: 'fabric_added',
          description: 'added new fabric stock',
          user: 'Admin',
          timestamp: new Date()
        }
      ],
      productionStats: {
        daily: 45,
        weekly: 280,
        monthly: 1200,
        efficiency: 92.5
      },
      inventoryValue: 125000
    }
  }
}