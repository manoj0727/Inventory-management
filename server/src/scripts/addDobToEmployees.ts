import mongoose from 'mongoose';
import { Employee } from '../models/Employee';
import dotenv from 'dotenv';

dotenv.config();

async function addDobToEmployees() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/inventory');
    console.log('Connected to MongoDB');

    // Get all employees without DOB
    const employees = await Employee.find({
      $or: [
        { dob: { $exists: false } },
        { dob: null }
      ]
    });

    console.log(`Found ${employees.length} employees without DOB`);

    // Update each employee with a default DOB (set to 1990-01-01)
    for (const employee of employees) {
      employee.dob = new Date('1990-01-01');
      await employee.save();
      console.log(`Added default DOB to ${employee.name}: ${employee.dob.toISOString().split('T')[0]}`);
    }

    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
addDobToEmployees();