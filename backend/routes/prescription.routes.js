const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Prescription = require('../models/prescription.model');
const Appointment = require('../models/appointment.model');
const Doctor = require('../models/doctor.model');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// Validation middleware
const validatePrescription = [
    body('appointmentId').isMongoId().withMessage('Invalid appointment ID'),
    body('diagnosis').notEmpty().withMessage('Diagnosis is required'),
    body('medicines').isArray().withMessage('Medicines must be an array'),
    body('medicines.*.name').notEmpty().withMessage('Medicine name is required'),
    body('medicines.*.dosage').notEmpty().withMessage('Medicine dosage is required'),
    body('medicines.*.frequency').notEmpty().withMessage('Medicine frequency is required'),
    body('medicines.*.duration').notEmpty().withMessage('Medicine duration is required')
];

// Create prescription (doctor only)
router.post('/', authenticateToken, validatePrescription, async (req, res) => {
    try {
        // Check if user is a doctor
        if (req.user.role !== 'doctor') {
            return res.status(403).json({ message: 'Only doctors can create prescriptions' });
        }

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { appointmentId, diagnosis, medicines, tests, notes, followUpDate } = req.body;

        // Get the doctor document using the user ID
        const doctor = await Doctor.findOne({ userId: req.user._id });
        if (!doctor) {
            return res.status(404).json({ message: 'Doctor profile not found' });
        }

        // Check if appointment exists and belongs to the doctor
        const appointment = await Appointment.findOne({
            _id: appointmentId,
            doctorId: doctor._id,
            status: 'completed'
        });

        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found or not completed' });
        }

        // Create prescription
        const prescription = new Prescription({
            appointmentId,
            patientId: appointment.patientId,
            doctorId: doctor._id,
            diagnosis,
            medicines,
            tests,
            notes,
            followUpDate
        });

        await prescription.save();

        // Populate the prescription with doctor and patient details
        await prescription.populate([
            {
                path: 'doctorId',
                populate: [
                    { path: 'userId', select: 'name email' },
                    { path: 'department', select: 'name' }
                ]
            },
            { path: 'patientId', select: 'name email phone' }
        ]);

        res.status(201).json(prescription);
    } catch (error) {
        console.error('Error creating prescription:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get patient's prescriptions
router.get('/patient', authenticateToken, async (req, res) => {
    try {
        // Check if user is a patient
        if (req.user.role !== 'patient') {
            return res.status(403).json({ message: 'Access denied: Patient only' });
        }

        const prescriptions = await Prescription.find({ patientId: req.user._id })
            .populate({
                path: 'doctorId',
                populate: [
                    { path: 'userId', select: 'name email' },
                    { path: 'department', select: 'name' }
                ]
            })
            .sort({ createdAt: -1 });
        res.json(prescriptions);
    } catch (error) {
        console.error('Error fetching patient prescriptions:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get doctor's prescriptions
router.get('/doctor', authenticateToken, async (req, res) => {
    try {
        // Check if user is a doctor
        if (req.user.role !== 'doctor') {
            return res.status(403).json({ message: 'Access denied: Doctor only' });
        }

        // Get the doctor document
        const doctor = await Doctor.findOne({ userId: req.user._id });
        if (!doctor) {
            return res.status(404).json({ message: 'Doctor profile not found' });
        }

        const prescriptions = await Prescription.find({ doctorId: doctor._id })
            .populate('patientId', 'name email phone')
            .sort({ createdAt: -1 });
        res.json(prescriptions);
    } catch (error) {
        console.error('Error fetching doctor prescriptions:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get prescription by ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const prescription = await Prescription.findById(req.params.id)
            .populate('patientId', 'name email phone')
            .populate({
                path: 'doctorId',
                populate: [
                    { path: 'userId', select: 'name email' },
                    { path: 'department', select: 'name' }
                ]
            });

        if (!prescription) {
            return res.status(404).json({ message: 'Prescription not found' });
        }

        // Check if user has permission to view
        if (req.user.role === 'patient' && prescription.patientId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to view this prescription' });
        }

        if (req.user.role === 'doctor') {
            const doctor = await Doctor.findOne({ userId: req.user._id });
            if (!doctor || prescription.doctorId.toString() !== doctor._id.toString()) {
                return res.status(403).json({ message: 'Not authorized to view this prescription' });
            }
        }

        res.json(prescription);
    } catch (error) {
        console.error('Error fetching prescription:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Update prescription status (doctor only)
router.patch('/:id/status', authenticateToken, async (req, res) => {
    try {
        // Check if user is a doctor
        if (req.user.role !== 'doctor') {
            return res.status(403).json({ message: 'Only doctors can update prescription status' });
        }

        const { status } = req.body;
        
        // Get the doctor document
        const doctor = await Doctor.findOne({ userId: req.user._id });
        if (!doctor) {
            return res.status(404).json({ message: 'Doctor profile not found' });
        }

        const prescription = await Prescription.findOne({
            _id: req.params.id,
            doctorId: doctor._id
        });

        if (!prescription) {
            return res.status(404).json({ message: 'Prescription not found' });
        }

        prescription.status = status;
        await prescription.save();

        // Populate the updated prescription
        await prescription.populate([
            {
                path: 'doctorId',
                populate: [
                    { path: 'userId', select: 'name email' },
                    { path: 'department', select: 'name' }
                ]
            },
            { path: 'patientId', select: 'name email phone' }
        ]);

        res.json({ message: 'Prescription status updated successfully', prescription });
    } catch (error) {
        console.error('Error updating prescription status:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get prescription statistics (admin only)
router.get('/stats/overview', authenticateToken, isAdmin, async (req, res) => {
    try {
        const stats = await Promise.all([
            Prescription.countDocuments({ status: 'active' }),
            Prescription.countDocuments({ status: 'completed' }),
            Prescription.countDocuments({ status: 'cancelled' })
        ]);

        res.json({
            activePrescriptions: stats[0],
            completedPrescriptions: stats[1],
            cancelledPrescriptions: stats[2]
        });
    } catch (error) {
        console.error('Error fetching prescription statistics:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get prescriptions by patient ID (admin only)
router.get('/patient/:patientId', authenticateToken, isAdmin, async (req, res) => {
    try {
        const prescriptions = await Prescription.find({ patientId: req.params.patientId })
            .populate({
                path: 'doctorId',
                populate: [
                    { path: 'userId', select: 'name email' },
                    { path: 'department', select: 'name' }
                ]
            })
            .populate('patientId', 'name email phone')
            .sort({ createdAt: -1 });

        res.json(prescriptions);
    } catch (error) {
        console.error('Error fetching patient prescriptions:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router; 