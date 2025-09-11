import mongoose, { Document, Schema } from 'mongoose'

export interface IFabric extends Document {
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
  fabricId: {
    type: String,
    unique: true,
    required: true
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

// Generate unique fabric ID before saving
FabricSchema.pre('save', async function(next) {
  if (this.isNew) {
    const count = await mongoose.model('Fabric').countDocuments()
    this.fabricId = `FAB${String(count + 1).padStart(3, '0')}`
    
    // Auto-set status based on quantity
    if (this.quantity === 0) {
      this.status = 'Out of Stock'
    } else if (this.quantity <= 20) {
      this.status = 'Low Stock'
    } else {
      this.status = 'In Stock'
    }
  }
  next()
})

export const Fabric = mongoose.model<IFabric>('Fabric', FabricSchema)