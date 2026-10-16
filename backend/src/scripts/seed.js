require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Airport = require('../models/Airport');
const AircraftLayout = require('../models/AircraftLayout');
const Flight = require('../models/Flight');
const FlightSchedule = require('../models/FlightSchedule');
const FlightInstance = require('../models/FlightInstance');
const Booking = require('../models/Booking');
const BookingPassenger = require('../models/BookingPassenger');
const BookingSeat = require('../models/BookingSeat');
const Payment = require('../models/Payment');
const Offer = require('../models/Offer');
const SupportTicket = require('../models/SupportTicket');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');
const SearchEvent = require('../models/SearchEvent');

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(mongoUri, { dbName: 'skynexa' });
    console.log('Connected to MongoDB.');

    // 1. Clear existing collections
    console.log('Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      Airport.deleteMany({}),
      AircraftLayout.deleteMany({}),
      Flight.deleteMany({}),
      FlightSchedule.deleteMany({}),
      FlightInstance.deleteMany({}),
      Booking.deleteMany({}),
      BookingPassenger.deleteMany({}),
      BookingSeat.deleteMany({}),
      Payment.deleteMany({}),
      Offer.deleteMany({}),
      SupportTicket.deleteMany({}),
      Notification.deleteMany({}),
      AuditLog.deleteMany({}),
      SearchEvent.deleteMany({})
    ]);
    console.log('Existing collections cleared.');

    // 2. Create Aircraft Layouts
    console.log('Creating aircraft layouts...');

    // Layout A: 3-3 configuration (30 rows, 180 seats)
    // A=Window, B=Middle, C=Aisle, D=Aisle, E=Middle, F=Window
    const layoutASeats = [];
    for (let r = 1; r <= 30; r++) {
      layoutASeats.push({ seatNumber: `${r}A`, row: r, column: 'A', position: 'WINDOW', active: true });
      layoutASeats.push({ seatNumber: `${r}B`, row: r, column: 'B', position: 'MIDDLE', active: true });
      layoutASeats.push({ seatNumber: `${r}C`, row: r, column: 'C', position: 'AISLE', active: true });
      layoutASeats.push({ seatNumber: `${r}D`, row: r, column: 'D', position: 'AISLE', active: true });
      layoutASeats.push({ seatNumber: `${r}E`, row: r, column: 'E', position: 'MIDDLE', active: true });
      layoutASeats.push({ seatNumber: `${r}F`, row: r, column: 'F', position: 'WINDOW', active: true });
    }

    const layoutA = await AircraftLayout.create({
      name: 'Airbus A320 Standard (3-3)',
      type: '3-3',
      rows: 30,
      seatsPerRow: 6,
      seatDefinitions: layoutASeats
    });

    // Layout B: 2-2 configuration (20 rows, 80 seats)
    // A=Window, B=Aisle, C=Aisle, D=Window
    const layoutBSeats = [];
    for (let r = 1; r <= 20; r++) {
      layoutBSeats.push({ seatNumber: `${r}A`, row: r, column: 'A', position: 'WINDOW', active: true });
      layoutBSeats.push({ seatNumber: `${r}B`, row: r, column: 'B', position: 'AISLE', active: true });
      layoutBSeats.push({ seatNumber: `${r}C`, row: r, column: 'C', position: 'AISLE', active: true });
      layoutBSeats.push({ seatNumber: `${r}D`, row: r, column: 'D', position: 'WINDOW', active: true });
    }

    const layoutB = await AircraftLayout.create({
      name: 'Embraer E190 Regional (2-2)',
      type: '2-2',
      rows: 20,
      seatsPerRow: 4,
      seatDefinitions: layoutBSeats
    });

    console.log(`Created 2 aircraft layouts: ${layoutA.name} and ${layoutB.name}`);

    // 3. Create Airports
    console.log('Creating airports...');
    const airportData = [
      { code: 'MAA', name: 'Chennai International Airport', city: 'Chennai', country: 'India', timezone: 'Asia/Kolkata' },
      { code: 'BLR', name: 'Kempegowda International Airport', city: 'Bengaluru', country: 'India', timezone: 'Asia/Kolkata' },
      { code: 'DEL', name: 'Indira Gandhi International Airport', city: 'New Delhi', country: 'India', timezone: 'Asia/Kolkata' },
      { code: 'BOM', name: 'Chhatrapati Shivaji Maharaj International Airport', city: 'Mumbai', country: 'India', timezone: 'Asia/Kolkata' },
      { code: 'HYD', name: 'Rajiv Gandhi International Airport', city: 'Hyderabad', country: 'India', timezone: 'Asia/Kolkata' },
      { code: 'COK', name: 'Cochin International Airport', city: 'Kochi', country: 'India', timezone: 'Asia/Kolkata' }
    ];

    const airports = await Airport.insertMany(airportData);
    const airportMap = {};
    airports.forEach((a) => (airportMap[a.code] = a));
    console.log(`Created ${airports.length} airports.`);

    // 4. Create Admin & Test Users
    console.log('Creating users...');

    // Password hashing handled by User pre-save hook
    const superAdmin = await User.create({
      username: 'superadmin',
      email: 'superadmin@skynexa.com',
      passwordHash: 'Admin@123',
      role: 'SUPER_ADMIN',
      firstName: 'Super',
      lastName: 'Administrator',
      phone: '+919876543210',
      identityVerificationStatus: 'VERIFIED',
      identityVerifiedAt: new Date()
    });

    const scheduleAdmin = await User.create({
      username: 'scheduleadmin',
      email: 'scheduleadmin@skynexa.com',
      passwordHash: 'Admin@123',
      role: 'SCHEDULE_ADMIN',
      firstName: 'Schedule',
      lastName: 'Manager',
      phone: '+919876543211',
      identityVerificationStatus: 'VERIFIED',
      identityVerifiedAt: new Date()
    });

    const marketingAdmin = await User.create({
      username: 'marketingadmin',
      email: 'marketingadmin@skynexa.com',
      passwordHash: 'Admin@123',
      role: 'MARKETING_ADMIN',
      firstName: 'Marketing',
      lastName: 'Director',
      phone: '+919876543212',
      identityVerificationStatus: 'VERIFIED',
      identityVerifiedAt: new Date()
    });

    const customerUser = await User.create({
      username: 'demouser',
      email: 'demo@skynexa.com',
      passwordHash: 'Customer@123',
      role: 'CUSTOMER',
      firstName: 'Demo',
      lastName: 'Traveler',
      phone: '+919876543213',
      identityVerificationStatus: 'VERIFIED',
      identityVerifiedAt: new Date()
    });

    console.log('Created 4 users (Super Admin, Schedule Admin, Marketing Admin, Customer).');

    // 5. Create 5 Flights
    console.log('Creating flights and schedules...');
    const flightDefs = [
      {
        flightCode: 'SKY-101',
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
        flightCode: 'SKY-102',
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
        flightCode: 'SKY-201',
        origin: 'BLR',
        destination: 'BOM',
        layout: layoutB,
        capacity: 80,
        days: [0, 1, 2, 3, 4, 5, 6],
        departureTime: '09:30',
        arrivalTime: '11:15',
        offset: 0,
        adultFare: 3800,
        childFare: 2900
      },
      {
        flightCode: 'SKY-202',
        origin: 'BOM',
        destination: 'BLR',
        layout: layoutB,
        capacity: 80,
        days: [0, 1, 2, 3, 4, 5, 6],
        departureTime: '16:30',
        arrivalTime: '18:15',
        offset: 0,
        adultFare: 4100,
        childFare: 3100
      },
      {
        flightCode: 'SKY-301',
        origin: 'HYD',
        destination: 'COK',
        layout: layoutB,
        capacity: 80,
        days: [0, 1, 3, 5], // Sun, Mon, Wed, Fri
        departureTime: '12:00',
        arrivalTime: '13:40',
        offset: 0,
        adultFare: 3200,
        childFare: 2400
      }
    ];

    const flights = [];
    const schedules = [];

    for (const fDef of flightDefs) {
      const flight = await Flight.create({
        flightName: fDef.flightName || `Skynexa ${fDef.origin}-${fDef.destination} Air`,
        flightCode: fDef.flightCode,
        originAirportId: airportMap[fDef.origin]._id,
        destinationAirportId: airportMap[fDef.destination]._id,
        aircraftLayoutId: fDef.layout._id,
        capacity: fDef.capacity,
        active: true,
        createdBy: superAdmin._id
      });
      flights.push(flight);

      for (const d of fDef.days) {
        const schedule = await FlightSchedule.create({
          flightId: flight._id,
          dayOfWeek: d,
          departureTime: fDef.departureTime,
          arrivalTime: fDef.arrivalTime,
          arrivalDayOffset: fDef.offset,
          adultFare: fDef.adultFare,
          childFare: fDef.childFare,
          active: true,
          assignedAdmins: [scheduleAdmin._id]
        });
        schedules.push(schedule);
      }
    }
    console.log(`Created ${flights.length} flights and ${schedules.length} schedules.`);

    // 6. Generate Flight Instances for the next 60 days
    console.log('Generating flight instances for next 60 days...');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const instanceDocs = [];
    for (let dayOffset = 0; dayOffset < 60; dayOffset++) {
      const date = new Date(today);
      date.setDate(date.getDate() + dayOffset);
      const dayOfWeek = date.getDay();

      const matchingSchedules = schedules.filter((s) => s.dayOfWeek === dayOfWeek);

      for (const s of matchingSchedules) {
        const parentFlight = flights.find((f) => f._id.toString() === s.flightId.toString());
        if (!parentFlight) continue;

        const [depH, depM] = s.departureTime.split(':').map(Number);
        const [arrH, arrM] = s.arrivalTime.split(':').map(Number);

        const departureDateTime = new Date(date);
        departureDateTime.setHours(depH, depM, 0, 0);

        const arrivalDateTime = new Date(date);
        if (s.arrivalDayOffset === 1) {
          arrivalDateTime.setDate(arrivalDateTime.getDate() + 1);
        }
        arrivalDateTime.setHours(arrH, arrM, 0, 0);

        const travelDate = new Date(date);
        travelDate.setUTCHours(0, 0, 0, 0);

        instanceDocs.push({
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
      }
    }

    const createdInstances = await FlightInstance.insertMany(instanceDocs);
    console.log(`Created ${createdInstances.length} flight instances across next 60 days.`);

    // 7. Create Sample Promotional Offers
    console.log('Creating sample offers...');
    const oneYearLater = new Date();
    oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);

    const offer = await Offer.create({
      promoCode: 'SKY500',
      title: 'Flat ₹500 Off',
      description: 'Get flat ₹500 off on all bookings above ₹3000',
      discountType: 'FIXED',
      discountValue: 500,
      minimumBookingAmount: 3000,
      startAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Active since yesterday
      endAt: oneYearLater,
      maxRedemptions: 1000,
      redemptionCount: 0,
      status: 'ACTIVE',
      createdBy: marketingAdmin._id
    });

    const offerPercent = await Offer.create({
      promoCode: 'FLYFLY10',
      title: '10% Off Weekend Getaways',
      description: 'Save 10% up to ₹1,000 on select routes',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      maxDiscount: 1000,
      minimumBookingAmount: 2000,
      startAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      endAt: oneYearLater,
      maxRedemptions: 500,
      redemptionCount: 0,
      status: 'ACTIVE',
      createdBy: marketingAdmin._id
    });

    console.log(`Created sample offers: ${offer.promoCode}, ${offerPercent.promoCode}`);

    // Print Test Credentials Summary
    console.log('\n============================================================');
    console.log('          SKYNEXA DATABASE SEEDING COMPLETED               ');
    console.log('============================================================\n');
    console.log('TEST ACCOUNTS CREDENTIALS:');
    console.log('------------------------------------------------------------');
    console.log('1. SUPER ADMIN');
    console.log('   Email:    superadmin@skynexa.com');
    console.log('   Password: Admin@123');
    console.log('   Role:     SUPER_ADMIN\n');
    console.log('2. SCHEDULE ADMIN');
    console.log('   Email:    scheduleadmin@skynexa.com');
    console.log('   Password: Admin@123');
    console.log('   Role:     SCHEDULE_ADMIN\n');
    console.log('3. MARKETING ADMIN');
    console.log('   Email:    marketingadmin@skynexa.com');
    console.log('   Password: Admin@123');
    console.log('   Role:     MARKETING_ADMIN\n');
    console.log('4. CUSTOMER USER');
    console.log('   Email:    demo@skynexa.com');
    console.log('   Password: Customer@123');
    console.log('   Role:     CUSTOMER\n');
    console.log('ACTIVE PROMO CODES:');
    console.log('------------------------------------------------------------');
    console.log('   - SKY500   : Flat ₹500 off (Min amount ₹3,000)');
    console.log('   - FLYFLY10 : 10% off up to ₹1,000 (Min amount ₹2,000)\n');
    console.log('============================================================\n');

    await mongoose.connection.close();
    console.log('MongoDB connection closed.');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed with error:', err);
    process.exit(1);
  }
};

seedData();
