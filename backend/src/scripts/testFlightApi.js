require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Flight = require('../models/Flight');
const Airport = require('../models/Airport');
const AircraftLayout = require('../models/AircraftLayout');
const User = require('../models/User');

async function testFlightEngine() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI, { dbName: 'skynexa', serverSelectionTimeoutMS: 20000 });
    console.log('MongoDB connected.');

    // 1. Get references
    const maa = await Airport.findOne({ code: 'MAA' });
    const blr = await Airport.findOne({ code: 'BLR' });
    const layout = await AircraftLayout.findOne();
    const admin = await User.findOne({ role: 'SUPER_ADMIN' });

    if (!maa || !blr || !layout || !admin) {
      throw new Error('Master data missing: airports, layout or admin not found.');
    }

    console.log(`Using Origin: ${maa.code} (${maa._id}), Destination: ${blr.code} (${blr._id})`);
    console.log(`Using Aircraft Layout: ${layout.name} (${layout._id})`);
    console.log(`Using Super Admin: ${admin.email} (${admin._id})`);

    // 2. Clean previous test flight if exists
    await Flight.deleteMany({ flightNumber: 'SK-999' });

    // 3. Test Capacity Calculation from Layout
    const calculatedCapacity =
      layout.seatDefinitions?.filter((s) => s.active !== false).length ||
      (layout.rows && layout.seatsPerRow ? layout.rows * layout.seatsPerRow : 180);

    console.log(`Auto-calculated capacity from layout: ${calculatedCapacity} seats`);

    // 4. Create Flight with user specification
    const testFlight = await Flight.create({
      flightNumber: 'SK-999',
      flightCode: 'SK-999',
      flightName: 'Skynexa Express',
      originAirportId: maa._id,
      destinationAirportId: blr._id,
      baseFare: 3500,
      departureDateTime: new Date('2026-11-01T10:00:00+05:30'),
      arrivalDateTime: new Date('2026-11-01T11:15:00+05:30'),
      aircraftLayoutId: layout._id,
      totalCapacity: calculatedCapacity,
      capacity: calculatedCapacity,
      status: 'ACTIVE',
      active: true,
      createdBy: admin._id
    });

    console.log('✅ Created Flight successfully:');
    console.log(`   - ID: ${testFlight._id}`);
    console.log(`   - Flight Name: ${testFlight.flightName}`);
    console.log(`   - Flight Number: ${testFlight.flightNumber}`);
    console.log(`   - Base Fare: ₹${testFlight.baseFare}`);
    console.log(`   - Capacity: ${testFlight.totalCapacity} seats`);
    console.log(`   - Status: ${testFlight.status}`);

    // 5. Query populated flight
    const populated = await Flight.findById(testFlight._id)
      .populate('originAirportId')
      .populate('destinationAirportId')
      .populate('aircraftLayoutId')
      .populate('createdBy', 'firstName lastName email role');

    console.log('✅ Populated Verification:');
    console.log(`   - Route: ${populated.originAirportId.code} (${populated.originAirportId.city}) -> ${populated.destinationAirportId.code} (${populated.destinationAirportId.city})`);
    console.log(`   - Aircraft: ${populated.aircraftLayoutId.name}`);
    console.log(`   - Created By: ${populated.createdBy.email} (${populated.createdBy.role})`);

    // 6. Test Status Toggle (Preserving Bookings)
    populated.status = 'INACTIVE';
    populated.active = false;
    await populated.save();
    console.log(`✅ Status Toggled to: ${populated.status} (active: ${populated.active})`);

    // 7. Cleanup test flight
    await Flight.deleteOne({ _id: testFlight._id });
    console.log('✅ Cleaned up test flight SK-999');

    console.log('ALL FLIGHT ENGINE VERIFICATIONS PASSED SUCCESSFULLY!');
    process.exit(0);
  } catch (err) {
    console.error('Test failed:', err);
    process.exit(1);
  }
}

testFlightEngine();
