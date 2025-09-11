import { Router } from 'express'
import authRoutes from './auth'
import fabricRoutes from './fabrics'
import cuttingRecordsRoutes from './cuttingRecords'
import manufacturingOrdersRoutes from './manufacturingOrders'
import manufacturingInventoryRoutes from './manufacturingInventory'

const router = Router()

// Import JS routes for employees and attendance
const employeesRoutes = require('./employees')
const attendanceRoutes = require('./attendance')
const tailorsRoutes = require('./tailors')

router.use('/auth', authRoutes)
router.use('/fabrics', fabricRoutes)
router.use('/cutting-records', cuttingRecordsRoutes)
router.use('/manufacturing-orders', manufacturingOrdersRoutes)
router.use('/manufacturing-inventory', manufacturingInventoryRoutes)
router.use('/employees', employeesRoutes)
router.use('/attendance', attendanceRoutes)
router.use('/tailors', tailorsRoutes)

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() })
})

export default router