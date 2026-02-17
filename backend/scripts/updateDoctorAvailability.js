const mongoose = require('mongoose');
require('dotenv').config();

const Doctor = require('../models/doctor.model');

const defaultAvailability = [
  { dayOfWeek: 0, startTime: '09:00', endTime: '17:00', isAvailable: true }, // Sunday
  { dayOfWeek: 1, startTime: '09:00', endTime: '17:00', isAvailable: true }, // Monday
  { dayOfWeek: 2, startTime: '09:00', endTime: '17:00', isAvailable: true }, // Tuesday
  { dayOfWeek: 3, startTime: '09:00', endTime: '17:00', isAvailable: true }, // Wednesday
  { dayOfWeek: 4, startTime: '09:00', endTime: '17:00', isAvailable: true }, // Thursday
  { dayOfWeek: 5, startTime: '09:00', endTime: '17:00', isAvailable: true }, // Friday
  { dayOfWeek: 6, startTime: '09:00', endTime: '17:00', isAvailable: true }  // Saturday
];

async function updateDoctors() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('Connected to MongoDB');

    const doctors = await Doctor.find({});
    console.log(`Found ${doctors.length} doctors`);

    for (const doctor of doctors) {
      // Preserve existing education data if it's an array
      if (!Array.isArray(doctor.education)) {
        const educationStr = doctor.education;
        doctor.education = [{
          degree: educationStr || 'MBBS',
          institution: 'Unknown Institution',
          year: new Date().getFullYear(),
          honors: ''
        }];
      }

      // Set availability if not present
      if (!doctor.availability || doctor.availability.length !== 7) {
        doctor.availability = defaultAvailability;
      }

      // Ensure license is set
      if (!doctor.license) {
        doctor.license = 'TBD-' + Math.random().toString(36).substring(7).toUpperCase();
      }

      // Set default consultation fee if not present
      if (!doctor.consultationFee) {
        doctor.consultationFee = 500;
      }

      // Set default experience if not present
      if (!doctor.experience) {
        doctor.experience = 0;
      }

      try {
        await doctor.save();
        console.log(`Updated doctor: ${doctor._id}`);
      } catch (error) {
        console.error(`Error updating doctor ${doctor._id}:`, error.message);
      }
    }

    console.log('All doctors updated successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error updating doctors:', error);
    process.exit(1);
  }
}

updateDoctors(); 