import mongoose, { Document, Schema } from 'mongoose'

export interface IManufacturingOrder extends Document {
  cuttingId: string
  productName: string
  quantity: number
  dueDate: string
  tailorName: string
  tailorMobile: string
  priority: 'Low' | 'Normal' | 'High' | 'Urgent'
  status: 'Pending' | 'In Progress' | 'Completed' | 'Cancelled'
  notes?: string
  createdAt: Date
  updatedAt: Date
}

const ManufacturingOrderSchema: Schema = new Schema({
  cuttingId: {
    type: String,
    required: true,
    trim: true
  },
  productName: {
    type: String,
    required: true,
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  dueDate: {
    type: String,
    required: true
  },
  tailorName: {
    type: String,
    required: true,
    trim: true
  },
  tailorMobile: {
    type: String,
    required: true,
    trim: true
  },
  priority: {
    type: String,
    required: true,
    enum: ['Low', 'Normal', 'High', 'Urgent'],
    default: 'Normal'
  },
  status: {
    type: String,
    required: true,
    enum: ['Pending', 'In Progress', 'Completed', 'Cancelled'],
    default: 'Pending'
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
})

export const ManufacturingOrder = mongoose.model<IManufacturingOrder>('ManufacturingOrder', ManufacturingOrderSchema)