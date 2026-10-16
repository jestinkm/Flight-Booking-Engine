/**
 * Seed Default Admin Users in MongoDB Atlas
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

const DEFAULT_ADMINS = [
  {
    username: 'superadmin',
    email: 'superadmin@skynexa.com',
    password: 'SuperAdmin@2026',
    role: 'SUPER_ADMIN',
    firstName: 'Super',
    lastName: 'Admin',
    phone: '+919876543210'
  },
  {
    username: 'scheduleadmin',
    email: 'scheduleadmin@skynexa.com',
    password: 'ScheduleAdmin@2026',
    role: 'SCHEDULE_ADMIN',
    firstName: 'Schedule',
    lastName: 'Manager',
    phone: '+919876543211'
  },
  {
    username: 'schedule',
    email: 'schedule@skynexa.com',
    password: 'ScheduleAdmin@2026',
    role: 'SCHEDULE_ADMIN',
    firstName: 'Schedule',
    lastName: 'Operations',
    phone: '+919876543212'
  },
  {
    username: 'marketingadmin',
    email: 'marketingadmin@skynexa.com',
    password: 'MarketingAdmin@2026',
    role: 'MARKETING_ADMIN',
    firstName: 'Marketing',
    lastName: 'Director',
    phone: '+919876543213'
  },
  {
    username: 'marketing',
    email: 'marketing@skynexa.com',
    password: 'MarketingAdmin@2026',
    role: 'MARKETING_ADMIN',
    firstName: 'Marketing',
    lastName: 'Lead',
    phone: '+919876543214'
  },
  {
    username: 'demouser',
    email: 'demo@skynexa.com',
    password: 'Customer@123',
    role: 'CUSTOMER',
    firstName: 'Demo',
    lastName: 'Customer',
    phone: '+919876543215'
  }
];

async function seedAdmins() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI, { dbName: 'skynexa' });
    console.log('Connected to MongoDB.');

    for (const adm of DEFAULT_ADMINS) {
      let existingUser = await User.findOne({
        $or: [{ email: adm.email }, { username: adm.username }]
      });

      if (!existingUser) {
        await User.create({
          username: adm.username,
          email: adm.email,
          passwordHash: adm.password, // Pre-save hook hashes this with bcrypt
          role: adm.role,
          status: 'ACTIVE',
          firstName: adm.firstName,
          lastName: adm.lastName,
          phone: adm.phone,
          identityVerificationStatus: 'VERIFIED',
          identityVerifiedAt: new Date()
        });
        console.log(`Created admin user: ${adm.email} (${adm.role})`);
      } else {
        existingUser.role = adm.role;
        existingUser.status = 'ACTIVE';
        existingUser.passwordHash = adm.password; // Reset password and re-hash via pre-save hook
        await existingUser.save();
        console.log(`Updated admin user: ${adm.email} (${adm.role})`);
      }
    }

    console.log('All default admin accounts successfully registered in MongoDB Atlas!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding admins:', err);
    process.exit(1);
  }
}

seedAdmins();
