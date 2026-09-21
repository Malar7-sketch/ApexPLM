const mongoose = require('mongoose');
const Part = require('../models/Part');
const BOM = require('../models/BOM');
const Document = require('../models/Document');
const NCR = require('../models/NCR');
const AuditLog = require('../models/AuditLog');

const findPartByIdOrNumber = async (idParam) => {
  if (!idParam) return null;
  if (mongoose.Types.ObjectId.isValid(idParam)) {
    const part = await Part.findById(idParam);
    if (part) return part;
  }
  const escapedParam = String(idParam).trim();
  const regex = new RegExp(`^${escapedParam}$`, 'i');
  return await Part.findOne({
    $or: [{ partNumber: escapedParam }, { id: escapedParam }, { partNumber: regex }, { name: regex }],
  });
};

// @desc    Get all parts
// @route   GET /api/parts
// @access  Public (or Private)
const getParts = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.projectId) filter.projectId = req.query.projectId;

    const parts = await Part.find(filter).sort({ createdAt: 1 });
    return res.status(200).json({
      success: true,
      count: parts.length,
      parts,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get part by ID or partNumber
// @route   GET /api/parts/:id
// @access  Public (or Private)
const getPartById = async (req, res, next) => {
  try {
    const part = await findPartByIdOrNumber(req.params.id);
    if (!part) {
      return res.status(404).json({
        success: false,
        message: 'Part not found.',
      });
    }
    return res.status(200).json({
      success: true,
      part,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new part
// @route   POST /api/parts
// @access  Private
const createPart = async (req, res, next) => {
  try {
    const {
      partNumber,
      name,
      description,
      type,
      category,
      material,
      weightKg,
      estimatedCost,
      actualCost,
      currentRev,
      lifecycleStage,
      projectId,
      projectName,
      cadMetadata,
      tags,
    } = req.body;

    if (!partNumber || !name) {
      return res.status(400).json({
        success: false,
        message: 'partNumber and name are required.',
      });
    }

    const existing = await Part.findOne({ partNumber });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Part with number ${partNumber} already exists.`,
      });
    }

    const newPart = await Part.create({
      partNumber,
      name,
      description: description || '',
      type: type || 'Component',
      category: category || 'CNC Machined',
      material: material || 'Aluminum 6061-T6',
      weightKg: Number(weightKg) || 0,
      estimatedCost: Number(estimatedCost) || 0,
      actualCost: Number(actualCost) || 0,
      currentRev: currentRev || 'A.1',
      lifecycleStage: lifecycleStage || 'design',
      projectId: projectId || '',
      projectName: projectName || '',
      cadMetadata: cadMetadata || {},
      tags: tags || [],
    });

    await AuditLog.create({
      user: req.user?.name || 'Engineering User',
      persona: req.user?.personaKey || 'design',
      action: 'Created Part Master',
      category: 'ITEM_MASTER',
      targetId: newPart.partNumber,
      details: `Created new item "${newPart.name}" (${newPart.partNumber}).`,
    });

    return res.status(201).json({
      success: true,
      message: 'Part created successfully.',
      part: newPart,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update part
// @route   PUT /api/parts/:id
// @access  Private
const updatePart = async (req, res, next) => {
  try {
    const part = await findPartByIdOrNumber(req.params.id);
    if (!part) {
      return res.status(404).json({
        success: false,
        message: 'Part not found.',
      });
    }

    const updates = req.body;
    Object.keys(updates).forEach((key) => {
      if (key !== '_id' && key !== 'id') {
        part[key] = updates[key];
      }
    });

    await part.save();

    return res.status(200).json({
      success: true,
      message: 'Part updated successfully.',
      part,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete part
// @route   DELETE /api/parts/:id
// @access  Private
const deletePart = async (req, res, next) => {
  try {
    const rawParam = String(req.params.id || '').trim();
    if (!rawParam) {
      return res.status(400).json({ success: false, message: 'Part identifier is required.' });
    }

    const part = await findPartByIdOrNumber(rawParam);
    if (!part) {
      const regex = new RegExp(`^${rawParam}$`, 'i');
      const directDelete = await Part.findOneAndDelete({
        $or: [{ partNumber: rawParam }, { id: rawParam }, { partNumber: regex }, { name: regex }],
      });
      if (directDelete) {
        const pNum = directDelete.partNumber;
        const pId = directDelete._id.toString();
        await BOM.deleteMany({ $or: [{ partId: pNum }, { partId: pId }, { 'rootNode.partNumber': pNum }, { 'rootNode.partId': pId }] });
        await Document.deleteMany({ $or: [{ linkedPartId: pNum }, { linkedPartId: pId }] });
        await NCR.deleteMany({ $or: [{ impactedPartId: pNum }, { impactedPartId: pId }, { impactedPartNumber: pNum }] });
        return res.status(200).json({
          success: true,
          message: `Part ${pNum} deleted successfully from database.`,
          deletedId: pId,
          deletedPartNumber: pNum,
        });
      }
      return res.status(404).json({
        success: false,
        message: 'Part not found in database.',
      });
    }

    const pNum = part.partNumber;
    const pId = part._id.toString();
    await Part.findByIdAndDelete(part._id);
    await Part.deleteMany({ $or: [{ partNumber: pNum }, { partNumber: new RegExp(`^${pNum}$`, 'i') }] });

    // Cascade delete linked BOM, documents, and NCRs in MongoDB
    await BOM.deleteMany({ $or: [{ partId: pNum }, { partId: pId }, { 'rootNode.partNumber': pNum }, { 'rootNode.partId': pId }] });
    await Document.deleteMany({ $or: [{ linkedPartId: pNum }, { linkedPartId: pId }] });
    await NCR.deleteMany({ $or: [{ impactedPartId: pNum }, { impactedPartId: pId }, { impactedPartNumber: pNum }] });

    await AuditLog.create({
      user: req.user?.name || 'Engineering User',
      persona: req.user?.personaKey || 'design',
      action: 'Deleted Part Master',
      category: 'ITEM_MASTER',
      targetId: pNum,
      details: `Removed part record ${pNum} from item master in MongoDB Atlas.`,
    });

    return res.status(200).json({
      success: true,
      message: `Part ${pNum} deleted successfully from database.`,
      deletedId: pId,
      deletedPartNumber: pNum,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getParts,
  getPartById,
  createPart,
  updatePart,
  deletePart,
};
