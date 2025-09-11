import { Router } from 'express'
import { ManufacturingOrder } from '../models/ManufacturingOrder'
import { ManufacturingInventory } from '../models/ManufacturingInventory'
import { CuttingRecord } from '../models/CuttingRecord'

const router = Router()

// GET all manufacturing orders
router.get('/', async (req, res) => {
  try {
    const manufacturingOrders = await ManufacturingOrder.find().sort({ createdAt: -1 })
    res.json(manufacturingOrders)
  } catch (error: any) {
    console.error('Get manufacturing orders error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// GET manufacturing order by ID
router.get('/:id', async (req, res) => {
  try {
    const manufacturingOrder = await ManufacturingOrder.findById(req.params.id)
    if (!manufacturingOrder) {
      return res.status(404).json({ message: 'Manufacturing order not found' })
    }
    res.json(manufacturingOrder)
  } catch (error: any) {
    console.error('Get manufacturing order error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// POST new manufacturing order
router.post('/', async (req, res) => {
  try {
    const {
      cuttingId,
      productName,
      quantity,
      dueDate,
      tailorName,
      tailorMobile,
      priority,
      status,
      notes
    } = req.body

    // Validate required fields
    if (!cuttingId || !productName || !quantity || !dueDate || !tailorName || !tailorMobile) {
      return res.status(400).json({ message: 'Missing required fields' })
    }

    const manufacturingOrder = new ManufacturingOrder({
      cuttingId,
      productName,
      quantity: parseInt(quantity),
      dueDate,
      tailorName,
      tailorMobile,
      priority: priority || 'Normal',
      status: status || 'Pending',
      notes
    })

    await manufacturingOrder.save()

    // Also create a manufacturing inventory record
    try {
      // Get cutting record to find product ID
      const cuttingRecord = await CuttingRecord.findOne({ id: cuttingId })
      const productId = cuttingRecord?.productId || `PROD${Date.now()}`

      // Generate manufacturing inventory ID
      const productCode = productName.substring(0, 3).toUpperCase()
      const tailorCode = tailorName.substring(0, 2).toUpperCase()
      const randomNumber = Math.floor(Math.random() * 9000) + 1000
      const manufacturingId = `MFG${productCode}${tailorCode}${randomNumber}`

      const manufacturingInventory = new ManufacturingInventory({
        id: manufacturingId,
        productId,
        productName,
        cuttingId,
        quantity: parseInt(quantity),
        quantityProduced: 0,
        quantityRemaining: parseInt(quantity),
        tailorName,
        tailorMobile,
        startDate: new Date().toISOString().split('T')[0],
        dueDate,
        priority: priority || 'Normal',
        status: status || 'Pending',
        notes
      })

      await manufacturingInventory.save()
    } catch (inventoryError) {
      console.error('Error creating manufacturing inventory record:', inventoryError)
      // Continue even if inventory creation fails
    }

    res.status(201).json({
      message: 'Manufacturing order created successfully',
      manufacturingOrder
    })
  } catch (error: any) {
    console.error('Create manufacturing order error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// PUT update manufacturing order
router.put('/:id', async (req, res) => {
  try {
    const manufacturingOrder = await ManufacturingOrder.findById(req.params.id)
    if (!manufacturingOrder) {
      return res.status(404).json({ message: 'Manufacturing order not found' })
    }

    const {
      quantity,
      dueDate,
      tailorName,
      tailorMobile,
      priority,
      status,
      notes
    } = req.body

    // Update fields
    if (quantity) manufacturingOrder.quantity = parseInt(quantity)
    if (dueDate) manufacturingOrder.dueDate = dueDate
    if (tailorName) manufacturingOrder.tailorName = tailorName
    if (tailorMobile) manufacturingOrder.tailorMobile = tailorMobile
    if (priority) manufacturingOrder.priority = priority
    if (status) manufacturingOrder.status = status
    if (notes !== undefined) manufacturingOrder.notes = notes

    await manufacturingOrder.save()
    res.json({
      message: 'Manufacturing order updated successfully',
      manufacturingOrder
    })
  } catch (error: any) {
    console.error('Update manufacturing order error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// DELETE manufacturing order
router.delete('/:id', async (req, res) => {
  try {
    const manufacturingOrder = await ManufacturingOrder.findById(req.params.id)
    if (!manufacturingOrder) {
      return res.status(404).json({ message: 'Manufacturing order not found' })
    }

    await ManufacturingOrder.findByIdAndDelete(req.params.id)
    res.json({ message: 'Manufacturing order deleted successfully' })
  } catch (error: any) {
    console.error('Delete manufacturing order error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

export default router