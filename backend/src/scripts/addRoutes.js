/**
 * Skynexa - Add Missing Routes Script
 * Adds MAA↔BLR, MAA↔BOM, DEL↔BLR routes for comprehensive demo coverage
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');

const Flight = require('../models/Flight');
const FlightSchedule = require('../models/FlightSchedule');
const FlightInstance = require('../models/FlightInstance');
const AircraftLayout = require('../models/AircraftLayout');
const Airport = require('../models/Airport');
const User = require('../models/User');

const addRoutes = async () => {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI, { dbName: 'skynexa' });
    console.log('Connected.');

    const airports = await Airport.find({});
    const airportMap = {};
    airports.forEach((a) => (airportMap[a.code] = a));

    const layouts = await AircraftLayout.find({});
    const layoutA = layouts.find((l) => l.type === '3-3');
    const layoutB = layouts.find((l) => l.type === '2-2');

    const superAdmin = await User.findOne({ role: 'SUPER_ADMIN' });

    const newFlights = [
      {
        flightCode: 'SK-101',
        origin: 'MAA',
        destination: 'BLR',
        layout: layoutA,
        capacity: 180,
        days: [0, 1, 2, 3, 4, 5, 6],
        departureTime: '08:30',
        arrivalTime: '09:35',
        offset: 0,
        adultFare: 3500,
        childFare: 2800
      },
      {
        flightCode: 'SK-102',
        origin: 'BLR',
        destination: 'MAA',
        layout: layoutA,
        capacity: 180,
        days: [0, 1, 2, 3, 4, 5, 6],
        departureTime: '12:00',
        arrivalTime: '13:05',
        offset: 0,
        adultFare: 3200,
        childFare: 2600
      },
      {
        flightCode: 'SK-201',
        origin: 'MAA',
        destination: 'DEL',
        layout: layoutA,
        capacity: 180,
        days: [0, 1, 2, 3, 4, 5, 6],
        departureTime: '06:00',
        arrivalTime: '08:45',
        offset: 0,
        adultFare: 5500,
        childFare: 4200
      },
      {
        flightCode: 'SK-202',
        origin: 'DEL',
        destination: 'MAA',
        layout: layoutA,
        capacity: 180,
        days: [0, 1, 2, 3, 4, 5, 6],
        departureTime: '18:00',
        arrivalTime: '20:45',
        offset: 0,
        adultFare: 5800,
        childFare: 4400
      },
      {
        flightCode: 'SK-301',
        origin: 'MAA',
        destination: 'BOM',
        layout: layoutA,
        capacity: 180,
        days: [0, 1, 2, 3, 4, 5, 6],
        departureTime: '10:30',
        arrivalTime: '12:40',
        offset: 0,
        adultFare: 4200,
        childFare: 3300
      },
      {
        flightCode: 'SK-302',
        origin: 'BOM',
        destination: 'MAA',
        layout: layoutA,
        capacity: 180,
        days: [0, 1, 2, 3, 4, 5, 6],
        departureTime: '14:00',
        arrivalTime: '16:10',
        offset: 0,
        adultFare: 4000,
        childFare: 3100
      },
      {
        flightCode: 'SK-401',
        origin: 'BLR',
        destination: 'DEL',
        layout: layoutB,
        capacity: 80,
        days: [0, 1, 2, 3, 4, 5, 6],
        departureTime: '07:15',
        arrivalTime: '10:00',
        offset: 0,
        adultFare: 4800,
        childFare: 3700
      },
      {
        flightCode: 'SK-402',
        origin: 'DEL',
        destination: 'BLR',
        layout: layoutB,
        capacity: 80,
        days: [0, 1, 2, 3, 4, 5, 6],
        departureTime: '15:30',
        arrivalTime: '18:15',
        offset: 0,
        adultFare: 4600,
        childFare: 3500
      },
      {
        flightCode: 'SK-501',
        origin: 'HYD',
        destination: 'COK',
        layout: layoutB,
        capacity: 80,
        days: [0, 1, 3, 5],
        departureTime: '12:00',
        arrivalTime: '13:40',
        offset: 0,
        adultFare: 3200,
        childFare: 2400
      }
    ];

    let created = 0;
    for (const fDef of newFlights) {
      const existing = await Flight.findOne({ flightCode: fDef.flightCode });
      if (existing) {
        console.log(`Flight ${fDef.flightCode} already exists, skipping.`);
        continue;
      }

      const flight = await Flight.create({
        flightCode: fDef.flightCode,
        originAirportId: airportMap[fDef.origin]._id,
        destinationAirportId: airportMap[fDef.destination]._id,
        aircraftLayoutId: fDef.layout._id,
        capacity: fDef.capacity,
        active: true,
        createdBy: superAdmin._id
      });

      const schedules = [];
      for (const d of fDef.days) {
        const schedule = await FlightSchedule.create({
          flightId: flight._id,
          dayOfWeek: d,
          departureTime: fDef.departureTime,
          arrivalTime: fDef.arrivalTime,
          arrivalDayOffset: fDef.offset,
          adultFare: fDef.adultFare,
          childFare: fDef.childFare,
          active: true
        });
        schedules.push(schedule);
      }

      // Generate instances for next 60 days
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      let instanceCount = 0;

      for (let i = 0; i < 60; i++) {
        const travelDate = new Date(today);
        travelDate.setDate(today.getDate() + i);
        const dow = travelDate.getDay();

        const matchingSchedule = schedules.find((s) => s.dayOfWeek === dow);
        if (!matchingSchedule) continue;

        const [depH, depM] = matchingSchedule.departureTime.split(':').map(Number);
        const [arrH, arrM] = matchingSchedule.arrivalTime.split(':').map(Number);

        const depDateTime = new Date(travelDate);
        depDateTime.setHours(depH, depM, 0, 0);

        const arrDateTime = new Date(travelDate);
        arrDateTime.setDate(arrDateTime.getDate() + matchingSchedule.arrivalDayOffset);
        arrDateTime.setHours(arrH, arrM, 0, 0);

        try {
          await FlightInstance.create({
            flightId: flight._id,
            scheduleId: matchingSchedule._id,
            travelDate,
            departureDateTime: depDateTime,
            arrivalDateTime: arrDateTime,
            adultFare: matchingSchedule.adultFare,
            childFare: matchingSchedule.childFare,
            capacity: fDef.capacity,
            bookedCount: 0,
            status: 'SCHEDULED'
          });
          instanceCount++;
        } catch (e) {
          if (e.code !== 11000) throw e;
        }
      }

      console.log(`✅ Created flight ${fDef.flightCode} (${fDef.origin}→${fDef.destination}) with ${instanceCount} instances`);
      created++;
    }

    console.log(`\n✈️  Added ${created} new flight routes successfully!`);
    console.log('\nAvailable routes now:');
    const allFlights = await Flight.find({}).populate('originAirportId', 'code').populate('destinationAirportId', 'code');
    allFlights.forEach((f) => {
      console.log(`  ${f.flightCode}: ${f.originAirportId.code} → ${f.destinationAirportId.code}`);
    });

    await mongoose.connection.close();
    console.log('\nDone.');
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
};

addRoutes();
