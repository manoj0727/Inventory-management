import { Router } from 'express'
import { ManufacturingInventory } from '../models/ManufacturingInventory'

const router = Router()

// GET all manufacturing inventory records
router.get('/', async (req, res) => {
  try {
    const manufacturingInventory = await ManufacturingInventory.find().sort({ createdAt: -1 })
    res.json(manufacturingInventory)
  } catch (error: any) {
    console.error('Get manufacturing inventory error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// GET manufacturing inventory record by ID
router.get('/:id', async (req, res) => {
  try {
    const manufacturingInventory = await ManufacturingInventory.findById(req.params.id)
    if (!manufacturingInventory) {
      return res.status(404).json({ message: 'Manufacturing inventory record not found' })
    }
    res.json(manufacturingInventory)
  } catch (error: any) {
    console.error('Get manufacturing inventory record error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// POST new manufacturing inventory record
router.post('/', async (req, res) => {
  try {
    const {
      productId,
      productName,
      cuttingId,
      quantity,
      quantityProduced,
      tailorName,
      tailorMobile,
      startDate,
      completedDate,
      dueDate,
      priority,
      status,
      notes
    } = req.body

    // Validate required fields
    if (!productId || !productName || !cuttingId || !quantity || !tailorName || !tailorMobile || !startDate || !dueDate) {
      return res.status(400).json({ message: 'Missing required fields' })
    }

    const manufacturingInventory = new ManufacturingInventory({
      productId,
      productName,
      cuttingId,
      quantity: parseInt(quantity),
      quantityProduced: parseInt(quantityProduced) || 0,
      tailorName,
      tailorMobile,
      startDate,
      completedDate,
      dueDate,
      priority: priority || 'Normal',
      status: status || 'Pending',
      notes
    })

    await manufacturingInventory.save()
    res.status(201).json({
      message: 'Manufacturing inventory record created successfully',
      manufacturingInventory
    })
  } catch (error: any) {
    console.error('Create manufacturing inventory record error:', error)
    if (error.code === 11000) {
      res.status(400).json({ message: 'Manufacturing inventory record with this ID already exists' })
    } else {
      res.status(500).json({ message: 'Server error' })
    }
  }
})

// PUT update manufacturing inventory record
router.put('/:id', async (req, res) => {
  try {
    const manufacturingInventory = await ManufacturingInventory.findById(req.params.id)
    if (!manufacturingInventory) {
      return res.status(404).json({ message: 'Manufacturing inventory record not found' })
    }

    const {
      quantity,
      quantityProduced,
      tailorName,
      tailorMobile,
      startDate,
      completedDate,
      dueDate,
      priority,
      status,
      notes
    } = req.body

    // Update fields
    if (quantity) manufacturingInventory.quantity = parseInt(quantity)
    if (quantityProduced !== undefined) manufacturingInventory.quantityProduced = parseInt(quantityProduced)
    if (tailorName) manufacturingInventory.tailorName = tailorName
    if (tailorMobile) manufacturingInventory.tailorMobile = tailorMobile
    if (startDate) manufacturingInventory.startDate = startDate
    if (completedDate !== undefined) manufacturingInventory.completedDate = completedDate
    if (dueDate) manufacturingInventory.dueDate = dueDate
    if (priority) manufacturingInventory.priority = priority
    if (status) manufacturingInventory.status = status
    if (notes !== undefined) manufacturingInventory.notes = notes

    await manufacturingInventory.save()
    res.json({
      message: 'Manufacturing inventory record updated successfully',
      manufacturingInventory
    })
  } catch (error: any) {
    console.error('Update manufacturing inventory record error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// DELETE manufacturing inventory record
router.delete('/:id', async (req, res) => {
  try {
    const manufacturingInventory = await ManufacturingInventory.findById(req.params.id)
    if (!manufacturingInventory) {
      return res.status(404).json({ message: 'Manufacturing inventory record not found' })
    }

    await ManufacturingInventory.findByIdAndDelete(req.params.id)
    res.json({ message: 'Manufacturing inventory record deleted successfully' })
  } catch (error: any) {
    console.error('Delete manufacturing inventory record error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

export default router