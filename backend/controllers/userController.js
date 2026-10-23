const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

// Helper to find user by MongoDB _id or employeeId or custom id
const findUserByIdOrEmployeeId = async (idParam) => {
  if (mongoose.Types.ObjectId.isValid(idParam)) {
    const user = await User.findById(idParam);
    if (user) return user;
  }
  return await User.findOne({
    $or: [{ employeeId: idParam }, { id: idParam }],
  });
};

// @desc    Get all users
// @route   GET /api/users
// @access  Public (or Private depending on frontend load)
const getUsers = async (req, res, next) => {
  try {
    const users = await User.find({}).sort({ createdAt: 1 });
    return res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user by ID or employee ID
// @route   GET /api/users/:id
// @access  Private
const getUserById = async (req, res, next) => {
  try {
    const user = await findUserByIdOrEmployeeId(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }
    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new user / employee
// @route   POST /api/users
// @access  Private (Admin)
const createUser = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      role,
      systemRole,
      roleId,
      personaKey,
      department,
      employeeId,
      officeLocation,
      manager,
      phone,
      permissions,
      avatar,
      badgeColor,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required.',
      });
    }

    const existingEmail = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: 'A user with this email address already exists.',
      });
    }

    let generatedEmpId = employeeId;
    if (!generatedEmpId) {
      const count = await User.countDocuments();
      generatedEmpId = `EMP-${String(count + 10001).padStart(5, '0')}`;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      employeeId: generatedEmpId,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role: role || 'Lead Design Engineer',
      systemRole: systemRole || 'DESIGN_ENGINEER',
      roleId: roleId || 'design',
      personaKey: personaKey || 'design',
      department: department || 'Engineering',
      officeLocation: officeLocation || 'Austin Gigafactory & R&D Hub',
      manager: manager || '',
      phone: phone || '',
      permissions: permissions || [],
      avatar: avatar || '👤',
      badgeColor: badgeColor || 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
      status: 'Active',
    });

    // Audit log
    await AuditLog.create({
      user: req.user?.name || 'Administrator',
      persona: req.user?.personaKey || 'admin',
      action: 'Created Employee Account',
      category: 'USER_MGMT',
      targetId: newUser.employeeId,
      details: `Created new employee profile "${newUser.name}" (${newUser.role} - ${newUser.employeeId}).`,
    });

    return res.status(201).json({
      success: true,
      message: 'Employee account created successfully.',
      user: newUser,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (Admin)
const updateUser = async (req, res, next) => {
  try {
    const user = await findUserByIdOrEmployeeId(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    const {
      name,
      email,
      role,
      systemRole,
      roleId,
      personaKey,
      department,
      officeLocation,
      manager,
      phone,
      permissions,
      status,
      avatar,
      badgeColor,
      password,
    } = req.body;

    if (name) user.name = name.trim();
    if (email) user.email = email.toLowerCase().trim();
    if (role) user.role = role;
    if (systemRole) user.systemRole = systemRole;
    if (roleId) user.roleId = roleId;
    if (personaKey) user.personaKey = personaKey;
    if (department) user.department = department;
    if (officeLocation) user.officeLocation = officeLocation;
    if (manager !== undefined) user.manager = manager;
    if (phone !== undefined) user.phone = phone;
    if (permissions) user.permissions = permissions;
    if (status) user.status = status;
    if (avatar) user.avatar = avatar;
    if (badgeColor) user.badgeColor = badgeColor;

    if (password && password.trim().length >= 4) {
      const salt = await bcrypt.genSalt(10);
      user.passwordHash = await bcrypt.hash(password.trim(), salt);
    }

    await user.save();

    await AuditLog.create({
      user: req.user?.name || 'Administrator',
      persona: req.user?.personaKey || 'admin',
      action: 'Updated Employee Profile',
      category: 'USER_MGMT',
      targetId: user.employeeId,
      details: `Updated details for ${user.name} (${user.employeeId}).`,
    });

    return res.status(200).json({
      success: true,
      message: 'User updated successfully.',
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Admin)
const deleteUser = async (req, res, next) => {
  try {
    const user = await findUserByIdOrEmployeeId(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    const empId = user.employeeId;
    const name = user.name;
    await User.findByIdAndDelete(user._id);

    await AuditLog.create({
      user: req.user?.name || 'Administrator',
      persona: req.user?.personaKey || 'admin',
      action: 'Deleted Employee Account',
      category: 'USER_MGMT',
      targetId: empId,
      details: `Permanently removed employee record: ${name} (${empId}).`,
    });

    return res.status(200).json({
      success: true,
      message: `User ${name} (${empId}) deleted successfully.`,
      deletedId: empId,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Block user
// @route   PATCH /api/users/:id/block
// @access  Private (Admin)
const blockUser = async (req, res, next) => {
  try {
    const user = await findUserByIdOrEmployeeId(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    user.status = 'Blocked';
    await user.save();

    await AuditLog.create({
      user: req.user?.name || 'Administrator',
      persona: req.user?.personaKey || 'admin',
      action: 'Blocked Employee Access',
      category: 'SECURITY',
      targetId: user.employeeId,
      details: `Employee account ${user.name} (${user.employeeId}) has been BLOCKED.`,
    });

    return res.status(200).json({
      success: true,
      message: `Account for ${user.name} is now Blocked.`,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Unblock user
// @route   PATCH /api/users/:id/unblock
// @access  Private (Admin)
const unblockUser = async (req, res, next) => {
  try {
    const user = await findUserByIdOrEmployeeId(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    user.status = 'Active';
    await user.save();

    await AuditLog.create({
      user: req.user?.name || 'Administrator',
      persona: req.user?.personaKey || 'admin',
      action: 'Unblocked Employee Access',
      category: 'SECURITY',
      targetId: user.employeeId,
      details: `Employee account ${user.name} (${user.employeeId}) has been UNBLOCKED and restored to Active status.`,
    });

    return res.status(200).json({
      success: true,
      message: `Account for ${user.name} is now Active.`,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset user password
// @route   POST /api/users/:id/reset-password
// @access  Private (Admin)
const resetPassword = async (req, res, next) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 4) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 4 characters long.',
      });
    }

    const user = await findUserByIdOrEmployeeId(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    await user.save();

    await AuditLog.create({
      user: req.user?.name || 'Administrator',
      persona: req.user?.personaKey || 'admin',
      action: 'Reset Employee Password',
      category: 'SECURITY',
      targetId: user.employeeId,
      details: `Password securely reset for employee ${user.name} (${user.employeeId}).`,
    });

    return res.status(200).json({
      success: true,
      message: `Password reset successfully for ${user.name}.`,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  blockUser,
  unblockUser,
  resetPassword,
};
