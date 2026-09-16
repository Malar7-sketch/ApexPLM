const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
  {
    docNumber: {
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
    type: {
      type: String,
      default: 'Technical Specification',
    },
    linkedPartId: {
      type: String,
      default: '',
    },
    projectId: {
      type: String,
      default: '',
    },
    revision: {
      type: String,
      default: 'A.1',
    },
    author: {
      type: String,
      default: 'System User',
    },
    uploadDate: {
      type: String,
      default: () => new Date().toISOString().split('T')[0],
    },
    fileSize: {
      type: String,
      default: '1.2 MB',
    },
    status: {
      type: String,
      enum: ['Approved', 'Draft', 'Obsolete'],
      default: 'Approved',
    },
    fileUrl: {
      type: String,
    },
    fileName: {
      type: String,
    },
    fileExtension: {
      type: String,
    },
    category: {
      type: String,
      default: 'doc',
    },
    description: {
      type: String,
      default: '',
    },
    content: {
      type: String,
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

module.exports = mongoose.model('Document', documentSchema);
