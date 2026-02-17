const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Appointment = require('../models/appointment.model');
const Doctor = require('../models/doctor.model');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// Validation middleware
const validateAppointment = [
    body('doctorId').isMongoId().withMessage('Invalid doctor ID'),
    body('date').isISO8601().withMessage('Invalid date format'),
    body('timeSlot').notEmpty().withMessage('Time slot is required'),
    body('type').isIn(['General Checkup', 'Follow-up', 'Consultation', 'Emergency']).withMessage('Invalid appointment type'),
    body('symptoms').optional(),
    body('notes').optional()
];

// Create appointment (patient only)
router.post('/', authenticateToken, async (req, res) => {
    try {
        // Check if user is a patient
        if (req.user.role !== 'patient') {
            return res.status(403).json({ message: 'Only patients can create appointments' });
        }

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { doctorId, date, time, type, symptoms, notes } = req.body;

        // Check if doctor exists and is approved
        const doctor = await Doctor.findById(doctorId);
        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }

        if (!doctor.isApproved) {
            return res.status(400).json({ message: 'Doctor is not currently available for appointments' });
        }

        // Validate the time slot against doctor's availability
        const requestDate = new Date(date);
        const dayOfWeek = requestDate.getDay();
        const dayAvailability = doctor.availability.find(a => a.dayOfWeek === dayOfWeek);

        if (!dayAvailability || !dayAvailability.isAvailable) {
            return res.status(400).json({ message: 'Doctor is not available on this day' });
        }

        // Check if the time is within doctor's working hours
        const [timeHour, timeMinute] = time.split(':').map(Number);
        const [startHour, startMinute] = dayAvailability.startTime.split(':').map(Number);
        const [endHour, endMinute] = dayAvailability.endTime.split(':').map(Number);

        const appointmentTime = new Date(requestDate);
        appointmentTime.setHours(timeHour, timeMinute, 0);

        const startTime = new Date(requestDate);
        startTime.setHours(startHour, startMinute, 0);

        const endTime = new Date(requestDate);
        endTime.setHours(endHour, endMinute, 0);

        if (appointmentTime < startTime || appointmentTime >= endTime) {
            return res.status(400).json({ message: 'Selected time is outside doctor\'s working hours' });
        }

        // Check if time slot is available
        const existingAppointment = await Appointment.findOne({
            doctorId,
            date,
            timeSlot: time,
            status: { $nin: ['cancelled'] }
        });

        if (existingAppointment) {
            return res.status(400).json({ message: 'This time slot is already booked' });
        }

        // Create appointment
        const appointment = new Appointment({
            patientId: req.user._id,
            doctorId,
            date,
            timeSlot: time,
            type,
            symptoms: symptoms || '',
            notes: notes || '',
            status: 'pending'
        });

        await appointment.save();
        
        // Populate doctor details before sending response
        await appointment.populate([
            { path: 'doctorId', populate: [
                { path: 'userId', select: 'name email' },
                { path: 'department', select: 'name' }
            ]},
            { path: 'patientId', select: 'name email phone' }
        ]);

        res.status(201).json(appointment);
    } catch (error) {
        console.error('Error creating appointment:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get appointments
router.get('/', authenticateToken, async (req, res) => {
    try {
        let appointments;
        
        if (req.user.role === 'patient') {
            appointments = await Appointment.find({ patientId: req.user._id })
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
                        },
                        {
                            path: 'specialization',
                            select: 'name'
                        }
                    ]
                })
                .sort({ date: -1 });

            // Transform the data
            appointments = appointments.map(appointment => {
                const doctor = appointment.doctorId;
                return {
                    ...appointment.toObject(),
                    doctorId: {
                        ...doctor,
                        name: doctor?.userId?.name || 'Doctor Not Available',
                        email: doctor?.userId?.email || 'Email Not Available',
                        phone: doctor?.userId?.phone || 'Phone Not Available',
                        department: {
                            name: doctor?.department?.name || 'Department Not Available'
                        },
                        specialization: {
                            name: doctor?.specialization?.name || 'Specialization Not Available'
                        }
                    }
                };
            });
        } else if (req.user.role === 'doctor') {
            const doctor = await Doctor.findOne({ userId: req.user._id });
            if (!doctor) {
                return res.status(404).json({ message: 'Doctor profile not found' });
            }

            appointments = await Appointment.find({ doctorId: doctor._id })
                .populate('patientId', 'name email phone')
                .sort({ date: -1 });
        } else {
            return res.status(403).json({ message: 'Not authorized to view appointments' });
        }

        res.json(appointments);
    } catch (err) {
        console.error('Error fetching appointments:', err);
        res.status(500).json({ message: 'Error fetching appointments', error: err.message });
    }
});

