/**
 * Seed script: Comprehensive Airports + Fresh Flights from Today for Next 60 Days
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');

const Airport = require('../models/Airport');
const AircraftLayout = require('../models/AircraftLayout');
const Flight = require('../models/Flight');
const FlightSchedule = require('../models/FlightSchedule');
const FlightInstance = require('../models/FlightInstance');
const User = require('../models/User');

const ALL_AIRPORTS = [
  // Major Indian Metro & Hub Airports
  { code: 'DEL', name: 'Indira Gandhi International Airport', city: 'New Delhi', country: 'India', timezone: 'Asia/Kolkata' },
  { code: 'BOM', name: 'Chhatrapati Shivaji Maharaj International Airport', city: 'Mumbai', country: 'India', timezone: 'Asia/Kolkata' },
  { code: 'BLR', name: 'Kempegowda International Airport', city: 'Bengaluru', country: 'India', timezone: 'Asia/Kolkata' },
  { code: 'MAA', name: 'Chennai International Airport', city: 'Chennai', country: 'India', timezone: 'Asia/Kolkata' },
  { code: 'HYD', name: 'Rajiv Gandhi International Airport', city: 'Hyderabad', country: 'India', timezone: 'Asia/Kolkata' },
  { code: 'CCU', name: 'Netaji Subhash Chandra Bose International Airport', city: 'Kolkata', country: 'India', timezone: 'Asia/Kolkata' },
  { code: 'COK', name: 'Cochin International Airport', city: 'Kochi', country: 'India', timezone: 'Asia/Kolkata' },
  { code: 'GOI', name: 'Dabolim Airport (Goa International)', city: 'Goa', country: 'India', timezone: 'Asia/Kolkata' },
  { code: 'GOX', name: 'Manohar International Airport (Mopa)', city: 'North Goa', country: 'India', timezone: 'Asia/Kolkata' },
  { code: 'AMD', name: 'Sardar Vallabhbhai Patel International Airport', city: 'Ahmedabad', country: 'India', timezone: 'Asia/Kolkata' },
  { code: 'PNQ', name: 'Pune International Airport', city: 'Pune', country: 'India', timezone: 'Asia/Kolkata' },
  { code: 'JAI', name: 'Jaipur International Airport', city: 'Jaipur', country: 'India', timezone: 'Asia/Kolkata' },
  { code: 'LKO', name: 'Chaudhary Charan Singh International Airport', city: 'Lucknow', country: 'India', timezone: 'Asia/Kolkata' },
  { code: 'TRV', name: 'Thiruvananthapuram International Airport', city: 'Thiruvananthapuram', country: 'India', timezone: 'Asia/Kolkata' },
  { code: 'GAU', name: 'Lokpriya Gopinath Bordoloi International Airport', city: 'Guwahati', country: 'India', timezone: 'Asia/Kolkata' },
  { code: 'IXB', name: 'Bagdogra International Airport', city: 'Siliguri', country: 'India', timezone: 'Asia/Kolkata' },
  { code: 'IXC', name: 'Shaheed Bhagat Singh International Airport', city: 'Chandigarh', country: 'India', timezone: 'Asia/Kolkata' },
  { code: 'VNS', name: 'Lal Bahadur Shastri International Airport', city: 'Varanasi', country: 'India', timezone: 'Asia/Kolkata' },
  { code: 'BBI', name: 'Biju Patnaik International Airport', city: 'Bhubaneswar', country: 'India', timezone: 'Asia/Kolkata' },
  { code: 'PAT', name: 'Jay Prakash Narayan International Airport', city: 'Patna', country: 'India', timezone: 'Asia/Kolkata' },
  { code: 'SXR', name: 'Sheikh ul-Alam International Airport', city: 'Srinagar', country: 'India', timezone: 'Asia/Kolkata' },
  { code: 'IXZ', name: 'Veer Savarkar International Airport', city: 'Port Blair', country: 'India', timezone: 'Asia/Kolkata' },

  // Key International Destinations
  { code: 'DXB', name: 'Dubai International Airport', city: 'Dubai', country: 'United Arab Emirates', timezone: 'Asia/Dubai' },
  { code: 'SIN', name: 'Singapore Changi Airport', city: 'Singapore', country: 'Singapore', timezone: 'Asia/Singapore' },
  { code: 'LHR', name: 'London Heathrow Airport', city: 'London', country: 'United Kingdom', timezone: 'Europe/London' },
  { code: 'JFK', name: 'John F. Kennedy International Airport', city: 'New York', country: 'United States', timezone: 'America/New_York' },
  { code: 'BKK', name: 'Suvarnabhumi Airport', city: 'Bangkok', country: 'Thailand', timezone: 'Asia/Bangkok' },
  { code: 'DOH', name: 'Hamad International Airport', city: 'Doha', country: 'Qatar', timezone: 'Asia/Qatar' },
  { code: 'KUL', name: 'Kuala Lumpur International Airport', city: 'Kuala Lumpur', country: 'Malaysia', timezone: 'Asia/Kuala_Lumpur' },
  { code: 'CDG', name: 'Paris Charles de Gaulle Airport', city: 'Paris', country: 'France', timezone: 'Europe/Paris' }
];

async function run() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, { dbName: 'skynexa' });
    console.log('Connected.');

    // 1. Upsert all airports
    console.log(`Upserting ${ALL_AIRPORTS.length} airports...`);
    for (const a of ALL_AIRPORTS) {
      await Airport.findOneAndUpdate(
        { code: a.code },
        { $set: a },
        { upsert: true, new: true }
      );
    }
    console.log('All airports registered.');

    const airports = await Airport.find({});
    const airportMap = {};
    airports.forEach((a) => (airportMap[a.code] = a));

    // 2. Ensure Aircraft Layouts exist
    let layoutA = await AircraftLayout.findOne({ type: '3-3' });
    if (!layoutA) {
      const layoutASeats = [];
      for (let r = 1; r <= 30; r++) {
        layoutASeats.push({ seatNumber: `${r}A`, row: r, column: 'A', position: 'WINDOW', active: true });
        layoutASeats.push({ seatNumber: `${r}B`, row: r, column: 'B', position: 'MIDDLE', active: true });
        layoutASeats.push({ seatNumber: `${r}C`, row: r, column: 'C', position: 'AISLE', active: true });
        layoutASeats.push({ seatNumber: `${r}D`, row: r, column: 'D', position: 'AISLE', active: true });
        layoutASeats.push({ seatNumber: `${r}E`, row: r, column: 'E', position: 'MIDDLE', active: true });
        layoutASeats.push({ seatNumber: `${r}F`, row: r, column: 'F', position: 'WINDOW', active: true });
      }
      layoutA = await AircraftLayout.create({
        name: 'Airbus A320neo (3-3 Standard)',
        type: '3-3',
        rows: 30,
        seatsPerRow: 6,
        seatDefinitions: layoutASeats
      });
    }

    let layoutB = await AircraftLayout.findOne({ type: '2-2' });
    if (!layoutB) {
      const layoutBSeats = [];
      for (let r = 1; r <= 20; r++) {
        layoutBSeats.push({ seatNumber: `${r}A`, row: r, column: 'A', position: 'WINDOW', active: true });
        layoutBSeats.push({ seatNumber: `${r}B`, row: r, column: 'B', position: 'AISLE', active: true });
        layoutBSeats.push({ seatNumber: `${r}C`, row: r, column: 'C', position: 'AISLE', active: true });
        layoutBSeats.push({ seatNumber: `${r}D`, row: r, column: 'D', position: 'WINDOW', active: true });
      }
      layoutB = await AircraftLayout.create({
        name: 'Embraer E195-E2 (2-2 Regional)',
        type: '2-2',
        rows: 20,
        seatsPerRow: 4,
        seatDefinitions: layoutBSeats
      });
    }

    let superAdmin = await User.findOne({ role: 'SUPER_ADMIN' });
    if (!superAdmin) {
      superAdmin = await User.create({
        username: 'superadmin',
        email: 'superadmin@skynexa.com',
        passwordHash: 'SuperAdmin@2026',
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
        firstName: 'Super',
        lastName: 'Admin'
      });
    }

    const scheduleAdmin = await User.findOne({ role: 'SCHEDULE_ADMIN' });
    if (!scheduleAdmin) {
      await User.create({
        username: 'scheduleadmin',
        email: 'scheduleadmin@skynexa.com',
        passwordHash: 'ScheduleAdmin@2026',
        role: 'SCHEDULE_ADMIN',
        status: 'ACTIVE',
        firstName: 'Schedule',
        lastName: 'Manager'
      });
    }

    const marketingAdmin = await User.findOne({ role: 'MARKETING_ADMIN' });
    if (!marketingAdmin) {
      await User.create({
        username: 'marketingadmin',
        email: 'marketingadmin@skynexa.com',
        passwordHash: 'MarketingAdmin@2026',
        role: 'MARKETING_ADMIN',
        status: 'ACTIVE',
        firstName: 'Marketing',
        lastName: 'Director'
      });
    }

    const adminId = superAdmin ? superAdmin._id : null;

    // 3. Define extensive flight routes connecting major cities
    const routeDefs = [
      // DEL - BOM (Delhi - Mumbai)
      { code: 'SK-101', orig: 'DEL', dest: 'BOM', dep: '06:00', arr: '08:15', fare: 4800, child: 3600, layout: layoutA },
      { code: 'SK-103', orig: 'DEL', dest: 'BOM', dep: '11:30', arr: '13:45', fare: 5200, child: 3900, layout: layoutA },
      { code: 'SK-105', orig: 'DEL', dest: 'BOM', dep: '18:00', arr: '20:15', fare: 5900, child: 4400, layout: layoutA },
      // BOM - DEL
      { code: 'SK-102', orig: 'BOM', dest: 'DEL', dep: '07:00', arr: '09:15', fare: 4900, child: 3700, layout: layoutA },
      { code: 'SK-104', orig: 'BOM', dest: 'DEL', dep: '14:00', arr: '16:15', fare: 5300, child: 4000, layout: layoutA },
      { code: 'SK-106', orig: 'BOM', dest: 'DEL', dep: '21:00', arr: '23:15', fare: 4600, child: 3500, layout: layoutA },

      // DEL - BLR (Delhi - Bengaluru)
      { code: 'SK-201', orig: 'DEL', dest: 'BLR', dep: '06:45', arr: '09:30', fare: 5800, child: 4300, layout: layoutA },
      { code: 'SK-203', orig: 'DEL', dest: 'BLR', dep: '17:15', arr: '20:00', fare: 6200, child: 4600, layout: layoutA },
      // BLR - DEL
      { code: 'SK-202', orig: 'BLR', dest: 'DEL', dep: '08:00', arr: '10:45', fare: 5900, child: 4400, layout: layoutA },
      { code: 'SK-204', orig: 'BLR', dest: 'DEL', dep: '19:30', arr: '22:15', fare: 6100, child: 4500, layout: layoutA },

      // MAA - BLR (Chennai - Bengaluru)
      { code: 'SK-301', orig: 'MAA', dest: 'BLR', dep: '08:30', arr: '09:35', fare: 2800, child: 2100, layout: layoutA },
      { code: 'SK-303', orig: 'MAA', dest: 'BLR', dep: '18:45', arr: '19:50', fare: 3200, child: 2400, layout: layoutB },
      // BLR - MAA
      { code: 'SK-302', orig: 'BLR', dest: 'MAA', dep: '11:00', arr: '12:05', fare: 2900, child: 2200, layout: layoutA },
      { code: 'SK-304', orig: 'BLR', dest: 'MAA', dep: '20:30', arr: '21:35', fare: 3100, child: 2300, layout: layoutB },

      // MAA - DEL (Chennai - Delhi)
      { code: 'SK-401', orig: 'MAA', dest: 'DEL', dep: '06:30', arr: '09:15', fare: 5500, child: 4100, layout: layoutA },
      // DEL - MAA
      { code: 'SK-402', orig: 'DEL', dest: 'MAA', dep: '17:45', arr: '20:30', fare: 5700, child: 4200, layout: layoutA },

      // BOM - MAA (Mumbai - Chennai)
      { code: 'SK-501', orig: 'BOM', dest: 'MAA', dep: '09:15', arr: '11:10', fare: 4200, child: 3100, layout: layoutA },
      // MAA - BOM
      { code: 'SK-502', orig: 'MAA', dest: 'BOM', dep: '14:30', arr: '16:30', fare: 4400, child: 3300, layout: layoutA },

      // HYD - DEL (Hyderabad - Delhi)
      { code: 'SK-601', orig: 'HYD', dest: 'DEL', dep: '07:30', arr: '09:40', fare: 4600, child: 3400, layout: layoutA },
      // DEL - HYD
      { code: 'SK-602', orig: 'DEL', dest: 'HYD', dep: '16:00', arr: '18:10', fare: 4800, child: 3600, layout: layoutA },

      // BLR - HYD
      { code: 'SK-701', orig: 'BLR', dest: 'HYD', dep: '10:15', arr: '11:25', fare: 2600, child: 1950, layout: layoutB },
      // HYD - BLR
      { code: 'SK-702', orig: 'HYD', dest: 'BLR', dep: '15:45', arr: '16:55', fare: 2700, child: 2000, layout: layoutB },

      // BOM - GOI (Mumbai - Goa)
      { code: 'SK-801', orig: 'BOM', dest: 'GOI', dep: '11:00', arr: '12:10', fare: 3500, child: 2600, layout: layoutA },
      // GOI - BOM
      { code: 'SK-802', orig: 'GOI', dest: 'BOM', dep: '16:30', arr: '17:40', fare: 3600, child: 2700, layout: layoutA },

      // DEL - CCU (Delhi - Kolkata)
      { code: 'SK-901', orig: 'DEL', dest: 'CCU', dep: '08:00', arr: '10:15', fare: 4900, child: 3700, layout: layoutA },
      // CCU - DEL
      { code: 'SK-902', orig: 'CCU', dest: 'DEL', dep: '13:00', arr: '15:20', fare: 5100, child: 3800, layout: layoutA },

      // COK - BLR (Kochi - Bengaluru)
      { code: 'SK-951', orig: 'COK', dest: 'BLR', dep: '09:00', arr: '10:05', fare: 2400, child: 1800, layout: layoutB },
      // BLR - COK
      { code: 'SK-952', orig: 'BLR', dest: 'COK', dep: '14:00', arr: '15:05', fare: 2500, child: 1900, layout: layoutB },

      // International routes: DEL - DXB & BOM - DXB
      { code: 'SK-991', orig: 'DEL', dest: 'DXB', dep: '09:30', arr: '12:00', fare: 14500, child: 11000, layout: layoutA },
      { code: 'SK-992', orig: 'DXB', dest: 'DEL', dep: '15:00', arr: '20:15', fare: 15200, child: 11500, layout: layoutA },
      { code: 'SK-993', orig: 'BOM', dest: 'SIN', dep: '23:30', arr: '07:45', fare: 16800, child: 12600, layout: layoutA }
    ];

    console.log(`Setting up ${routeDefs.length} flight routes...`);
    const flightDocs = [];
    const scheduleDocs = [];

    for (const r of routeDefs) {
      const origAirport = airportMap[r.orig];
      const destAirport = airportMap[r.dest];
      if (!origAirport || !destAirport) {
        console.warn(`Airport not found: ${r.orig} or ${r.dest}`);
        continue;
      }

      // Upsert Flight
      let flight = await Flight.findOne({ flightCode: r.code });
      const computedFlightName = r.flightName || `Skynexa ${r.orig}-${r.dest} Express`;
      if (!flight) {
        flight = await Flight.create({
          flightName: computedFlightName,
          flightCode: r.code,
          originAirportId: origAirport._id,
          destinationAirportId: destAirport._id,
          aircraftLayoutId: r.layout._id,
          capacity: r.layout.type === '3-3' ? 180 : 80,
          active: true,
          createdBy: adminId
        });
      } else {
        if (!flight.flightName) flight.flightName = computedFlightName;
        flight.originAirportId = origAirport._id;
        flight.destinationAirportId = destAirport._id;
        flight.aircraftLayoutId = r.layout._id;
        flight.capacity = r.layout.type === '3-3' ? 180 : 80;
        flight.active = true;
        await flight.save();
      }
      flightDocs.push(flight);

      // Create/Update 7-day schedule for this flight
      for (let day = 0; day <= 6; day++) {
        let schedule = await FlightSchedule.findOne({ flightId: flight._id, dayOfWeek: day });
        if (!schedule) {
          schedule = await FlightSchedule.create({
            flightId: flight._id,
            dayOfWeek: day,
            departureTime: r.dep,
            arrivalTime: r.arr,
            arrivalDayOffset: 0,
            adultFare: r.fare,
            childFare: r.child,
            active: true
          });
        } else {
          schedule.departureTime = r.dep;
          schedule.arrivalTime = r.arr;
          schedule.adultFare = r.fare;
          schedule.childFare = r.child;
          schedule.active = true;
          await schedule.save();
        }
        scheduleDocs.push(schedule);
      }
    }

    console.log(`Flights and schedules ready. Total active flights: ${flightDocs.length}`);

    // 4. Remove all expired/past flight instances to ensure crisp fresh data from today onwards
    console.log('Clearing old instances and generating fresh instances from TODAY for next 60 days...');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Remove past instances
    await FlightInstance.deleteMany({ travelDate: { $lt: today } });

    // Fetch all existing upcoming instances in one single query
    const existingUpcoming = await FlightInstance.find({ travelDate: { $gte: today } }).select('flightId travelDate');
    const existingKeySet = new Set(
      existingUpcoming.map((e) => `${e.flightId.toString()}_${new Date(e.travelDate).toISOString().split('T')[0]}`)
    );

    // Generate fresh instances for next 60 days
    const instanceBatch = [];
    for (let dayOffset = 0; dayOffset < 60; dayOffset++) {
      const curDate = new Date(today);
      curDate.setDate(curDate.getDate() + dayOffset);
      const dayOfWeek = curDate.getDay();

      const travelDate = new Date(curDate);
      travelDate.setUTCHours(0, 0, 0, 0);
      const dateStr = travelDate.toISOString().split('T')[0];

      const matchingSchedules = scheduleDocs.filter((s) => s.dayOfWeek === dayOfWeek);

      for (const s of matchingSchedules) {
        const parentFlight = flightDocs.find((f) => f._id.toString() === s.flightId.toString());
        if (!parentFlight) continue;

        const key = `${parentFlight._id.toString()}_${dateStr}`;
        if (existingKeySet.has(key)) continue;

        const [depH, depM] = s.departureTime.split(':').map(Number);
        const [arrH, arrM] = s.arrivalTime.split(':').map(Number);

        const departureDateTime = new Date(curDate);
        departureDateTime.setHours(depH, depM, 0, 0);

        const arrivalDateTime = new Date(curDate);
        arrivalDateTime.setHours(arrH, arrM, 0, 0);
        if (arrH < depH) {
          arrivalDateTime.setDate(arrivalDateTime.getDate() + 1);
        }

        instanceBatch.push({
          flightId: parentFlight._id,
          scheduleId: s._id,
          travelDate,
          departureDateTime,
          arrivalDateTime,
          adultFare: s.adultFare,
          childFare: s.childFare,
          capacity: parentFlight.capacity,
          bookedCount: 0,
          status: 'SCHEDULED'
        });

        existingKeySet.add(key);
      }
    }

    if (instanceBatch.length > 0) {
      console.log(`Inserting ${instanceBatch.length} fresh flight instances...`);
      await FlightInstance.insertMany(instanceBatch, { ordered: false });
      console.log(`Inserted ${instanceBatch.length} fresh flight instances for the next 60 days.`);
    }

    const totalInstances = await FlightInstance.countDocuments({ travelDate: { $gte: today } });
    console.log(`Total upcoming fresh flight instances in DB: ${totalInstances}`);

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

run();
