import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IEmployee extends Document {
  username: string;
  password: string;
  name: string;
  email: string;
  mobile: string;
  aadharNumber?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  salary?: number;
  work: string;
  photo?: string;
  employeeId: string;
  role: 'admin' | 'employee';
  joiningDate: Date;
  status: 'active' | 'inactive' | 'terminated';
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const employeeSchema = new Schema<IEmployee>({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  mobile: {
    type: String,
    required: true
  },
  aadharNumber: {
    type: String,
    trim: true,
    match: /^\d{12}$/  // Validates 12-digit Aadhar number
  },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String
  },
  salary: {
    type: Number,
    default: 0
  },
  work: {
    type: String,
    required: true
  },
  photo: {
    type: String, // Base64 encoded photo
    default: null
  },
  employeeId: {
    type: String,
    unique: true
  },
  role: {
    type: String,
    default: 'employee',
    enum: ['employee', 'admin']
  },
  joiningDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    default: 'active',
    enum: ['active', 'inactive', 'terminated']
  }
}, {
  timestamps: true
});

// Hash password before saving
employeeSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Generate employee ID
employeeSchema.pre('save', async function(next) {
  if (!this.employeeId) {
    try {
      const count = await (this.constructor as any).countDocuments();
      this.employeeId = `EMP${String(count + 1).padStart(4, '0')}`;
    } catch (error: any) {
      return next(error);
    }
  }
  next();
});

// Compare password method
employeeSchema.methods.comparePassword = async function(candidatePassword: string) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const Employee = mongoose.model<IEmployee>('Employee', employeeSchema);
export { Employee };
export default Employee;