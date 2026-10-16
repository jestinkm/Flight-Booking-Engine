const User = require('../models/User');
const FlightSchedule = require('../models/FlightSchedule');
const AuditLog = require('../models/AuditLog');
const Booking = require('../models/Booking');
const Flight = require('../models/Flight');
const Payment = require('../models/Payment');

// @desc    Create a new admin user
// @route   POST /api/super-admin/admins
// @access  Private (SUPER_ADMIN)
const createAdmin = async (req, res, next) => {
  try {
    const { username, email, password, role, firstName, lastName, phone } = req.body;

    const allowedRoles = ['SCHEDULE_ADMIN', 'MARKETING_ADMIN', 'SUPER_ADMIN'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid admin role. Must be SCHEDULE_ADMIN, MARKETING_ADMIN, or SUPER_ADMIN'
      });
    }

    const existing = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }]
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Username or email already exists'
      });
    }

    const admin = await User.create({
      username: username.toLowerCase().trim(),
      email: email.toLowerCase().trim(),
      passwordHash: password,
      role,
      firstName: firstName || '',
      lastName: lastName || '',
      phone: phone || '',
      status: 'ACTIVE'
    });

    await AuditLog.create({
      adminId: req.user._id,
      action: 'CREATE_ADMIN',
      entityType: 'User',
      entityId: admin._id,
      details: { username: admin.username, role: admin.role }
    });

    const adminObj = admin.toObject();
    delete adminObj.passwordHash;

    res.status(201).json({
      success: true,
      message: 'Admin account created successfully',
      data: { admin: adminObj }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    List all admin users
// @route   GET /api/super-admin/admins
// @access  Private (SUPER_ADMIN)
const listAdmins = async (req, res, next) => {
  try {
    const admins = await User.find({
      role: { $in: ['SCHEDULE_ADMIN', 'MARKETING_ADMIN', 'SUPER_ADMIN'] }
    })
      .select('-passwordHash')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { admins }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update an admin user
// @route   PUT /api/super-admin/admins/:id
// @access  Private (SUPER_ADMIN)
const updateAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role, status, firstName, lastName, phone } = req.body;

    const updates = {};
    if (role) updates.role = role;
    if (status) updates.status = status;
    if (firstName !== undefined) updates.firstName = firstName;
    if (lastName !== undefined) updates.lastName = lastName;
    if (phone !== undefined) updates.phone = phone;

    const admin = await User.findByIdAndUpdate(id, { $set: updates }, { new: true, runValidators: true }).select('-passwordHash');

    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    await AuditLog.create({
      adminId: req.user._id,
      action: 'UPDATE_ADMIN',
      entityType: 'User',
      entityId: admin._id,
      details: updates
    });

    res.json({
      success: true,
      message: 'Admin updated successfully',
      data: { admin }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Assign flight schedules to a SCHEDULE_ADMIN
// @route   POST /api/super-admin/assign-flight
// @access  Private (SUPER_ADMIN)
const assignFlightToAdmin = async (req, res, next) => {
  try {
    const { adminId, flightId, scheduleIds } = req.body;

    const admin = await User.findById(adminId);
    if (!admin || admin.role !== 'SCHEDULE_ADMIN') {
      return res.status(400).json({
        success: false,
        message: 'Target user must exist and have SCHEDULE_ADMIN role'
      });
    }

    const query = flightId ? { flightId } : { _id: { $in: scheduleIds } };
    const updatedSchedules = await FlightSchedule.updateMany(
      query,
      { $addToSet: { assignedAdmins: admin._id } }
    );

    await AuditLog.create({
      adminId: req.user._id,
      action: 'ASSIGN_FLIGHT_ADMIN',
      entityType: 'FlightSchedule',
      details: { adminId, flightId, scheduleIds, modifiedCount: updatedSchedules.modifiedCount }
    });

    res.json({
      success: true,
      message: `Assigned admin to ${updatedSchedules.modifiedCount} flight schedules`
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get paginated audit logs
// @route   GET /api/super-admin/audit-logs
// @access  Private (SUPER_ADMIN)
const getAuditLogs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.action) filter.action = req.query.action;
    if (req.query.adminId) filter.adminId = req.query.adminId;

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate('adminId', 'username email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      AuditLog.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get comprehensive system dashboard
// @route   GET /api/super-admin/dashboard
// @access  Private (SUPER_ADMIN)
const getDashboard = async (req, res, next) => {
  try {
    const [
      userRoleCounts,
      bookingCounts,
      totalRevenueResult,
      totalFlights,
      recentAuditLogs
    ] = await Promise.all([
      User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
      Booking.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Payment.aggregate([
        { $match: { status: 'SUCCESS' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Flight.countDocuments({ active: true }),
      AuditLog.find().sort({ createdAt: -1 }).limit(10).populate('adminId', 'username role')
    ]);

    const usersByRole = {};
    userRoleCounts.forEach((r) => (usersByRole[r._id] = r.count));

    const bookingsByStatus = {};
    bookingCounts.forEach((b) => (bookingsByStatus[b._id] = b.count));

    res.json({
      success: true,
      data: {
        usersByRole,
        bookingsByStatus,
        totalRevenue: totalRevenueResult[0]?.total || 0,
        activeFlights: totalFlights,
        recentActivity: recentAuditLogs
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createAdmin,
  listAdmins,
  updateAdmin,
  assignFlightToAdmin,
  getAuditLogs,
  getDashboard
};
