const mongoose = require('mongoose');
const NCR = require('../models/NCR');
const AuditLog = require('../models/AuditLog');

const findNcrByIdOrNumber = async (idParam) => {
  if (mongoose.Types.ObjectId.isValid(idParam)) {
    const ncr = await NCR.findById(idParam);
    if (ncr) return ncr;
  }
  return await NCR.findOne({
    $or: [{ ncrNumber: idParam }, { id: idParam }],
  });
};

// @desc    Get all NCRs
// @route   GET /api/ncrs
// @access  Public (or Private)
const getNCRs = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.projectId) filter.projectId = req.query.projectId;
    if (req.query.status && req.query.status !== 'ALL') filter.status = req.query.status;

    const ncrs = await NCR.find(filter).sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      count: ncrs.length,
      ncrs,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get NCR by ID or number
// @route   GET /api/ncrs/:id
// @access  Public (or Private)
const getNCRById = async (req, res, next) => {
  try {
    const ncr = await findNcrByIdOrNumber(req.params.id);
    if (!ncr) {
      return res.status(404).json({
        success: false,
        message: 'NCR record not found.',
      });
    }
    return res.status(200).json({
      success: true,
      ncr,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new NCR
// @route   POST /api/ncrs
// @access  Private
const createNCR = async (req, res, next) => {
  try {
    const {
      ncrNumber,
      title,
      description,
      severity,
      status,
      type,
      impactedPartId,
      impactedPartNumber,
      impactedPartName,
      projectId,
      projectName,
      supplierId,
      supplierName,
      defectCategory,
      rootCause,
      containmentAction,
      correctiveAction,
      loggedBy,
      assignedTo,
      targetClosureDate,
      costImpact,
      downtimeHours,
      scrapQuantity,
      disposition,
      attachments,
      history,
    } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'NCR title is required.',
      });
    }

    let generatedNcrNumber = ncrNumber;
    if (!generatedNcrNumber) {
      const count = await NCR.countDocuments();
      generatedNcrNumber = `NCR-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`;
    }

    const newNcr = await NCR.create({
      ncrNumber: generatedNcrNumber,
      title: title.trim(),
      description: description || '',
      severity: severity || 'Minor',
      status: status || 'Open',
      type: type || 'In-Process Machining',
      impactedPartId: impactedPartId || '',
      impactedPartNumber: impactedPartNumber || '',
      impactedPartName: impactedPartName || '',
      projectId: projectId || '',
      projectName: projectName || '',
      supplierId: supplierId || '',
      supplierName: supplierName || '',
      defectCategory: defectCategory || 'Dimensional',
      rootCause: rootCause || '',
      containmentAction: containmentAction || '',
      correctiveAction: correctiveAction || '',
      loggedBy: loggedBy || req.user?.name || 'Quality Lead Auditor',
      assignedTo: assignedTo || 'Manufacturing Engineer',
      dateLogged: new Date().toISOString().split('T')[0],
      targetClosureDate: targetClosureDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      costImpact: Number(costImpact) || 0,
      downtimeHours: Number(downtimeHours) || 0,
      scrapQuantity: Number(scrapQuantity) || 0,
      disposition: disposition || 'Pending',
      attachments: attachments || [],
      history: history || [],
    });

    await AuditLog.create({
      user: req.user?.name || 'Quality Engineer',
      persona: req.user?.personaKey || 'quality',
      action: 'Created NCR',
      category: 'QUALITY',
      targetId: newNcr.ncrNumber,
      details: `Logged non-conformance report "${newNcr.title}" (${newNcr.ncrNumber} - ${newNcr.severity}).`,
    });

    return res.status(201).json({
      success: true,
      message: 'NCR created successfully.',
      ncr: newNcr,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update NCR
// @route   PUT /api/ncrs/:id
// @access  Private
const updateNCR = async (req, res, next) => {
  try {
    const ncr = await findNcrByIdOrNumber(req.params.id);
    if (!ncr) {
      return res.status(404).json({
        success: false,
        message: 'NCR record not found.',
      });
    }

    const updates = req.body;
    Object.keys(updates).forEach((key) => {
      if (key !== '_id' && key !== 'id') {
        ncr[key] = updates[key];
      }
    });

    if (updates.status === 'Closed' && !ncr.closedDate) {
      ncr.closedDate = new Date().toISOString().split('T')[0];
    }

    await ncr.save();

    await AuditLog.create({
      user: req.user?.name || 'Quality User',
      persona: req.user?.personaKey || 'quality',
      action: 'Updated NCR',
      category: 'QUALITY',
      targetId: ncr.ncrNumber,
      details: `Updated NCR ${ncr.ncrNumber} status to "${ncr.status}".`,
    });

    return res.status(200).json({
      success: true,
      message: 'NCR updated successfully.',
      ncr,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete NCR
// @route   DELETE /api/ncrs/:id
// @access  Private
const deleteNCR = async (req, res, next) => {
  try {
    const ncr = await findNcrByIdOrNumber(req.params.id);
    if (!ncr) {
      return res.status(404).json({
        success: false,
        message: 'NCR record not found.',
      });
    }

    const ncrNum = ncr.ncrNumber;
    await NCR.findByIdAndDelete(ncr._id);

    await AuditLog.create({
      user: req.user?.name || 'Quality User',
      persona: req.user?.personaKey || 'quality',
      action: 'Deleted NCR',
      category: 'QUALITY',
      targetId: ncrNum,
      details: `Permanently removed NCR ${ncrNum} from registry.`,
    });

    return res.status(200).json({
      success: true,
      message: `NCR ${ncrNum} deleted successfully.`,
      deletedId: ncr._id.toString(),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNCRs,
  getNCRById,
  createNCR,
  updateNCR,
  deleteNCR,
};
