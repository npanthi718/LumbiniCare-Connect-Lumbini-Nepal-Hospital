const express = require('express');
const router = express.Router();
const User = require('../models/user.model');
const Doctor = require('../models/doctor.model');
const Appointment = require('../models/appointment.model');
const Department = require('../models/department.model');
const Prescription = require('../models/prescription.model');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// Apply authentication and admin middleware to all routes
router.use(authenticateToken);
router.use(isAdmin);

// Get dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const [totalDoctors, totalPatients, totalAppointments, pendingApprovals] = await Promise.all([
      Doctor.countDocuments(),
      User.countDocuments({ role: 'patient' }),
      Appointment.countDocuments(),
      Appointment.countDocuments({ status: 'pending' })
    ]);

    res.json({ totalDoctors, totalPatients, totalAppointments, pendingApprovals });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching stats', error: error.message });
  }
});

// Get all appointments (admin only)
router.get('/appointments', async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 25, 100);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Appointment.find()
        .populate({
          path: 'doctorId',
          populate: [
            { path: 'userId', select: 'name email' },
            { path: 'department', select: 'name' }
          ],
          select: 'userId department'
        })
        .populate('patientId', 'name email')
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Appointment.countDocuments()
    ]);

    res.json({
      items,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching appointments', error: error.message });
  }
});

// Get all doctors
router.get('/doctors', async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 25, 100);
    const skip = (page - 1) * limit;

    const [docs, total] = await Promise.all([
      Doctor.find()
        .select('department consultationFee userId isApproved status specialization experience')
        .populate({ path: 'userId', select: 'name email' })
        .populate({ path: 'department', select: 'name' })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Doctor.countDocuments()
    ]);

    const items = docs.map(d => ({
      _id: d._id,
      consultationFee: d.consultationFee,
      isApproved: d.isApproved,
      status: d.status,
      specialization: d.specialization,
      experience: d.experience,
      user: {
        _id: d.userId?._id,
        name: d.userId?.name || 'Unknown Doctor',
        email: d.userId?.email || 'No email'
      },
      department: {
        _id: d.department?._id,
        name: d.department?.name || 'Unknown Department'
      }
    }));

    res.json({
      items,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching doctors', error: error.message });
  }
});

// Get all patients
router.get('/patients', async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 25, 100);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      User.find({ role: 'patient' })
        .select('name email phone role')
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments({ role: 'patient' })
    ]);

    res.json({
      items,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching patients', error: error.message });
  }
});

// Get all departments
router.get('/departments', async (req, res) => {
  try {
    const departments = await Department.find().lean();
    res.json(departments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching departments', error: error.message });
  }
});

// Update appointment status
router.patch('/appointments/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, cancellationReason } = req.body;

    // Validate appointment ID
    if (!id) {
      return res.status(400).json({ message: 'Appointment ID is required' });
    }

    const appointment = await Appointment.findById(id);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Only allow specific status transitions
    const allowedStatuses = ['confirmed', 'cancelled', 'completed', 'pending'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    // Require cancellation reason when cancelling
    if (status === 'cancelled' && !cancellationReason) {
      return res.status(400).json({ message: 'Cancellation reason is required' });
    }

    // Prevent reverting cancelled past appointments
    if (status === 'confirmed' && appointment.status === 'cancelled') {
      const aptDate = new Date(appointment.date);
      aptDate.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (aptDate < today) {
        return res.status(400).json({ message: 'Cannot revert a cancelled appointment from a past date' });
      }
    }

    // Update the appointment
    appointment.status = status;
    if (status === 'cancelled') {
      appointment.cancellationReason = cancellationReason;
    }

    await appointment.save();

    // Return updated appointment with populated fields
    const updatedAppointment = await Appointment.findById(appointment._id)
      .populate('patientId', 'name email profilePhoto')
      .populate({
        path: 'doctorId',
        populate: {
          path: 'department',
          select: 'name'
        }
      })
      .lean();

    res.json(updatedAppointment);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error updating appointment status',
      error: error.message
    });
  }
});

