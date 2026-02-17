const mongoose = require('mongoose');

const educationSchema = new mongoose.Schema({
  degree: { type: String, required: true },
  institution: { type: String, required: true },
  year: { type: Number, required: true },
  honors: String
}, { _id: true });

const availabilitySchema = new mongoose.Schema({
  dayOfWeek: { type: Number, required: true, min: 0, max: 6 }, // 0 = Sunday, 6 = Saturday
  startTime: { type: String, required: true }, // Format: "HH:mm"
  endTime: { type: String, required: true }, // Format: "HH:mm"
  isAvailable: { type: Boolean, default: true }
}, { _id: false });

const doctorSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true
  },
  specialization: {
    type: String,
    required: true
  },
  experience: {
    type: Number,
    required: true,
    min: 0
  },
  education: {
    type: [educationSchema],
    required: true,
    validate: [arr => arr.length > 0, 'At least one education entry is required']
  },
  license: {
    type: String,
    required: true
  },
  consultationFee: {
    type: Number,
    required: true,
    min: 0
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'inactive'
  },
  availability: {
    type: [availabilitySchema],
    required: true,
    validate: [arr => arr.length === 7, 'Must have availability for all 7 days of the week']
  }
}, {
  timestamps: true
});

// Pre-save hook to set default availability if not provided
doctorSchema.pre('save', function(next) {
  if (!this.availability || this.availability.length === 0) {
    this.availability = [
      { dayOfWeek: 0, startTime: '09:00', endTime: '19:00', isAvailable: true }, // Sunday
      { dayOfWeek: 1, startTime: '09:00', endTime: '19:00', isAvailable: true }, // Monday
      { dayOfWeek: 2, startTime: '09:00', endTime: '19:00', isAvailable: true }, // Tuesday
      { dayOfWeek: 3, startTime: '09:00', endTime: '19:00', isAvailable: true }, // Wednesday
      { dayOfWeek: 4, startTime: '09:00', endTime: '19:00', isAvailable: true }, // Thursday
      { dayOfWeek: 5, startTime: '09:00', endTime: '19:00', isAvailable: true }, // Friday
      { dayOfWeek: 6, startTime: '09:00', endTime: '19:00', isAvailable: true }  // Saturday
    ];
  }
  next();
});

const Doctor = mongoose.model('Doctor', doctorSchema);

module.exports = Doctor; 