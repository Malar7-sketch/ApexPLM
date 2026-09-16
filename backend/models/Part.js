const mongoose = require('mongoose');

const partSchema = new mongoose.Schema(
  {
    partNumber: {
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
    description: {
      type: String,
      default: '',
    },
    type: {
      type: String,
      default: 'Component',
    },
    category: {
      type: String,
      default: 'CNC Machined',
    },
    material: {
      type: String,
      default: 'Aluminum 6061-T6',
    },
    weightKg: {
      type: Number,
      default: 0,
    },
    estimatedCost: {
      type: Number,
      default: 0,
    },
    actualCost: {
      type: Number,
      default: 0,
    },
    currentRev: {
      type: String,
      default: 'A.1',
    },
    lifecycleStage: {
      type: String,
      default: 'design',
    },
    isCheckedOut: {
      type: Boolean,
      default: false,
    },
    checkedOutBy: {
      type: String,
    },
    checkedOutDate: {
      type: String,
    },
    parentAssemblyId: {
      type: String,
    },
    projectId: {
      type: String,
    },
    projectName: {
      type: String,
    },
    completionPercent: {
      type: Number,
      default: 0,
    },
    productStatus: {
      type: String,
      default: 'IN PROGRESS',
    },
    cadMetadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    revisionHistory: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    tags: {
      type: [String],
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

module.exports = mongoose.model('Part', partSchema);
