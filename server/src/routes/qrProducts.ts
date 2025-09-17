import { Router } from 'express'
import { QRProduct } from '../models/QRProduct'
import { ManufacturingOrder } from '../models/ManufacturingOrder'

const router = Router()

// GET all QR products
router.get('/', async (req, res) => {
  try {
    const qrProducts = await QRProduct.find().sort({ createdAt: -1 })
    res.json(qrProducts)
  } catch (error: any) {
    console.error('Get QR products error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// GET QR product by ID
router.get('/:id', async (req, res) => {
  try {
    const qrProduct = await QRProduct.findById(req.params.id)
    if (!qrProduct) {
      return res.status(404).json({ message: 'QR product not found' })
    }
    res.json(qrProduct)
  } catch (error: any) {
    console.error('Get QR product error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// POST new QR product
router.post('/', async (req, res) => {
  try {
    const {
      productId,
      manufacturingId,
      productName,
      color,
      size,
      quantity,
      tailorName,
      qrCodeData,
      generatedDate,
      cuttingId,
      notes
    } = req.body

    // Check if QR product already exists
    const existingProduct = await QRProduct.findOne({ productId })
    if (existingProduct) {
      // Update existing product
      existingProduct.qrCodeData = qrCodeData
      existingProduct.generatedDate = generatedDate
      await existingProduct.save()
      return res.json(existingProduct)
    }

    // Create new QR product
    const qrProduct = new QRProduct({
      productId,
      manufacturingId,
      productName,
      color,
      size,
      quantity,
      tailorName,
      qrCodeData,
      isGenerated: true,
      generatedDate,
      cuttingId,
      notes
    })

    await qrProduct.save()

    // If it's a manufacturing ID, mark it as QR generated
    if (manufacturingId && manufacturingId !== 'MANUAL') {
      try {
        await ManufacturingOrder.findOneAndUpdate(
          { manufacturingId },
          { $set: { qrGenerated: true } }
        )
      } catch (err) {
        console.log('Error updating manufacturing order:', err)
      }
    }

    res.status(201).json({
      message: 'QR product created successfully',
      qrProduct
    })
  } catch (error: any) {
    console.error('Create QR product error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// PATCH update QR product quantity
router.patch('/:id', async (req, res) => {
  try {
    const qrProduct = await QRProduct.findById(req.params.id)
    if (!qrProduct) {
      return res.status(404).json({ message: 'QR product not found' })
    }

    // Update only the quantity field
    if (req.body.quantity !== undefined) {
      qrProduct.quantity = req.body.quantity
    }

    await qrProduct.save()
    res.json(qrProduct)
  } catch (error: any) {
    console.error('Update QR product error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// DELETE QR product
router.delete('/:id', async (req, res) => {
  try {
    const qrProduct = await QRProduct.findById(req.params.id)
    if (!qrProduct) {
      return res.status(404).json({ message: 'QR product not found' })
    }

    // If it's a manufacturing ID, mark it as QR not generated
    if (qrProduct.manufacturingId && qrProduct.manufacturingId !== 'MANUAL') {
      try {
        await ManufacturingOrder.findOneAndUpdate(
          { manufacturingId: qrProduct.manufacturingId },
          { $set: { qrGenerated: false } }
        )
      } catch (err) {
        console.log('Error updating manufacturing order:', err)
      }
    }

    await QRProduct.findByIdAndDelete(req.params.id)
    res.json({ message: 'QR product deleted successfully' })
  } catch (error: any) {
    console.error('Delete QR product error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// GET available manufacturing IDs (not yet QR generated)
router.get('/available/manufacturing-ids', async (req, res) => {
  try {
    // Get all manufacturing orders
    const allOrders = await ManufacturingOrder.find()

    // Get all QR products
    const qrProducts = await QRProduct.find()
    const usedIds = qrProducts.map(p => p.manufacturingId)

    // Filter out used IDs
    const availableOrders = allOrders.filter(order =>
      !usedIds.includes(order.manufacturingId)
    )

    res.json(availableOrders)
  } catch (error: any) {
    console.error('Get available manufacturing IDs error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

export default router