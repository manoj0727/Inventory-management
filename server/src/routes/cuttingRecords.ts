import { Router } from 'express'
import { CuttingRecord } from '../models/CuttingRecord'

const router = Router()

// GET all cutting records
router.get('/', async (req, res) => {
  try {
    const cuttingRecords = await CuttingRecord.find().sort({ createdAt: -1 })
    res.json(cuttingRecords)
  } catch (error: any) {
    console.error('Get cutting records error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// GET cutting record by ID
router.get('/:id', async (req, res) => {
  try {
    const cuttingRecord = await CuttingRecord.findById(req.params.id)
    if (!cuttingRecord) {
      return res.status(404).json({ message: 'Cutting record not found' })
    }
    res.json(cuttingRecord)
  } catch (error: any) {
    console.error('Get cutting record error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// POST new cutting record
router.post('/', async (req, res) => {
  try {
    const {
      id,
      productId,
      fabricType,
      fabricColor,
      productName,
      piecesCount,
      pieceLength,
      pieceWidth,
      totalSquareMetersUsed,
      usageLocation,
      cuttingEmployee,
      date,
      time,
      status,
      notes
    } = req.body

    // Validate required fields
    if (!id || !productId || !fabricType || !fabricColor || !productName || 
        !piecesCount || !pieceLength || !pieceWidth || !totalSquareMetersUsed || 
        !usageLocation || !cuttingEmployee || !date || !time) {
      return res.status(400).json({ message: 'Missing required fields' })
    }

    const cuttingRecord = new CuttingRecord({
      id,
      productId,
      fabricType,
      fabricColor,
      productName,
      piecesCount: parseInt(piecesCount),
      pieceLength: parseFloat(pieceLength),
      pieceWidth: parseFloat(pieceWidth),
      totalSquareMetersUsed: parseFloat(totalSquareMetersUsed),
      usageLocation,
      cuttingEmployee,
      date,
      time,
      status: status || 'Completed',
      notes
    })

    await cuttingRecord.save()
    res.status(201).json({
      message: 'Cutting record created successfully',
      cuttingRecord
    })
  } catch (error: any) {
    console.error('Create cutting record error:', error)
    if (error.code === 11000) {
      res.status(400).json({ message: 'Cutting record with this ID already exists' })
    } else {
      res.status(500).json({ message: 'Server error' })
    }
  }
})

// PUT update cutting record
router.put('/:id', async (req, res) => {
  try {
    const cuttingRecord = await CuttingRecord.findById(req.params.id)
    if (!cuttingRecord) {
      return res.status(404).json({ message: 'Cutting record not found' })
    }

    const {
      productName,
      piecesCount,
      pieceLength,
      pieceWidth,
      usageLocation,
      cuttingEmployee,
      status,
      notes
    } = req.body

    // Update fields
    if (productName) cuttingRecord.productName = productName
    if (piecesCount) cuttingRecord.piecesCount = parseInt(piecesCount)
    if (pieceLength) cuttingRecord.pieceLength = parseFloat(pieceLength)
    if (pieceWidth) cuttingRecord.pieceWidth = parseFloat(pieceWidth)
    if (usageLocation) cuttingRecord.usageLocation = usageLocation
    if (cuttingEmployee) cuttingRecord.cuttingEmployee = cuttingEmployee
    if (status) cuttingRecord.status = status
    if (notes !== undefined) cuttingRecord.notes = notes

    // Recalculate total square meters used
    cuttingRecord.totalSquareMetersUsed = cuttingRecord.piecesCount * cuttingRecord.pieceLength * cuttingRecord.pieceWidth

    await cuttingRecord.save()
    res.json({
      message: 'Cutting record updated successfully',
      cuttingRecord
    })
  } catch (error: any) {
    console.error('Update cutting record error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// DELETE cutting record
router.delete('/:id', async (req, res) => {
  try {
    const cuttingRecord = await CuttingRecord.findById(req.params.id)
    if (!cuttingRecord) {
      return res.status(404).json({ message: 'Cutting record not found' })
    }

    await CuttingRecord.findByIdAndDelete(req.params.id)
    res.json({ message: 'Cutting record deleted successfully' })
  } catch (error: any) {
    console.error('Delete cutting record error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

export default router