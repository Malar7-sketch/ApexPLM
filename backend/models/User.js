const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
      default: 'Lead Design Engineer',
    },
    systemRole: {
      type: String,
      required: true,
      enum: ['ADMIN', 'DESIGN_ENGINEER', 'MANUFACTURING_ENGINEER', 'QUALITY_ENGINEER', 'EMPLOYEE'],
      default: 'DESIGN_ENGINEER',
    },
    roleId: {
      type: String,
      default: 'design',
    },
    personaKey: {
      type: String,
      default: 'design',
    },
    department: {
      type: String,
      default: 'Engineering',
    },
    avatar: {
      type: String,
      default: '👨‍💻',
    },
    badgeColor: {
      type: String,
      default: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    },
    manager: {
      type: String,
      default: '',
    },
    officeLocation: {
      type: String,
      default: 'Austin Gigafactory & R&D Hub',
    },
    lastLogin: {
      type: String,
      default: 'Never',
    },
    status: {
      type: String,
      enum: ['Active', 'Blocked', 'Locked', 'Disabled', 'active', 'blocked'],
      default: 'Active',
    },
    permissions: {
      type: [String],
      default: [],
    },
    joiningDate: {
      type: String,
      default: () => new Date().toISOString().split('T')[0],
    },
    phone: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id.toString();
        delete ret.passwordHash;
        delete ret.__v;
        return ret;
      },
    },
  }
);

module.exports = mongoose.model('User', userSchema);
