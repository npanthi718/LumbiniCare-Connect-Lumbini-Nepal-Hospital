const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

reviewSchema.index({ doctorId: 1, createdAt: -1 });
reviewSchema.index({ appointmentId: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
