const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    timestamp: {
      type: String,
      default: () => new Date().toISOString().replace('T', ' ').substring(0, 19),
    },
    user: {
      type: String,
      required: true,
      default: 'System',
    },
    persona: {
      type: String,
      default: 'admin',
    },
    action: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      default: 'SYSTEM',
    },
    targetId: {
      type: String,
      default: '',
    },
    details: {
      type: String,
      default: '',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id.toString();
        delete ret.__v;
        return ret;
      },
    },
  }
);

module.exports = mongoose.model('AuditLog', auditLogSchema);
