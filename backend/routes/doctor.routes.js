const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const Doctor = require("../models/doctor.model");
const User = require("../models/user.model");
const Appointment = require("../models/appointment.model");
const Prescription = require("../models/prescription.model");
const { authenticateToken, isAdmin } = require("../middleware/auth");
const { startOfDay, endOfDay, parse, format } = require('date-fns');

// Validation middleware
const validateDoctorUpdate = [
  body("specialization")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Specialization cannot be empty"),
  body("department")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Department cannot be empty"),
  body("experience")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Experience must be a positive number"),
  body("consultationFee")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Consultation fee must be a positive number"),
];

// Get all doctors
router.get("/", async (req, res) => {
  try {
    console.log("Fetching all doctors...");
    const doctors = await Doctor.find()
      .populate({
        path: "userId",
        select: "name email profilePhoto phoneNumber"
      })
      .populate({
        path: "department",
        select: "name description"
      })
      .lean();

    console.log(`Found ${doctors.length} doctors`);
    res.json(doctors);
  } catch (error) {
    console.error("Error fetching doctors:", error);
    res.status(500).json({ message: "Error fetching doctors", error: error.message });
  }
});

// Get doctor's appointments
router.get("/appointments", authenticateToken, async (req, res) => {
  try {
    // Check if user is a doctor
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Access denied: Doctor only' });
    }

    console.log("Fetching appointments for doctor:", req.user._id);

    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) {
      return res.status(404).json({ message: "Doctor profile not found" });
    }

    const appointments = await Appointment.find({ doctorId: doctor._id })
      .populate({
        path: "patientId",
        select: "name email phoneNumber profilePhoto",
      })
      .populate({
        path: "doctorId",
        select: "specialization department",
        populate: {
          path: "department",
          select: "name",
        },
      })
      .sort({ date: -1 });

    console.log(
      `Found ${appointments.length} appointments for doctor ${doctor._id}`
    );
    res.json(appointments);
  } catch (error) {
    console.error("Error fetching doctor appointments:", error);
    res.status(500).json({
      message: "Error fetching appointments",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

// Update doctor availability
router.put("/availability", authenticateToken, async (req, res) => {
  try {
    // Check if user is a doctor
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Access denied: Doctor only' });
    }

    const { availability } = req.body;
    const doctor = await Doctor.findOne({ userId: req.user._id });

    if (!doctor) {
      return res.status(404).json({ message: "Doctor profile not found" });
    }

    doctor.availability = availability;
    await doctor.save();

    res.json({
      message: "Availability updated successfully",
      availability: doctor.availability,
    });
  } catch (error) {
    console.error("Error updating doctor availability:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Update appointment status
router.patch("/appointments/:id/status", authenticateToken, async (req, res) => {
  try {
    // Check if user is a doctor
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Access denied: Doctor only' });
    }

    const { status } = req.body;
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) {
      return res.status(404).json({ message: "Doctor profile not found" });
    }

    const appointment = await Appointment.findOne({
      _id: req.params.id,
      doctorId: doctor._id,
    });

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    appointment.status = status;
    await appointment.save();

    // Populate the appointment details
    await appointment.populate([
      {
        path: "patientId",
        select: "name email phoneNumber profilePhoto"
      },
      {
        path: "doctorId",
        populate: [
          { path: "userId", select: "name email" },
          { path: "department", select: "name" }
        ]
      }
    ]);

    res.json({
      message: "Appointment status updated successfully",
      appointment,
    });
  } catch (error) {
    console.error("Error updating appointment status:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get doctor statistics
router.get("/stats/overview", authenticateToken, async (req, res) => {
  try {
    // Check if user is a doctor
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Access denied: Doctor only' });
    }

    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) {
      return res.status(404).json({ message: "Doctor profile not found" });
    }

    const stats = await Promise.all([
      Appointment.countDocuments({ doctorId: doctor._id, status: "pending" }),
      Appointment.countDocuments({ doctorId: doctor._id, status: "confirmed" }),
      Appointment.countDocuments({ doctorId: doctor._id, status: "completed" }),
      Appointment.countDocuments({ doctorId: doctor._id, status: "cancelled" }),
      Prescription.countDocuments({ doctorId: doctor._id, status: "active" }),
      Prescription.countDocuments({ doctorId: doctor._id, status: "completed" })
    ]);

    res.json({
      pendingAppointments: stats[0],
      confirmedAppointments: stats[1],
      completedAppointments: stats[2],
      cancelledAppointments: stats[3],
      activePrescriptions: stats[4],
      completedPrescriptions: stats[5]
    });
  } catch (error) {
    console.error("Error fetching doctor statistics:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get doctor by ID
router.get("/:id", async (req, res) => {
  try {
    console.log(`Fetching doctor with ID: ${req.params.id}`);
    const doctor = await Doctor.findById(req.params.id)
      .populate({
        path: "userId",
        select: "name email profilePhoto phoneNumber"
      })
      .populate({
        path: "department",
        select: "name description"
      })
      .lean();

    if (!doctor) {
      console.log("Doctor not found");
      return res.status(404).json({ message: "Doctor not found" });
    }

    console.log("Doctor found:", doctor.userId?.name);
    res.json(doctor);
  } catch (error) {
    console.error("Error fetching doctor:", error);
    res.status(500).json({ message: "Error fetching doctor", error: error.message });
  }
});

// Update doctor profile
router.put("/:id/profile", authenticateToken, isAdmin, async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    // Update doctor fields
    if (req.body.specialization)
      doctor.specialization = req.body.specialization;
    if (req.body.department) doctor.department = req.body.department;
    if (req.body.experience) doctor.experience = req.body.experience;

    // Update user fields if provided
    if (req.body.userId && doctor.userId) {
      const user = await User.findById(doctor.userId);
      if (user) {
        if (req.body.userId.name) user.name = req.body.userId.name;
        if (req.body.userId.email) user.email = req.body.userId.email;
        await user.save();
      }
    }

    await doctor.save();

    // Fetch the updated doctor with populated fields
    const updatedDoctor = await Doctor.findById(doctor._id)
      .populate({
        path: "userId",
        select: "name email profilePhoto phoneNumber",
      })
      .populate("department")
      .lean();

    res.json(updatedDoctor);
  } catch (error) {
    console.error("Error updating doctor profile:", error);
    res
      .status(500)
      .json({ message: "Error updating doctor profile", error: error.message });
  }
});

// Approve/reject doctor (admin only)
router.patch("/:id/approval", authenticateToken, isAdmin, async (req, res) => {
  try {
    const { isApproved } = req.body;
    const doctor = await Doctor.findById(req.params.id);

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    doctor.isApproved = isApproved;
    await doctor.save();

    res.json({
      message: "Doctor approval status updated successfully",
      doctor,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Update doctor status (admin only)
router.put("/:id", authenticateToken, isAdmin, async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    doctor.status = req.body.status;
    await doctor.save();

    res.json(doctor);
  } catch (error) {
    console.error("Error updating doctor status:", error);
    res
      .status(500)
      .json({ message: "Error updating doctor status", error: error.message });
  }
});

// Delete doctor (admin only)
router.delete("/:id", authenticateToken, isAdmin, async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    // Delete the doctor's user account if it exists
    if (doctor.userId) {
      await User.findByIdAndDelete(doctor.userId);
    }

    // Delete the doctor
    await Doctor.findByIdAndDelete(req.params.id);

    res.json({ message: "Doctor deleted successfully" });
  } catch (error) {
    console.error("Error deleting doctor:", error);
    res
      .status(500)
      .json({ message: "Error deleting doctor", error: error.message });
  }
});

// Complete appointment with optional prescription
router.patch(
  "/appointments/:id/complete",
  authenticateToken,
  async (req, res) => {
    try {
      const doctor = await Doctor.findOne({ userId: req.user._id });
      if (!doctor) {
        return res.status(404).json({ message: "Doctor profile not found" });
      }

      const appointment = await Appointment.findOne({
        _id: req.params.id,
        doctorId: doctor._id,
        status: "confirmed",
      });

      if (!appointment) {
        return res
          .status(404)
          .json({
            message: "Appointment not found or not in confirmed status",
          });
      }

      // Update appointment status
      appointment.status = "completed";
      await appointment.save();

      // Create prescription if provided
      let prescription = null;
      if (req.body.prescription) {
        const { diagnosis, medicines, tests, notes, followUpDate } =
          req.body.prescription;

        prescription = new Prescription({
          appointmentId: appointment._id,
          patientId: appointment.patientId,
          doctorId: doctor._id,
          diagnosis,
          medicines: medicines || [],
          tests: tests || [],
          notes: notes || "",
          followUpDate,
        });

        await prescription.save();
      }

      // Populate the appointment data
      await appointment.populate([
        {
          path: "doctorId",
          populate: { path: "userId", select: "name email" },
        },
        { path: "patientId", select: "name email" },
      ]);

      res.json({
        message: "Appointment completed successfully",
        appointment,
        prescription,
      });
    } catch (error) {
      console.error("Error completing appointment:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }
);

// Get available time slots for a doctor
router.get('/:id/available-slots', async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ message: 'Date is required' });
    }

    const requestDate = new Date(date);
    const dayOfWeek = requestDate.getDay();

    // Check if date is in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (requestDate < today) {
      return res.json({ 
        availableSlots: [], 
        message: 'Cannot book appointments for past dates' 
      });
    }

    // Get doctor with availability
    const doctor = await Doctor.findById(id);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    // Check if doctor is available on this day
    const dayAvailability = doctor.availability.find(a => a.dayOfWeek === dayOfWeek);
    if (!dayAvailability || !dayAvailability.isAvailable) {
      return res.json({ 
        availableSlots: [], 
        message: 'Doctor is not available on this day' 
      });
    }

    // Generate time slots based on doctor's availability
    const startTime = dayAvailability.startTime;
    const endTime = dayAvailability.endTime;
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    let timeSlots = [];
    let currentSlot = new Date(requestDate);
    currentSlot.setHours(startHour, startMinute, 0);
    const endSlot = new Date(requestDate);
    endSlot.setHours(endHour, endMinute, 0);

    // Generate 30-minute slots
    while (currentSlot < endSlot) {
      timeSlots.push(format(currentSlot, 'HH:mm'));
      currentSlot.setMinutes(currentSlot.getMinutes() + 30);
    }

    // Get booked appointments for the date
    const bookedAppointments = await Appointment.find({
      doctorId: id,
      date: {
        $gte: startOfDay(requestDate),
        $lte: endOfDay(requestDate)
      },
      status: { $nin: ['cancelled'] }
    });

    // Filter out booked slots
    const bookedSlots = bookedAppointments.map(apt => apt.timeSlot);
    const availableSlots = timeSlots.filter(slot => !bookedSlots.includes(slot));

    // If it's today, filter out past time slots
    if (format(requestDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')) {
      const now = new Date();
      const availableSlotsForToday = availableSlots.filter(slot => {
        const [slotHour, slotMinute] = slot.split(':').map(Number);
        const slotTime = new Date();
        slotTime.setHours(slotHour, slotMinute, 0);
        return slotTime > now;
      });
      
      return res.json({
        availableSlots: availableSlotsForToday,
        message: availableSlotsForToday.length ? null : 'No available slots remaining for today'
      });
    }

    res.json({ 
      availableSlots,
      message: availableSlots.length ? null : 'No available slots for this date'
    });
  } catch (error) {
    console.error('Error getting available slots:', error);
    res.status(500).json({ message: 'Error getting available slots', error: error.message });
  }
});

module.exports = router;
