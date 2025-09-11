import mongoose, { Document, Schema } from 'mongoose'

export interface ICuttingRecord extends Document {
  id: string
  productId: string
  fabricType: string
  fabricColor: string
  productName: string
  piecesCount: number
  pieceLength: number
  pieceWidth: number
  totalSquareMetersUsed: number
  usageLocation: string
  cuttingEmployee: string
  date: string
  time: string
  status: 'Completed' | 'In Progress' | 'Cancelled'
  notes?: string
  createdAt: Date
  updatedAt: Date
}

const CuttingRecordSchema: Schema = new Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  productId: {
    type: String,
    required: true,
    trim: true
  },
  fabricType: {
    type: String,
    required: true,
    trim: true
  },
  fabricColor: {
    type: String,
    required: true,
    trim: true
  },
  productName: {
    type: String,
    required: true,
    trim: true
  },
  piecesCount: {
    type: Number,
    required: true,
    min: 1
  },
  pieceLength: {
    type: Number,
    required: true,
    min: 0.1
  },
  pieceWidth: {
    type: Number,
    required: true,
    min: 0.1
  },
  totalSquareMetersUsed: {
    type: Number,
    required: true,
    min: 0
  },
  usageLocation: {
    type: String,
    required: true,
    trim: true
  },
  cuttingEmployee: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: String,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ['Completed', 'In Progress', 'Cancelled'],
    default: 'Completed'
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
})

export const CuttingRecord = mongoose.model<ICuttingRecord>('CuttingRecord', CuttingRecordSchema)