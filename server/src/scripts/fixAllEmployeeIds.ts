import mongoose from 'mongoose';
import { Employee } from '../models/Employee';
import dotenv from 'dotenv';

dotenv.config();

async function fixAllEmployeeIds() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/inventory');
    console.log('Connected to MongoDB');

    // Get all employees
    const employees = await Employee.find().sort({ createdAt: 1 });
    console.log(`Found ${employees.length} employees to update`);

    const year = new Date().getFullYear().toString().slice(-2);

    // Update each employee with correct format
    for (let i = 0; i < employees.length; i++) {
      const employee = employees[i];
      const newEmployeeId = `WI${year}EMP${String(i + 1).padStart(2, '0')}`;

      // Update directly in database to avoid pre-save hook
      await Employee.updateOne(
        { _id: employee._id },
        { $set: { employeeId: newEmployeeId } }
      );

      console.log(`Updated ${employee.name}: ${employee.employeeId} -> ${newEmployeeId}`);
    }

    console.log('All employee IDs updated successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
fixAllEmployeeIds();