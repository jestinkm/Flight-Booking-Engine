/**
 * Ensure Master Data: Airports, Aircraft Layouts, Admin Users, Sample Flights
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Airport = require('../models/Airport');
const AircraftLayout = require('../models/AircraftLayout');
const User = require('../models/User');
const Flight = require('../models/Flight');

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

function generateSeats(rows, cols, type) {
  const seats = [];
  for (let r = 1; r <= rows; r++) {
    for (const c of cols) {
      let pos = 'MIDDLE';
      if (c === cols[0] || c === cols[cols.length - 1]) {
        pos = 'WINDOW';
      } else if (type === '3-3' && (c === 'C' || c === 'D')) {
        pos = 'AISLE';
      } else if (type === '2-2' && (c === 'B' || c === 'C')) {
        pos = 'AISLE';
      }
      seats.push({
        seatNumber: `${r}${c}`,
        row: r,
        column: c,
        position: pos,
        active: true
      });
    }
  }
  return seats;
}

async function run() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI, { dbName: 'skynexa', serverSelectionTimeoutMS: 20000 });
    console.log('Connected.');

    // 1. Seed/Upsert Airports
    console.log('Upserting airports...');
    for (const a of ALL_AIRPORTS) {
      await Airport.findOneAndUpdate(
        { code: a.code },
        { ...a, active: true },
        { upsert: true, new: true }
      );
    }
    console.log(`Verified ${ALL_AIRPORTS.length} airports in DB.`);

    // 2. Ensure Super Admin
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

    // 3. Seed Standard Aircraft Layouts
    console.log('Creating/verifying aircraft layouts...');
    const layoutsToEnsure = [
      {
        name: 'Airbus A320neo (3-3 Standard Cabin)',
        type: '3-3',
        rows: 30,
        seatsPerRow: 6,
        cols: ['A', 'B', 'C', 'D', 'E', 'F']
      },
      {
        name: 'Airbus A321XLR (3-3 Dense Cabin)',
        type: '3-3',
        rows: 37,
        seatsPerRow: 6,
        cols: ['A', 'B', 'C', 'D', 'E', 'F']
      },
      {
        name: 'Embraer E190 Regional (2-2 Regional Jet)',
        type: '2-2',
        rows: 20,
        seatsPerRow: 4,
        cols: ['A', 'B', 'C', 'D']
      },
      {
        name: 'ATR 72-600 (2-2 Turboprop)',
        type: '2-2',
        rows: 18,
        seatsPerRow: 4,
        cols: ['A', 'B', 'C', 'D']
      }
    ];

    const savedLayouts = [];
    for (const def of layoutsToEnsure) {
      let layout = await AircraftLayout.findOne({ name: def.name });
      if (!layout) {
        layout = await AircraftLayout.create({
          name: def.name,
          type: def.type,
          rows: def.rows,
          seatsPerRow: def.seatsPerRow,
          seatDefinitions: generateSeats(def.rows, def.cols, def.type),
          createdBy: superAdmin._id
        });
        console.log(`Created layout: ${def.name}`);
      }
      savedLayouts.push(layout);
    }

    // 4. Create Initial Flight Catalog if empty
    const flightCount = await Flight.countDocuments();
    if (flightCount === 0) {
      console.log('Populating initial standard flights...');
      const maa = await Airport.findOne({ code: 'MAA' });
      const blr = await Airport.findOne({ code: 'BLR' });
      const del = await Airport.findOne({ code: 'DEL' });
      const bom = await Airport.findOne({ code: 'BOM' });
      const hyd = await Airport.findOne({ code: 'HYD' });
      const coi = await Airport.findOne({ code: 'COK' });
      const goi = await Airport.findOne({ code: 'GOI' });

      const a320 = savedLayouts[0];
      const e190 = savedLayouts[2];

      const initial = [
        {
          flightNumber: 'SK-101',
          flightName: 'Skynexa Express',
          orig: maa._id,
          dest: blr._id,
          fare: 3500,
          layout: a320,
          dep: '2026-11-01T08:30:00+05:30',
          arr: '2026-11-01T09:35:00+05:30'
        },
        {
          flightNumber: 'SK-204',
          flightName: 'Capital Corridor',
          orig: del._id,
          dest: bom._id,
          fare: 5800,
          layout: a320,
          dep: '2026-11-01T11:15:00+05:30',
          arr: '2026-11-01T13:25:00+05:30'
        },
        {
          flightNumber: 'SK-309',
          flightName: 'Deccan Shuttle',
          orig: blr._id,
          dest: del._id,
          fare: 4800,
          layout: a320,
          dep: '2026-11-01T15:45:00+05:30',
          arr: '2026-11-01T18:30:00+05:30'
        },
        {
          flightNumber: 'SK-412',
          flightName: 'Goa Sunliner',
          orig: bom._id,
          dest: goi._id,
          fare: 2999,
          layout: e190,
          dep: '2026-11-01T18:00:00+05:30',
          arr: '2026-11-01T19:15:00+05:30'
        },
        {
          flightNumber: 'SK-501',
          flightName: 'Malabar Connector',
          orig: hyd._id,
          dest: coi._id,
          fare: 3200,
          layout: e190,
          dep: '2026-11-01T12:00:00+05:30',
          arr: '2026-11-01T13:40:00+05:30'
        }
      ];

      for (const item of initial) {
        const capacity = item.layout.seatDefinitions.filter((s) => s.active !== false).length;
        await Flight.create({
          flightNumber: item.flightNumber,
          flightCode: item.flightNumber,
          flightName: item.flightName,
          originAirportId: item.orig,
          destinationAirportId: item.dest,
          baseFare: item.fare,
          departureDateTime: new Date(item.dep),
          arrivalDateTime: new Date(item.arr),
          aircraftLayoutId: item.layout._id,
          totalCapacity: capacity,
          capacity: capacity,
          status: 'ACTIVE',
          active: true,
          createdBy: superAdmin._id
        });
        console.log(`Created flight ${item.flightNumber} (${item.flightName})`);
      }
    }

    console.log('Master data verification complete.');
    process.exit(0);
  } catch (err) {
    console.error('Error in ensureMasterData:', err);
    process.exit(1);
  }
}

run();
