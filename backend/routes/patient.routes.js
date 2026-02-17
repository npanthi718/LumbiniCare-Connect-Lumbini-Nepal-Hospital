const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const Appointment = require('../models/appointment.model');
const Prescription = require('../models/prescription.model');

// Debug middleware removed to reduce noise

// Get patient's appointments
router.get('/appointments', authenticateToken, async (req, res) => {
  try {
    // Check if user is a patient
    if (req.user.role !== 'patient') {
      return res.status(403).json({ message: 'Access denied: Patient only' });
    }

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
      .sort({ date: -1 })
      .lean();

    // Transform the data to match the frontend expectations
    const transformedAppointments = appointments.map(appointment => {
      const doctor = appointment.doctorId;
      return {
        ...appointment,
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

    res.json(transformedAppointments);
  } catch (error) {
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
      .sort({ createdAt: -1 })
      .lean();

    res.json(prescriptions);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error fetching prescriptions', 
      error: error.message,
      userId: req.user?._id,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router; 
