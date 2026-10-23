const AuditLog = require('../models/AuditLog');

// @desc    Get all audit logs
// @route   GET /api/audit-logs
// @access  Public (or Private)
const getAuditLogs = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 200;
    const logs = await AuditLog.find({}).sort({ createdAt: -1 }).limit(limit);
    return res.status(200).json({
      success: true,
      count: logs.length,
      auditLogs: logs,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create an audit log
// @route   POST /api/audit-logs
// @access  Public (or Private)
const createAuditLog = async (req, res, next) => {
  try {
    const { user, persona, action, category, targetId, details, metadata } = req.body;

    if (!action) {
      return res.status(400).json({
        success: false,
        message: 'Action description is required.',
      });
    }

    const log = await AuditLog.create({
      user: user || req.user?.name || 'System User',
      persona: persona || req.user?.personaKey || 'admin',
      action,
      category: category || 'SYSTEM',
      targetId: targetId || '',
      details: details || '',
      metadata: metadata || {},
    });

    return res.status(201).json({
      success: true,
      auditLog: log,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAuditLogs,
  createAuditLog,
};
