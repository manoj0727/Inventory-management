import mongoose, { Document, Schema } from 'mongoose'

export interface IFabric extends Document {
  productId: string
  fabricId: string
  fabricType: string
  color: string
  quality: 'Premium' | 'Standard' | 'Economy'
  length: number
  width: number
  quantity: number
  supplier: string
  purchasePrice?: number
  location?: string
  notes?: string
  status: 'In Stock' | 'Low Stock' | 'Out of Stock'
  dateReceived: Date
  createdAt: Date
  updatedAt: Date
}

const FabricSchema: Schema = new Schema({
  productId: {
    type: String,
    unique: true
  },
  fabricId: {
    type: String,
    unique: true
  },
  fabricType: {
    type: String,
    required: true,
    trim: true
  },
  color: {
    type: String,
    required: true,
    trim: true
  },
  quality: {
    type: String,
    required: true,
    enum: ['Premium', 'Standard', 'Economy']
  },
  length: {
    type: Number,
    required: true,
    min: 0.1
  },
  width: {
    type: Number,
    required: true,
    min: 0.1
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  supplier: {
    type: String,
    required: true,
    trim: true
  },
  purchasePrice: {
    type: Number,
    min: 0
  },
  location: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    required: true,
    enum: ['In Stock', 'Low Stock', 'Out of Stock'],
    default: 'In Stock'
  },
  dateReceived: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
})

// Generate unique product ID and fabricId before saving
FabricSchema.pre('save', async function(next) {
  if (this.isNew && (!this.productId || !this.fabricId)) {
    try {
      const nameCode = this.fabricType.substring(0, 3).toUpperCase()
      const colorCode = this.color.substring(0, 2).toUpperCase()
      const quantityCode = Math.floor(this.quantity).toString().padStart(3, '0')
      const baseProductId = `${nameCode}${colorCode}${quantityCode}`
      
      let productId = baseProductId
      let isUnique = false
      let attempts = 0
      const maxAttempts = 10
      
      while (!isUnique && attempts < maxAttempts) {
        // Check if this ID already exists
        const existingFabric = await this.constructor.findOne({ productId })
        if (!existingFabric) {
          isUnique = true
        } else {
          attempts++
          // Add attempt number to make it unique
          productId = `${baseProductId}${attempts}`
        }
      }
      
      // Fallback to timestamp-based ID if all attempts failed
      if (!isUnique) {
        productId = `${nameCode}${colorCode}${String(Date.now()).slice(-3)}`
      }
      
      this.productId = productId
      this.fabricId = productId // Use same ID for both fields
    } catch (error) {
      // Ultimate fallback ID generation
      const fallbackId = `FAB${String(Date.now()).slice(-6)}`
      this.productId = fallbackId
      this.fabricId = fallbackId
    }
  }
  
  // Auto-set status based on quantity
  if (this.quantity === 0) {
    this.status = 'Out of Stock'
  } else if (this.quantity <= 20) {
    this.status = 'Low Stock'
  } else {
    this.status = 'In Stock'
  }
  
  next()
})

export const Fabric = mongoose.model<IFabric>('Fabric', FabricSchema)