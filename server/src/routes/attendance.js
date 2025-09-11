const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');

// Get all attendance records
router.get('/', async (req, res) => {
  try {
    const { date, employeeId, startDate, endDate } = req.query;
    let query = {};
    
    if (employeeId) {
      query.employeeId = employeeId;
    }
    
    if (date) {
      const queryDate = new Date(date);
      queryDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(queryDate);
      nextDay.setDate(nextDay.getDate() + 1);
      query.date = { $gte: queryDate, $lt: nextDay };
    } else if (startDate && endDate) {
      query.date = { 
        $gte: new Date(startDate), 
        $lte: new Date(endDate) 
      };
    }
    
    const attendance = await Attendance.find(query).sort({ date: -1 });
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get today's attendance for an employee
router.get('/today/:employeeId', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const attendance = await Attendance.findOne({
      employeeId: req.params.employeeId,
      date: { $gte: today, $lt: tomorrow }
    });
    
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark attendance (check-in)
router.post('/checkin', async (req, res) => {
  try {
    const { employeeId, photo, location } = req.body;
    
    // Get employee details
    const employee = await Employee.findOne({ employeeId });
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    // Check if already checked in today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const existingAttendance = await Attendance.findOne({
      employeeId,
      date: { $gte: today, $lt: tomorrow }
    });
    
    if (existingAttendance && !existingAttendance.checkOut) {
      return res.status(400).json({ message: 'Already checked in today' });
    }
    
    // Create new attendance record
    const attendance = new Attendance({
      employeeId,
      employeeName: employee.name,
      date: today,
      checkIn: new Date(),
      photo,
      location,
      status: new Date().getHours() > 9 ? 'late' : 'present'
    });
    
    await attendance.save();
    res.status(201).json(attendance);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Mark checkout
router.post('/checkout', async (req, res) => {
  try {
    const { employeeId } = req.body;
    
    // Find today's attendance
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const attendance = await Attendance.findOne({
      employeeId,
      date: { $gte: today, $lt: tomorrow },
      checkOut: null
    });
    
    if (!attendance) {
      return res.status(404).json({ message: 'No check-in found for today' });
    }
    
    attendance.checkOut = new Date();
    attendance.calculateWorkHours();
    await attendance.save();
    
    res.json(attendance);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get attendance summary for a period
router.get('/summary/:employeeId', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const { employeeId } = req.params;
    
    const attendance = await Attendance.find({
      employeeId,
      date: { 
        $gte: new Date(startDate), 
        $lte: new Date(endDate) 
      }
    });
    
    const summary = {
      totalDays: attendance.length,
      present: attendance.filter(a => a.status === 'present').length,
      late: attendance.filter(a => a.status === 'late').length,
      absent: attendance.filter(a => a.status === 'absent').length,
      leaves: attendance.filter(a => a.status === 'leave').length,
      totalHours: attendance.reduce((sum, a) => sum + (a.workHours || 0), 0)
    };
    
    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update attendance record
router.put('/:id', async (req, res) => {
  try {
    const attendance = await Attendance.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }
    
    if (attendance.checkOut) {
      attendance.calculateWorkHours();
      await attendance.save();
    }
    
    res.json(attendance);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete attendance record
router.delete('/:id', async (req, res) => {
  try {
    const attendance = await Attendance.findByIdAndDelete(req.params.id);
    
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }
    
    res.json({ message: 'Attendance record deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;