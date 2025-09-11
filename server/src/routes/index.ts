import { Router } from 'express'
import authRoutes from './auth'
import fabricRoutes from './fabrics'

const router = Router()

router.use('/auth', authRoutes)
router.use('/fabrics', fabricRoutes)

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() })
})

export default router