const jwt = require('jsonwebtoken');
const User = require('../models/User');

const requireAuth = async (req, res, next) => {
  try {
    let token;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No token provided.',
      });
    }

    const secret = process.env.JWT_SECRET || 'apexplm_prod_secret_jwt_key_982431_secure_plm_auth';
    const decoded = jwt.verify(token, secret);

    const user = await User.findById(decoded.id).select('-passwordHash');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User account not found.',
      });
    }

    if (user.status === 'Blocked' || user.status === 'Locked' || user.status === 'blocked') {
      return res.status(403).json({
        success: false,
        message: 'Account Blocked: Access is prohibited by a PLM Administrator.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token. Please log in again.',
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Authentication error: ' + error.message,
    });
  }
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    const userRole = req.user.systemRole;
    const userPersona = req.user.personaKey;

    const normalizedRoles = roles.map((r) => r.toUpperCase());
    if (
      userRole === 'ADMIN' ||
      normalizedRoles.includes(userRole.toUpperCase()) ||
      (userPersona && normalizedRoles.includes(userPersona.toUpperCase()))
    ) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `Access denied. Requires one of roles: ${roles.join(', ')}`,
    });
  };
};

module.exports = {
  requireAuth,
  requireRole,
};
