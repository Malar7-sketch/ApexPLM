const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

const generateToken = (id) => {
  const secret = process.env.JWT_SECRET || 'apexplm_prod_secret_jwt_key_982431_secure_plm_auth';
  return jwt.sign({ id }, secret, {
    expiresIn: '3h',
  });
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res, next) => {
  try {
    const { email, employeeId, password } = req.body;
    const identifier = (email || employeeId || '').trim();

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email or Employee ID and password.',
      });
    }

    // Find by email or employeeId (case insensitive)
    const user = await User.findOne({
      $or: [
        { email: { $regex: new RegExp(`^${identifier}$`, 'i') } },
        { employeeId: { $regex: new RegExp(`^${identifier}$`, 'i') } },
      ],
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid corporate credentials. Account not found.',
      });
    }

    // Check if account is blocked or locked
    if (user.status === 'Blocked' || user.status === 'Locked' || user.status === 'blocked') {
      return res.status(403).json({
        success: false,
        message: 'Account Blocked: Your account has been blocked by a PLM Administrator. Access to all PLM services is prohibited.',
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email/Employee ID or password.',
      });
    }

    // Update lastLogin
    user.lastLogin = `Today at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    await user.save();

    // Audit log
    await AuditLog.create({
      user: user.name,
      persona: user.personaKey,
      action: `${user.systemRole === 'ADMIN' ? 'Admin' : 'Employee'} Authentication Success`,
      category: 'SYSTEM',
      targetId: user.employeeId,
      details: `User ${user.name} (${user.email}) successfully logged in via REST API.`,
    });

    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id.toString(),
        employeeId: user.employeeId,
        name: user.name,
        email: user.email,
        role: user.role,
        systemRole: user.systemRole,
        roleId: user.roleId,
        personaKey: user.personaKey,
        department: user.department,
        avatar: user.avatar,
        badgeColor: user.badgeColor,
        manager: user.manager,
        officeLocation: user.officeLocation,
        lastLogin: user.lastLogin,
        status: user.status,
        permissions: user.permissions,
        joiningDate: user.joiningDate,
        phone: user.phone,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'User session not found.',
    });
  }

  return res.status(200).json({
    success: true,
    user: {
      id: user._id ? user._id.toString() : (user.id || ''),
      employeeId: user.employeeId,
      name: user.name,
      email: user.email,
      role: user.role,
      systemRole: user.systemRole,
      roleId: user.roleId,
      personaKey: user.personaKey,
      department: user.department,
      avatar: user.avatar,
      badgeColor: user.badgeColor,
      manager: user.manager,
      officeLocation: user.officeLocation,
      lastLogin: user.lastLogin,
      status: user.status,
      permissions: user.permissions,
      joiningDate: user.joiningDate,
      phone: user.phone,
    },
  });
};

module.exports = {
  loginUser,
  getMe,
};
