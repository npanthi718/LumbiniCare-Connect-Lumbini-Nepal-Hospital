const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Department = require('../models/department.model');
const Doctor = require('../models/doctor.model');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// Validation middleware
const validateDepartment = [
    body('name').trim().notEmpty().withMessage('Department name is required'),
    body('description').trim().notEmpty().withMessage('Department description is required'),
    body('headDoctor').optional().isMongoId().withMessage('Invalid head doctor ID'),
    body('services').isArray().withMessage('Services must be an array'),
    body('facilities').isArray().withMessage('Facilities must be an array'),
    body('workingHours').isObject().withMessage('Working hours must be an object')
];

// Get all departments (public)
router.get('/', async (req, res) => {
    try {
        console.log('Fetching all departments...');
        const departments = await Department.find({ status: 'active' })
            .select('name description specializations services facilities workingHours')
            .lean();

        console.log(`Found ${departments.length} departments`);
        res.json(departments);
    } catch (error) {
        console.error('Error fetching departments:', error);
        res.status(500).json({ 
            message: 'Error fetching departments',
            error: error.message 
        });
    }
});

// Get department by ID with full details
router.get('/:id', async (req, res) => {
    try {
        const department = await Department.findById(req.params.id)
            .select('-__v')
            .lean();

        if (!department) {
            return res.status(404).json({ message: 'Department not found' });
        }

        res.json(department);
    } catch (error) {
        console.error('Error fetching department:', error);
        res.status(500).json({ 
            message: 'Error fetching department',
            error: error.message 
        });
    }
});

// Create department (admin only)
router.post('/', authenticateToken, isAdmin, validateDepartment, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, description, headDoctor, services, facilities, workingHours, contactInfo } = req.body;

        // Check if department name already exists
        const existingDepartment = await Department.findOne({ name });
        if (existingDepartment) {
            return res.status(400).json({ message: 'Department name already exists' });
        }

        // Create department
        const department = new Department({
            name,
            description,
            headDoctor,
            services,
            facilities,
            workingHours,
            contactInfo
        });

        await department.save();
        res.status(201).json(department);
    } catch (error) {
        console.error('Error creating department:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Update department (admin only)
router.put('/:id', authenticateToken, isAdmin, validateDepartment, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const department = await Department.findById(req.params.id);
        if (!department) {
            return res.status(404).json({ message: 'Department not found' });
        }

        // Update fields
        Object.keys(req.body).forEach(key => {
            department[key] = req.body[key];
        });

        await department.save();
        res.json(department);
    } catch (error) {
        console.error('Error updating department:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Add doctor to department (admin only)
router.post('/:id/doctors', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { doctorId } = req.body;
        const department = await Department.findById(req.params.id);
        const doctor = await Doctor.findById(doctorId);

        if (!department) {
            return res.status(404).json({ message: 'Department not found' });
        }

        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }

        if (department.doctors.includes(doctorId)) {
            return res.status(400).json({ message: 'Doctor already in department' });
        }

        department.doctors.push(doctorId);
        await department.save();

        res.json({ message: 'Doctor added to department successfully', department });
    } catch (error) {
        console.error('Error adding doctor to department:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Remove doctor from department (admin only)
router.delete('/:id/doctors/:doctorId', authenticateToken, isAdmin, async (req, res) => {
    try {
        const department = await Department.findById(req.params.id);
        if (!department) {
            return res.status(404).json({ message: 'Department not found' });
        }

        const doctorIndex = department.doctors.indexOf(req.params.doctorId);
        if (doctorIndex === -1) {
            return res.status(404).json({ message: 'Doctor not found in department' });
        }

        department.doctors.splice(doctorIndex, 1);
        await department.save();

        res.json({ message: 'Doctor removed from department successfully', department });
    } catch (error) {
        console.error('Error removing doctor from department:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Update department status (admin only)
router.patch('/:id/status', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { isActive } = req.body;
        const department = await Department.findById(req.params.id);

        if (!department) {
            return res.status(404).json({ message: 'Department not found' });
        }

        department.isActive = isActive;
        await department.save();

        res.json({ message: 'Department status updated successfully', department });
    } catch (error) {
        console.error('Error updating department status:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get department statistics (admin only)
router.get('/stats/overview', authenticateToken, isAdmin, async (req, res) => {
    try {
        const stats = await Promise.all([
            Department.countDocuments({ isActive: true }),
            Department.countDocuments({ isActive: false }),
            Doctor.countDocuments()
        ]);

        res.json({
            activeDepartments: stats[0],
            inactiveDepartments: stats[1],
            totalDoctors: stats[2]
        });
    } catch (error) {
        console.error('Error fetching department statistics:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router; 