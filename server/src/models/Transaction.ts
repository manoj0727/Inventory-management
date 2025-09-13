import mongoose, { Document, Schema } from 'mongoose'

export interface ITransaction extends Document {
  transactionId: string
  timestamp: Date
  itemType: 'FABRIC' | 'MANUFACTURING' | 'CUTTING' | 'UNKNOWN'
  itemId: string
  itemName: string
  action: 'ADD' | 'REMOVE'
  quantity: number
  previousStock: number
  newStock: number
  performedBy: string
  source: 'QR_SCANNER' | 'MANUAL'
  createdAt: Date
  updatedAt: Date
}

const TransactionSchema: Schema = new Schema({
  transactionId: {
    type: String,
    unique: true
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now
  },
  itemType: {
    type: String,
    required: true,
    enum: ['FABRIC', 'MANUFACTURING', 'CUTTING', 'UNKNOWN'],
    default: 'UNKNOWN'
  },
  itemId: {
    type: String,
    required: true,
    trim: true
  },
  itemName: {
    type: String,
    required: true,
    trim: true
  },
  action: {
    type: String,
    required: true,
    enum: ['ADD', 'REMOVE']
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  previousStock: {
    type: Number,
    required: true,
    min: 0
  },
  newStock: {
    type: Number,
    required: true,
    min: 0
  },
  performedBy: {
    type: String,
    required: true,
    trim: true
  },
  source: {
    type: String,
    required: true,
    enum: ['QR_SCANNER', 'MANUAL'],
    default: 'MANUAL'
  }
}, {
  timestamps: true
})

// Generate unique transaction ID before saving
TransactionSchema.pre('save', async function(next) {
  if (this.isNew && !this.transactionId) {
    try {
      const actionCode = this.action === 'ADD' ? 'A' : 'R'
      const typeCode = (this.itemType as string).charAt(0)
      const timestamp = Date.now().toString().slice(-6)
      const randomNumber = Math.floor(Math.random() * 999) + 1

      let baseId = `TXN${actionCode}${typeCode}${timestamp}${randomNumber.toString().padStart(3, '0')}`
      let finalId = baseId
      let attempt = 0

      // Check for duplicates and generate new ID if needed
      while (await mongoose.models.Transaction.findOne({ transactionId: finalId })) {
        attempt++
        const newRandomNumber = Math.floor(Math.random() * 999) + 1
        finalId = `TXN${actionCode}${typeCode}${timestamp}${newRandomNumber.toString().padStart(3, '0')}`

        if (attempt > 10) {
          // Fallback with extended timestamp
          finalId = `TXN${actionCode}${typeCode}${Date.now().toString().slice(-8)}`
          break
        }
      }

      this.transactionId = finalId
    } catch (error) {
      console.error('Error generating transaction ID:', error)
      this.transactionId = `TXN${Date.now()}`
    }
  }

  next()
})

// Index for better query performance
TransactionSchema.index({ timestamp: -1 })
TransactionSchema.index({ itemId: 1, timestamp: -1 })
TransactionSchema.index({ itemType: 1, timestamp: -1 })
TransactionSchema.index({ performedBy: 1, timestamp: -1 })

export const Transaction = mongoose.model<ITransaction>('Transaction', TransactionSchema)