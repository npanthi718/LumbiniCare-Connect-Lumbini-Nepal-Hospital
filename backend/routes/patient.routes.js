const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const Appointment = require('../models/appointment.model');
const Prescription = require('../models/prescription.model');

// Debug middleware to log all requests
router.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  console.log('Headers:', req.headers);
  next();
});

// Get patient's appointments
router.get('/appointments', authenticateToken, async (req, res) => {
  try {
    // Check if user is a patient
    if (req.user.role !== 'patient') {
      return res.status(403).json({ message: 'Access denied: Patient only' });
    }

    console.log('Fetching appointments for patient:', req.user._id);
    
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'User ID not found in request' });
    }

    const appointments = await Appointment.find({ patientId: req.user._id })
      .populate({
        path: 'doctorId',
        populate: [
          { 
            path: 'userId',
            select: 'name email phone'
          },
          { 
            path: 'department',
            select: 'name'
          }
        ],
        select: 'userId department specialization'
      })
      .sort({ date: -1 });

    // Transform the data to match the frontend expectations
    const transformedAppointments = appointments.map(appointment => {
      const doctor = appointment.doctorId;
      return {
        ...appointment.toObject(),
        doctorId: {
          ...doctor,
          name: doctor?.userId?.name || 'Doctor Not Available',
          email: doctor?.userId?.email || 'Email Not Available',
          phone: doctor?.userId?.phone || 'Phone Not Available',
          department: doctor?.department?.name ? { name: doctor.department.name } : { name: 'Department Not Available' },
          specialization: doctor?.specialization || 'Not Available'
        }
      };
    });

    console.log('Transformed appointments:', JSON.stringify(transformedAppointments, null, 2));
    res.json(transformedAppointments);
  } catch (error) {
    console.error('Error fetching patient appointments:', error);
    res.status(500).json({ 
      message: 'Failed to fetch appointments', 
      error: error.message
    });
  }
});

// Get patient's prescriptions
router.get('/prescriptions', authenticateToken, async (req, res) => {
  try {
    // Check if user is a patient
    if (req.user.role !== 'patient') {
      return res.status(403).json({ message: 'Access denied: Patient only' });
    }

    console.log('Fetching prescriptions for patient:', req.user._id);
    console.log('User object:', req.user);

    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'User ID not found in request' });
    }

    const prescriptions = await Prescription.find({ patientId: req.user._id })
      .populate({
        path: 'doctorId',
        populate: [
          { path: 'userId', select: 'name' },
          { path: 'department', select: 'name' }
        ]
      })
      .sort({ createdAt: -1 });

    console.log(`Found ${prescriptions.length} prescriptions for patient ${req.user._id}`);
    res.json(prescriptions);
  } catch (error) {
    console.error('Error fetching patient prescriptions:', error);
    res.status(500).json({ 
      message: 'Error fetching prescriptions', 
      error: error.message,
      userId: req.user?._id,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router; 