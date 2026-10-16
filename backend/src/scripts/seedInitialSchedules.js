const mongoose = require('mongoose');
const Flight = require('../models/Flight');
const FlightSchedule = require('../models/FlightSchedule');
const FlightInstance = require('../models/FlightInstance');
const User = require('../models/User');
require('dotenv').config();

async function seedInitialSchedules() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB Atlas...');

  const flights = await Flight.find({ active: true });
  console.log(`Found ${flights.length} active flights in catalog.`);

  let admin = await User.findOne({ role: 'SUPER_ADMIN' });
  if (!admin) {
    admin = await User.findOne({ role: 'SCHEDULE_ADMIN' });
  }

  for (const flight of flights) {
    // Check if schedule already exists
    let schedule = await FlightSchedule.findOne({ flightId: flight._id });
    const depTime = flight.departureDateTime
      ? new Date(flight.departureDateTime).toTimeString().slice(0, 5)
      : '10:00';
    const arrTime = flight.arrivalDateTime
      ? new Date(flight.arrivalDateTime).toTimeString().slice(0, 5)
      : '11:15';

    if (!schedule) {
      schedule = await FlightSchedule.create({
        flightId: flight._id,
        scheduleType: 'DAILY',
        operatingDays: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
        departureTime: depTime,
        arrivalTime: arrTime,
        startDate: new Date('2026-10-15'),
        endDate: new Date('2026-11-30'),
        adultFare: flight.baseFare || 3500,
        childFare: Math.round((flight.baseFare || 3500) * 0.75),
        status: 'ON_TIME',
        active: true,
        timezone: 'Asia/Kolkata',
        createdBy: admin ? admin._id : flight.createdBy,
        assignedAdmins: [admin ? admin._id : flight.createdBy]
      });
      console.log(`Created FlightSchedule for ${flight.flightNumber}`);
    }

    // Check if instance already exists
    const depDT = flight.departureDateTime || new Date('2026-11-01T10:00:00+05:30');
    const arrDT = flight.arrivalDateTime || new Date('2026-11-01T11:15:00+05:30');

    const existingInstance = await FlightInstance.findOne({
      flightId: flight._id,
      departureDateTime: depDT
    });

    if (!existingInstance) {
      const travelDate = new Date(depDT);
      travelDate.setUTCHours(0, 0, 0, 0);

      await FlightInstance.create({
        flightId: flight._id,
        scheduleId: schedule._id,
        travelDate,
        departureDateTime: depDT,
        arrivalDateTime: arrDT,
        adultFare: flight.baseFare || 3500,
        childFare: Math.round((flight.baseFare || 3500) * 0.75),
        capacity: flight.totalCapacity || flight.capacity || 180,
        bookedCount: 0,
        status: 'ON_TIME'
      });
      console.log(`Created FlightInstance for ${flight.flightNumber}`);
    }
  }

  const sCount = await FlightSchedule.countDocuments();
  const iCount = await FlightInstance.countDocuments();
  console.log(`Summary: ${sCount} schedules, ${iCount} instances in MongoDB Atlas.`);

  await mongoose.disconnect();
}

seedInitialSchedules()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('Error seeding schedules:', e);
    process.exit(1);
  });
