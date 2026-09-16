const mongoose = require('mongoose');

const ncrSchema = new mongoose.Schema(
  {
    ncrNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    severity: {
      type: String,
      enum: ['Critical', 'Major', 'Minor'],
      default: 'Minor',
    },
    status: {
      type: String,
      enum: ['Open', 'Under Investigation', 'Containment', 'Corrective Action', 'Verification', 'Closed', 'Archived'],
      default: 'Open',
    },
    type: {
      type: String,
      default: 'In-Process Machining',
    },
    impactedPartId: {
      type: String,
      default: '',
    },
    impactedPartNumber: {
      type: String,
      default: '',
    },
    impactedPartName: {
      type: String,
      default: '',
    },
    projectId: {
      type: String,
      default: '',
    },
    projectName: {
      type: String,
      default: '',
    },
    supplierId: {
      type: String,
      default: '',
    },
    supplierName: {
      type: String,
      default: '',
    },
    defectCategory: {
      type: String,
      default: 'Dimensional',
    },
    rootCause: {
      type: String,
      default: '',
    },
    containmentAction: {
      type: String,
      default: '',
    },
    correctiveAction: {
      type: String,
      default: '',
    },
    loggedBy: {
      type: String,
      default: 'Quality Engineer',
    },
    assignedTo: {
      type: String,
      default: 'Manufacturing Engineer',
    },
    dateLogged: {
      type: String,
      default: () => new Date().toISOString().split('T')[0],
    },
    targetClosureDate: {
      type: String,
      default: () => new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    },
    closedDate: {
      type: String,
    },
    costImpact: {
      type: Number,
      default: 0,
    },
    downtimeHours: {
      type: Number,
      default: 0,
    },
    scrapQuantity: {
      type: Number,
      default: 0,
    },
    disposition: {
      type: String,
      enum: ['Rework', 'Scrap', 'Return to Vendor', 'Use As Is', 'Pending'],
      default: 'Pending',
    },
    attachments: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    history: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
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

module.exports = mongoose.model('NCR', ncrSchema);
