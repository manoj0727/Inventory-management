import { Router } from 'express'
import authRoutes from './auth'
import fabricRoutes from './fabrics'
import cuttingRecordsRoutes from './cuttingRecords'
import manufacturingOrdersRoutes from './manufacturingOrders'
import manufacturingInventoryRoutes from './manufacturingInventory'

const router = Router()

router.use('/auth', authRoutes)
router.use('/fabrics', fabricRoutes)
router.use('/cutting-records', cuttingRecordsRoutes)
router.use('/manufacturing-orders', manufacturingOrdersRoutes)
router.use('/manufacturing-inventory', manufacturingInventoryRoutes)

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() })
})

export default router