const mongoose = require('mongoose');
const Document = require('../models/Document');
const AuditLog = require('../models/AuditLog');

const findDocumentByIdOrNumber = async (idParam) => {
  if (mongoose.Types.ObjectId.isValid(idParam)) {
    const doc = await Document.findById(idParam);
    if (doc) return doc;
  }
  return await Document.findOne({
    $or: [{ docNumber: idParam }, { id: idParam }],
  });
};

const SAMPLE_DOC_NUMBERS = [
  'DWG-GBX-5000-01',
  'CAD-GBX-5000-01',
  'SPEC-GBX-5000-A',
  'DFMEA-2026-088',
  'CAD-PRT-1004-03',
  'INSP-FAIR-902',
  'CERT-ENV-2026-04',
  'SOW-SC-2026-11',
  'DOC-ENG-2026-001',
  'DOC-ENG-2026-002',
  'DOC-ENG-2026-003',
  'DOC-101',
  'DOC-102',
  'DOC-103',
  'DOC-104',
  'DOC-105',
  'DOC-106',
  'DOC-107',
  'DOC-108'
];

// @desc    Get all documents
// @route   GET /api/documents
// @access  Public (or Private)
const getDocuments = async (req, res, next) => {
  try {
    const filter = {
      docNumber: { $nin: SAMPLE_DOC_NUMBERS },
    };
    if (req.query.projectId) filter.projectId = req.query.projectId;
    if (req.query.revision) filter.revision = req.query.revision;
    if (req.query.type) filter.type = req.query.type;
    if (req.query.partId || req.query.partNumber) {
      const p = req.query.partId || req.query.partNumber;
      filter.$or = [{ linkedPartId: p }, { linkedPartId: new RegExp(`^${p}$`, 'i') }];
    }

    const documents = await Document.find(filter).sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      count: documents.length,
      documents,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get document by ID
// @route   GET /api/documents/:id
// @access  Public (or Private)
const getDocumentById = async (req, res, next) => {
  try {
    const doc = await findDocumentByIdOrNumber(req.params.id);
    if (!doc) {
      return res.status(404).json({
        success: false,
        message: 'Document not found.',
      });
    }
    return res.status(200).json({
      success: true,
      document: doc,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new document
// @route   POST /api/documents
// @access  Private
const createDocument = async (req, res, next) => {
  try {
    const {
      title,
      docNumber,
      type,
      linkedPartId,
      projectId,
      revision,
      author,
      fileSize,
      status,
      fileUrl,
      fileName,
      fileExtension,
      category,
      description,
      content,
    } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Document title is required.',
      });
    }

    let generatedDocNumber = docNumber;
    if (!generatedDocNumber) {
      const count = await Document.countDocuments();
      generatedDocNumber = `DOC-ENG-${String(count + 101).padStart(4, '0')}`;
    }

    const newDoc = await Document.create({
      docNumber: generatedDocNumber,
      title: title.trim(),
      type: type || 'Technical Specification',
      linkedPartId: linkedPartId || '',
      projectId: projectId || '',
      revision: revision || 'A.1',
      author: author || req.user?.name || 'Engineering Author',
      uploadDate: new Date().toISOString().split('T')[0],
      fileSize: fileSize || '1.2 MB',
      status: status || 'Approved',
      fileUrl: fileUrl || '',
      fileName: fileName || '',
      fileExtension: fileExtension || 'pdf',
      category: category || 'doc',
      description: description || '',
      content: content || '',
    });

    await AuditLog.create({
      user: req.user?.name || 'Engineering User',
      persona: req.user?.personaKey || 'design',
      action: 'Uploaded Document',
      category: 'DOCUMENTS',
      targetId: newDoc.docNumber,
      details: `Registered engineering document "${newDoc.title}" (${newDoc.docNumber} Rev ${newDoc.revision}).`,
    });

    return res.status(201).json({
      success: true,
      message: 'Document created successfully.',
      document: newDoc,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update document
// @route   PUT /api/documents/:id
// @access  Private
const updateDocument = async (req, res, next) => {
  try {
    const doc = await findDocumentByIdOrNumber(req.params.id);
    if (!doc) {
      return res.status(404).json({
        success: false,
        message: 'Document not found.',
      });
    }

    const updates = req.body;
    Object.keys(updates).forEach((key) => {
      if (key !== '_id' && key !== 'id') {
        doc[key] = updates[key];
      }
    });

    await doc.save();

    return res.status(200).json({
      success: true,
      message: 'Document updated successfully.',
      document: doc,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete document
// @route   DELETE /api/documents/:id
// @access  Private
const deleteDocument = async (req, res, next) => {
  try {
    const doc = await findDocumentByIdOrNumber(req.params.id);
    if (!doc) {
      return res.status(404).json({
        success: false,
        message: 'Document not found.',
      });
    }

    const docNum = doc.docNumber;
    await Document.findByIdAndDelete(doc._id);

    await AuditLog.create({
      user: req.user?.name || 'Engineering User',
      persona: req.user?.personaKey || 'design',
      action: 'Deleted Document',
      category: 'DOCUMENTS',
      targetId: docNum,
      details: `Removed document ${docNum} from vault.`,
    });

    return res.status(200).json({
      success: true,
      message: `Document ${docNum} deleted successfully.`,
      deletedId: doc._id.toString(),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Download document file
// @route   GET /api/documents/:id/download
// @access  Public (or Private)
const downloadDocumentFile = async (req, res, next) => {
  try {
    const doc = await findDocumentByIdOrNumber(req.params.id);
    if (!doc) {
      return res.status(404).json({
        success: false,
        message: 'Document not found.',
      });
    }

    if (!doc.fileUrl) {
      return res.status(404).json({
        success: false,
        message: 'No physical file is attached to this document.',
      });
    }

    const downloadName = doc.fileName || doc.title || `${doc.docNumber}.${doc.fileExtension || 'bin'}`;

    if (doc.fileUrl.startsWith('data:')) {
      const parts = doc.fileUrl.split(',');
      const mimeMatch = parts[0].match(/:(.*?);/);
      const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
      const fileBuffer = Buffer.from(parts[1], 'base64');

      res.setHeader('Content-Type', mime);
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(downloadName)}"`);
      res.setHeader('Content-Length', fileBuffer.length);
      return res.send(fileBuffer);
    }

    // Direct redirect if external or relative URL
    return res.redirect(doc.fileUrl);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDocuments,
  getDocumentById,
  createDocument,
  updateDocument,
  deleteDocument,
  downloadDocumentFile,
};

