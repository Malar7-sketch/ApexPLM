const mongoose = require('mongoose');
const BOM = require('../models/BOM');
const AuditLog = require('../models/AuditLog');

// @desc    Get BOM for a part or project
// @route   GET /api/projects/:projectId/bom or GET /api/bom/:partId
// @access  Public (or Private)
const getBOM = async (req, res, next) => {
  try {
    const key = req.params.projectId || req.params.partId || req.params.id;
    const bom = await BOM.findOne({
      $or: [{ partId: key }, { projectId: key }, { 'rootNode.id': key }, { 'rootNode.partNumber': key }],
    });

    if (!bom) {
      return res.status(404).json({
        success: false,
        message: 'BOM not found for specified identifier.',
      });
    }

    return res.status(200).json({
      success: true,
      bom,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all BOM trees
// @route   GET /api/bom
// @access  Public
const getAllBOMs = async (req, res, next) => {
  try {
    const boms = await BOM.find({});
    return res.status(200).json({
      success: true,
      count: boms.length,
      boms,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Save/Create BOM
// @route   POST /api/projects/:projectId/bom or POST /api/bom
// @access  Private
const saveBOM = async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.body.projectId;
    const { partId, rootNode } = req.body;

    if (!partId || !rootNode) {
      return res.status(400).json({
        success: false,
        message: 'partId and rootNode are required.',
      });
    }

    let bom = await BOM.findOne({ partId });
    if (bom) {
      bom.rootNode = rootNode;
      if (projectId) bom.projectId = projectId;
      await bom.save();
    } else {
      bom = await BOM.create({
        partId,
        rootNode,
        projectId,
      });
    }

    await AuditLog.create({
      user: req.user?.name || 'Engineering User',
      persona: req.user?.personaKey || 'design',
      action: 'Updated BOM Structure',
      category: 'BOM',
      targetId: partId,
      details: `Saved BOM revision hierarchy for ${rootNode.name || partId}.`,
    });

    return res.status(200).json({
      success: true,
      message: 'BOM saved successfully.',
      bom,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update BOM by ID
// @route   PUT /api/bom/:id
// @access  Private
const updateBOM = async (req, res, next) => {
  try {
    const bomId = req.params.id;
    let bom;
    if (mongoose.Types.ObjectId.isValid(bomId)) {
      bom = await BOM.findById(bomId);
    }
    if (!bom) {
      bom = await BOM.findOne({ partId: bomId });
    }

    if (!bom) {
      return res.status(404).json({
        success: false,
        message: 'BOM not found.',
      });
    }

    if (req.body.rootNode) bom.rootNode = req.body.rootNode;
    if (req.body.projectId) bom.projectId = req.body.projectId;
    await bom.save();

    return res.status(200).json({
      success: true,
      message: 'BOM updated successfully.',
      bom,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete BOM
// @route   DELETE /api/bom/:id
// @access  Private
const deleteBOM = async (req, res, next) => {
  try {
    const bomId = req.params.id;
    let deleted;
    if (mongoose.Types.ObjectId.isValid(bomId)) {
      deleted = await BOM.findByIdAndDelete(bomId);
    }
    if (!deleted) {
      deleted = await BOM.findOneAndDelete({ partId: bomId });
    }

    if (!deleted) {
      return res.status(200).json({
        success: true,
        message: 'BOM already deleted or not found.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'BOM deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBOM,
  getAllBOMs,
  saveBOM,
  updateBOM,
  deleteBOM,
};
