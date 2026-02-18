const express = require('express');
const router = express.Router();
const Review = require('../models/review.model');
const Appointment = require('../models/appointment.model');
const { authenticateToken } = require('../middleware/auth');

// Create review (patient only, for completed appointment)
router.post('/', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'patient') {
      return res.status(403).json({ message: 'Only patients can submit reviews' });
    }
    const { appointmentId, rating, comment } = req.body;
    if (!appointmentId || !rating) {
      return res.status(400).json({ message: 'appointmentId and rating are required' });
    }
    const appointment = await Appointment.findById(appointmentId).lean();
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    if (String(appointment.patientId) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to review this appointment' });
    }
    if (appointment.status !== 'completed') {
      return res.status(400).json({ message: 'Only completed appointments can be reviewed' });
    }
    const exists = await Review.findOne({ appointmentId });
    if (exists) {
      return res.status(400).json({ message: 'Review already submitted for this appointment' });
    }
    const review = new Review({
      appointmentId,
      doctorId: appointment.doctorId,
      patientId: appointment.patientId,
      rating,
      comment: comment || ''
    });
    await review.save();
    res.status(201).json({ message: 'Review submitted', review });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get reviews for a doctor
router.get('/doctor/:id', async (req, res) => {
  try {
    const items = await Review.find({ doctorId: req.params.id }).sort({ createdAt: -1 }).lean();
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching reviews', error: error.message });
  }
});

// Update a review (author patient only)
router.patch('/:id', authenticateToken, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    const isOwner = String(review.patientId) === String(req.user._id);
    if (!isOwner) {
      return res.status(403).json({ message: 'Only the author can update this review' });
    }
    if (req.body.rating !== undefined) review.rating = req.body.rating;
    if (req.body.comment !== undefined) review.comment = req.body.comment;
    await review.save();
    res.json({ message: 'Review updated', review });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete a review (author patient, admin, or the doctor involved)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    const isOwner = String(review.patientId) === String(req.user._id);
    const isAdmin = req.user.role === 'admin';
    let isDoctorOfReview = false;
    if (req.user.role === 'doctor') {
      const Doctor = require('../models/doctor.model');
      const doctorDoc = await Doctor.findOne({ userId: req.user._id }).lean();
      if (doctorDoc && String(doctorDoc._id) === String(review.doctorId)) {
        isDoctorOfReview = true;
      }
    }
    if (!isOwner && !isAdmin && !isDoctorOfReview) {
      return res.status(403).json({ message: 'Not authorized to delete this review' });
    }
    await review.deleteOne();
    res.json({ message: 'Review deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
