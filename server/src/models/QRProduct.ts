import mongoose, { Document, Schema } from 'mongoose'

export interface IQRProduct extends Document {
  productId: string
  manufacturingId: string
  productName: string
  color: string
  size: string
  quantity: number
  tailorName: string
  qrCodeData: string
  isGenerated: boolean
  generatedDate: string
  cuttingId?: string
  notes?: string
  createdAt: Date
  updatedAt: Date
}

const QRProductSchema: Schema = new Schema({
  productId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  manufacturingId: {
    type: String,
    required: true,
    trim: true
  },
  productName: {
    type: String,
    required: true,
    trim: true
  },
  color: {
    type: String,
    required: true,
    trim: true
  },
  size: {
    type: String,
    required: true,
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  tailorName: {
    type: String,
    required: true,
    trim: true
  },
  qrCodeData: {
    type: String,
    required: true
  },
  isGenerated: {
    type: Boolean,
    default: true
  },
  generatedDate: {
    type: String,
    required: true
  },
  cuttingId: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
})

export const QRProduct = mongoose.model<IQRProduct>('QRProduct', QRProductSchema)