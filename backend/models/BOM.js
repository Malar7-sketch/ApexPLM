const mongoose = require('mongoose');

const bomNodeSchema = new mongoose.Schema({
  id: { type: String, required: true },
  partId: { type: String, required: true },
  partNumber: { type: String, required: true },
  name: { type: String, required: true },
  revision: { type: String, default: 'A.1' },
  quantity: { type: Number, default: 1 },
  unit: { type: String, default: 'EA' },
  refDes: { type: String },
  material: { type: String, default: 'Aluminum 6061-T6' },
  unitCost: { type: Number, default: 0 },
  weightKg: { type: Number, default: 0 },
  carbonKgCO2: { type: Number, default: 0 },
  isMbomOnly: { type: Boolean, default: false },
  mbomInstruction: { type: String },
  isSbomOnly: { type: Boolean, default: false },
  sbomMaintenanceInterval: { type: String },
  stockStatus: { type: String, default: 'In Stock' },
  children: { type: [mongoose.Schema.Types.Mixed], default: [] }
}, { _id: false });

const bomSchema = new mongoose.Schema(
  {
    partId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    rootNode: {
      type: bomNodeSchema,
      required: true,
    },
    projectId: {
      type: String,
      trim: true,
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

module.exports = mongoose.model('BOM', bomSchema);