// Get all appointments (admin only)
router.get('/all', authenticateToken, isAdmin, async (req, res) => {
    try {
        const appointments = await Appointment.find()
            .populate({
                path: 'doctorId',
                populate: {
                    path: 'userId',
                    select: 'name email'
                }
            })
            .populate('patientId', 'name email phone')
            .sort({ date: 1 });
        
        res.json(appointments);
    } catch (error) {
        console.error('Error fetching all appointments:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Cancel appointment
router.put('/:id/cancel', authenticateToken, async (req, res) => {
    try {
        const { reason } = req.body;
        const appointment = await Appointment.findById(req.params.id);

        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        // Check if user has permission to cancel
        if (req.user.role === 'patient' && appointment.patientId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to cancel this appointment' });
        }

        if (req.user.role === 'doctor' && appointment.doctorId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to cancel this appointment' });
        }

        appointment.status = 'cancelled';
        appointment.cancellationReason = reason;
        appointment.cancelledBy = req.user.role;
        await appointment.save();

        res.json({ message: 'Appointment cancelled successfully', appointment });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Complete appointment (doctor only)
router.patch('/:id/complete', authenticateToken, async (req, res) => {
    try {
        // Check if user is a doctor
        if (req.user.role !== 'doctor') {
            return res.status(403).json({ message: 'Only doctors can complete appointments' });
        }

        // Get the doctor document using the user ID
        const doctor = await Doctor.findOne({ userId: req.user._id });
        if (!doctor) {
            return res.status(404).json({ message: 'Doctor profile not found' });
        }

        const appointment = await Appointment.findById(req.params.id);
        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        // Check if this appointment belongs to the doctor
        if (appointment.doctorId.toString() !== doctor._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to complete this appointment' });
        }

        appointment.status = 'completed';
        await appointment.save();

        res.json({ message: 'Appointment marked as completed', appointment });
    } catch (error) {
        console.error('Error completing appointment:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get appointment statistics (admin only)
router.get('/stats/overview', authenticateToken, isAdmin, async (req, res) => {
    try {
        const stats = await Promise.all([
            Appointment.countDocuments({ status: 'pending' }),
            Appointment.countDocuments({ status: 'confirmed' }),
            Appointment.countDocuments({ status: 'completed' }),
            Appointment.countDocuments({ status: 'cancelled' }),
            Appointment.countDocuments({ type: 'emergency' }),
            Appointment.countDocuments({ type: 'regular' }),
            Appointment.countDocuments({ type: 'follow-up' })
        ]);

        res.json({
            pendingAppointments: stats[0],
            confirmedAppointments: stats[1],
            completedAppointments: stats[2],
            cancelledAppointments: stats[3],
            emergencyAppointments: stats[4],
            regularAppointments: stats[5],
            followUpAppointments: stats[6]
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get single appointment
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const appointment = await Appointment.findById(req.params.id)
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
                    },
                    {
                        path: 'specialization',
                        select: 'name'
                    }
                ]
            })
            .populate('patientId', 'name email phone');
        
        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        // Transform the data
        const doctor = appointment.doctorId;
        const transformedAppointment = {
            ...appointment.toObject(),
            doctorId: {
                ...doctor,
                name: doctor?.userId?.name || 'Doctor Not Available',
                email: doctor?.userId?.email || 'Email Not Available',
                phone: doctor?.userId?.phone || 'Phone Not Available',
                department: {
                    name: doctor?.department?.name || 'Department Not Available'
                },
                specialization: {
                    name: doctor?.specialization?.name || 'Specialization Not Available'
                }
            }
        };
        
        res.json(transformedAppointment);
    } catch (err) {
        console.error('Error fetching appointment:', err);
        res.status(500).json({ message: 'Error fetching appointment' });
    }
});

// Get appointments by patient ID (admin only)
router.get('/patient/:patientId', authenticateToken, isAdmin, async (req, res) => {
    try {
        const appointments = await Appointment.find({ patientId: req.params.patientId })
            .populate({
                path: 'doctorId',
                populate: [
                    { path: 'userId', select: 'name email' },
                    { path: 'department', select: 'name' }
                ]
            })
            .populate('patientId', 'name email phone')
            .sort({ date: -1 });

        res.json(appointments);
    } catch (error) {
        console.error('Error fetching patient appointments:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router; 