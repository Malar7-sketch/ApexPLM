const mongoose = require('mongoose');

const projectTaskSchema = new mongoose.Schema(
  {
    id: { type: String },
    taskNumber: { type: String, required: true },
    taskName: { type: String, required: true },
    weight: { type: Number, default: 5 },
    assignedRole: { type: String, default: 'design' },
    owner: { type: String, default: 'Unassigned' },
    dependency: { type: String, default: 'None' },
    progressPercent: { type: Number, default: 0 },
    status: { type: String, default: 'Not Started' },
    startDate: { type: String },
    endDate: { type: String },
    durationDays: { type: Number, default: 14 },
  },
  { _id: false }
);

const teamMemberSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, required: true },
    department: { type: String },
    email: { type: String },
    avatar: { type: String },
  },
  { _id: false }
);

const projectSchema = new mongoose.Schema(
  {
    code: {
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
    customer: {
      type: String,
      default: '',
    },
    program: {
      type: String,
      default: '',
    },
    stage: {
      type: String,
      enum: ['Concept', 'Design', 'Validation', 'Production', 'Maintenance', 'Architecture', 'EV Platform', 'Battery Systems', 'Safety & Powertrain'],
      default: 'Design',
    },
    status: {
      type: String,
      enum: ['On Track', 'At Risk', 'Delayed', 'Critical', 'Completed'],
      default: 'On Track',
    },
    progress: {
      type: Number,
      default: 0,
    },
    startDate: {
      type: String,
      default: () => new Date().toISOString().split('T')[0],
    },
    endDate: {
      type: String,
      default: () => new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0],
    },
    durationFormatted: {
      type: String,
      default: '180 Days',
    },
    manager: {
      type: String,
      default: 'David Sterling',
    },
    designEngineer: {
      type: String,
      default: 'Alex Rivera, PE',
    },
    mfgEngineer: {
      type: String,
      default: 'Marcus Vance',
    },
    qualityEngineer: {
      type: String,
      default: 'Dr. Elena Rostova',
    },
    procurementLead: {
      type: String,
      default: 'Sarah Connor',
    },
    budgetTotal: {
      type: Number,
      default: 650000,
    },
    budgetSpent: {
      type: Number,
      default: 0,
    },
    engHoursTotal: {
      type: Number,
      default: 2400,
    },
    engHoursSpent: {
      type: Number,
      default: 0,
    },
    targetRelease: {
      type: String,
      default: 'Q4 2026',
    },
    activeEcrs: {
      type: Number,
      default: 0,
    },
    openNcrs: {
      type: Number,
      default: 0,
    },
    cadModelsCount: {
      type: Number,
      default: 0,
    },
    ebomPartCount: {
      type: Number,
      default: 0,
    },
    description: {
      type: String,
      default: '',
    },
    teamMembers: {
      type: [teamMemberSchema],
      default: [],
    },
    tasks: {
      type: [projectTaskSchema],
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

module.exports = mongoose.model('Project', projectSchema);
