const mongoose = require('mongoose');
require('dotenv').config({ path: 'backend/.env' });
require('../models/Airport');
const Flight = require('../models/Flight');
const FlightSchedule = require('../models/FlightSchedule');
const FlightInstance = require('../models/FlightInstance');
const AircraftLayout = require('../models/AircraftLayout');

const parseKolkataDateTime = (dateStr, timeStr) => {
  return new Date(`${dateStr}T${timeStr}:00+05:30`);
};

// Default departure and arrival times for flights if none configured
const DEFAULT_TIMES = {
  'SK-101': { dep: '08:00', arr: '09:15' },
  'SK-204': { dep: '10:30', arr: '12:45' },
  'SK-309': { dep: '14:00', arr: '16:45' },
  'SK-412': { dep: '18:00', arr: '19:30' },
  'SK-501': { dep: '07:15', arr: '08:45' },
  'SB-101': { dep: '11:00', arr: '16:30' },
  'KK-009': { dep: '15:30', arr: '21:00' },
  'AA-101': { dep: '09:45', arr: '12:00' }
};

async function syncAll() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB Atlas');

    const flights = await Flight.find().populate('originAirportId destinationAirportId aircraftLayoutId');
    console.log(`Found ${flights.length} flights in catalog`);

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    for (const flight of flights) {
      const code = flight.flightNumber || flight.flightCode;
      const def = DEFAULT_TIMES[code] || { dep: '10:00', arr: '12:30' };

      // Ensure active Daily schedule
      let schedule = await FlightSchedule.findOne({ flightId: flight._id, active: true });
      if (!schedule) {
        console.log(`Creating daily schedule for ${code}...`);
        schedule = await FlightSchedule.create({
          flightId: flight._id,
          scheduleType: 'DAILY',
          operatingDays: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
          departureTime: def.dep,
          arrivalTime: def.arr,
          adultFare: flight.baseFare || 3500,
          childFare: Math.round((flight.baseFare || 3500) * 0.75),
          status: 'ON_TIME',
          active: true,
          timezone: 'Asia/Kolkata',
          startDate: today,
          endDate: new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000)
        });
      }

      const depTime = schedule.departureTime || def.dep;
      const arrTime = schedule.arrivalTime || def.arr;
      const adultFare = flight.baseFare || schedule.adultFare || 3500;
      const childFare = Math.round(adultFare * 0.75);
      const capacity =
        flight.totalCapacity ||
        flight.capacity ||
        flight.aircraftLayoutId?.totalCapacity ||
        180;

      // Generate 60 days of instances
      let createdCount = 0;
      for (let i = 0; i < 60; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];

        const depDT = parseKolkataDateTime(dateStr, depTime);
        let arrDT = parseKolkataDateTime(dateStr, arrTime);
        if (arrDT <= depDT) {
          arrDT = new Date(arrDT.getTime() + 24 * 60 * 60 * 1000);
        }

        const existing = await FlightInstance.findOne({
          flightId: flight._id,
          departureDateTime: depDT
        });

        if (!existing) {
          await FlightInstance.create({
            flightId: flight._id,
            scheduleId: schedule._id,
            travelDate: d,
            departureDateTime: depDT,
            arrivalDateTime: arrDT,
            adultFare,
            childFare,
            capacity,
            bookedCount: 0,
            status: 'SCHEDULED'
          });
          createdCount++;
        }
      }

      const totalInstances = await FlightInstance.countDocuments({ flightId: flight._id });
      console.log(`Flight ${code}: added ${createdCount} instances (Total in DB: ${totalInstances})`);
    }

    console.log('Synchronization completed successfully!');
  } catch (err) {
    console.error('Sync error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

syncAll();