// Get patient appointments
router.get('/patients/:id/appointments', async (req, res) => {
  try {
    const appointments = await Appointment.find({ patientId: req.params.id })
      .populate({
        path: 'doctorId',
        populate: [
          { path: 'userId', select: 'name email' },
          { path: 'department', select: 'name' }
        ]
      })
      .populate('patientId', 'name email')
      .lean();
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching patient appointments', error: error.message });
  }
});

// Get patient prescriptions
router.get('/patients/:id/prescriptions', async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ patientId: req.params.id })
      .populate({
        path: 'doctorId',
        populate: [
          { path: 'userId', select: 'name email' },
          { path: 'department', select: 'name' }
        ]
      })
      .populate('patientId', 'name email')
      .lean();
    res.json(prescriptions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching patient prescriptions', error: error.message });
  }
});

// Get doctor appointments
router.get('/doctors/:id/appointments', async (req, res) => {
  try {
    const appointments = await Appointment.find({ doctorId: req.params.id })
      .populate({
        path: 'doctorId',
        populate: [
          {
            path: 'userId',
            select: 'name email'
          },
          {
            path: 'department',
            select: 'name'
          }
        ]
      })
      .populate('patientId', 'name email phone')
      .sort({ date: -1 })
      .lean();

    // Transform the data to ensure consistent structure
    const transformedAppointments = appointments.map(appointment => ({
      ...appointment,
      doctorId: {
        ...appointment.doctorId,
        name: appointment.doctorId?.userId?.name || 'Unknown Doctor',
        email: appointment.doctorId?.userId?.email || 'No email',
        department: {
          name: appointment.doctorId?.department?.name || 'Unknown Department'
        }
      },
      patientId: {
        name: appointment.patientId?.name || 'Unknown Patient',
        email: appointment.patientId?.email || 'No email',
        phone: appointment.patientId?.phone || 'No phone'
      }
    }));

    res.json(transformedAppointments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching doctor appointments', error: error.message });
  }
});

// Get doctor prescriptions
router.get('/doctors/:id/prescriptions', async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ doctorId: req.params.id })
      .populate({
        path: 'doctorId',
        populate: [
          {
            path: 'userId',
            select: 'name email'
          },
          {
            path: 'department',
            select: 'name'
          }
        ]
      })
      .populate('patientId', 'name email phone')
      .sort({ createdAt: -1 });

    res.json(prescriptions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching doctor prescriptions' });
  }
});

// Doctor history: appointments with embedded prescription
router.get('/doctor/:id/history', async (req, res) => {
  try {
    const doctorId = req.params.id;
    const [appointments, prescriptions] = await Promise.all([
      Appointment.find({ doctorId })
        .populate({
          path: 'doctorId',
          populate: [
            { path: 'userId', select: 'name email' },
            { path: 'department', select: 'name' }
          ]
        })
        .populate('patientId', 'name email phone')
        .sort({ date: -1 })
        .lean(),
      Prescription.find({ doctorId }).lean()
    ]);
    const presByApt = new Map();
    prescriptions.forEach(p => presByApt.set(String(p.appointmentId), p));
    const history = appointments.map(a => ({
      ...a,
      prescription: presByApt.get(String(a._id)) || null
    }));
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching doctor history', error: error.message });
  }
});

// Patient history: appointments with embedded prescription
router.get('/patient/:id/history', async (req, res) => {
  try {
    const patientId = req.params.id;
    const [appointments, prescriptions] = await Promise.all([
      Appointment.find({ patientId })
        .populate({
          path: 'doctorId',
          populate: [
            { path: 'userId', select: 'name email' },
            { path: 'department', select: 'name' }
          ]
        })
        .populate('patientId', 'name email phone')
        .sort({ date: -1 })
        .lean(),
      Prescription.find({ patientId }).lean()
    ]);
    const presByApt = new Map();
    prescriptions.forEach(p => presByApt.set(String(p.appointmentId), p));
    const history = appointments.map(a => ({
      ...a,
      prescription: presByApt.get(String(a._id)) || null
    }));
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching patient history', error: error.message });
  }
});

module.exports = router; 
