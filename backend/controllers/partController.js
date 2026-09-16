const mongoose = require('mongoose');
const Part = require('../models/Part');
const AuditLog = require('../models/AuditLog');

const findPartByIdOrNumber = async (idParam) => {
  if (mongoose.Types.ObjectId.isValid(idParam)) {
    const part = await Part.findById(idParam);
    if (part) return part;
  }
  return await Part.findOne({
    $or: [{ partNumber: idParam }, { id: idParam }],
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
    const part = await findPartByIdOrNumber(req.params.id);
    if (!part) {
      return res.status(404).json({
        success: false,
        message: 'Part not found.',
      });
    }

    const pNum = part.partNumber;
    await Part.findByIdAndDelete(part._id);

    await AuditLog.create({
      user: req.user?.name || 'Engineering User',
      persona: req.user?.personaKey || 'design',
      action: 'Deleted Part Master',
      category: 'ITEM_MASTER',
      targetId: pNum,
      details: `Removed part record ${pNum} from item master.`,
    });

    return res.status(200).json({
      success: true,
      message: `Part ${pNum} deleted successfully.`,
      deletedId: part._id.toString(),
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
