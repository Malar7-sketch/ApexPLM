const mongoose = require('mongoose');
const Project = require('../models/Project');
const Document = require('../models/Document');
const NCR = require('../models/NCR');
const Part = require('../models/Part');
const AuditLog = require('../models/AuditLog');

// Helper to find project by MongoDB _id, code, or custom id
const findProjectByIdOrCode = async (idParam) => {
  if (mongoose.Types.ObjectId.isValid(idParam)) {
    const project = await Project.findById(idParam);
    if (project) return project;
  }
  return await Project.findOne({
    $or: [{ code: idParam }, { id: idParam }],
  });
};

// @desc    Get all projects
// @route   GET /api/projects
// @access  Public (or Private)
const getProjects = async (req, res, next) => {
  try {
    const projects = await Project.find({}).sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      count: projects.length,
      projects,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get project by ID or code
// @route   GET /api/projects/:id
// @access  Public (or Private)
const getProjectById = async (req, res, next) => {
  try {
    const project = await findProjectByIdOrCode(req.params.id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found.',
      });
    }
    return res.status(200).json({
      success: true,
      project,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new project
// @route   POST /api/projects
// @access  Private
const createProject = async (req, res, next) => {
  try {
    const {
      code,
      name,
      customer,
      program,
      stage,
      status,
      progress,
      startDate,
      endDate,
      durationFormatted,
      manager,
      designEngineer,
      mfgEngineer,
      qualityEngineer,
      procurementLead,
      budgetTotal,
      engHoursTotal,
      targetRelease,
      description,
      teamMembers,
      tasks,
    } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Project name is required.',
      });
    }

    let projectCode = code;
    if (!projectCode) {
      const count = await Project.countDocuments();
      projectCode = `PRJ-EV-${String(count + 1).padStart(3, '0')}`;
    }

    const existing = await Project.findOne({ code: projectCode });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Project with code ${projectCode} already exists.`,
      });
    }

    const newProject = await Project.create({
      code: projectCode,
      name: name.trim(),
      customer: customer || '',
      program: program || '',
      stage: stage || 'Design',
      status: status || 'On Track',
      progress: progress || 0,
      startDate: startDate || new Date().toISOString().split('T')[0],
      endDate: endDate || new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0],
      durationFormatted: durationFormatted || '180 Days',
      manager: manager || 'David Sterling',
      designEngineer: designEngineer || 'Alex Rivera, PE',
      mfgEngineer: mfgEngineer || 'Marcus Vance',
      qualityEngineer: qualityEngineer || 'Dr. Elena Rostova',
      procurementLead: procurementLead || 'Sarah Connor',
      budgetTotal: Number(budgetTotal) || 650000,
      engHoursTotal: Number(engHoursTotal) || 2400,
      targetRelease: targetRelease || 'Q4 2026',
      description: description || '',
      teamMembers: teamMembers || [],
      tasks: tasks || [],
    });

    await AuditLog.create({
      user: req.user?.name || 'System User',
      persona: req.user?.personaKey || 'admin',
      action: 'Created Project',
      category: 'PROJECT',
      targetId: newProject.code,
      details: `Created new project "${newProject.name}" (Code: ${newProject.code}).`,
    });

    return res.status(201).json({
      success: true,
      message: 'Project created successfully in MongoDB Atlas.',
      project: newProject,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private
const updateProject = async (req, res, next) => {
  try {
    const project = await findProjectByIdOrCode(req.params.id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found.',
      });
    }

    const updates = req.body;
    Object.keys(updates).forEach((key) => {
      if (key !== '_id' && key !== 'id') {
        project[key] = updates[key];
      }
    });

    await project.save();

    await AuditLog.create({
      user: req.user?.name || 'System User',
      persona: req.user?.personaKey || 'admin',
      action: 'Updated Project',
      category: 'PROJECT',
      targetId: project.code,
      details: `Updated project parameters for "${project.name}" (Code: ${project.code}).`,
    });

    return res.status(200).json({
      success: true,
      message: 'Project updated successfully.',
      project,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete project (CRITICAL SINGLE SOURCE OF TRUTH)
// @route   DELETE /api/projects/:id
// @access  Private
const deleteProject = async (req, res, next) => {
  try {
    const project = await findProjectByIdOrCode(req.params.id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found in database.',
      });
    }

    const pCode = project.code;
    const pName = project.name;
    const pId = project._id.toString();

    // 1. Delete from MongoDB
    await Project.findByIdAndDelete(project._id);

    // 2. Cascade cleanup/unlink from related collections in MongoDB
    await Document.deleteMany({
      $or: [{ projectId: pId }, { projectId: pCode }],
    });

    await NCR.deleteMany({
      $or: [{ projectId: pId }, { projectId: pCode }],
    });

    await Part.updateMany(
      { $or: [{ projectId: pId }, { projectId: pCode }] },
      { $unset: { projectId: '', projectName: '' } }
    );

    // 3. Log deletion audit event
    await AuditLog.create({
      user: req.user?.name || 'System User',
      persona: req.user?.personaKey || 'admin',
      action: 'Deleted Project',
      category: 'PROJECT',
      targetId: pCode,
      details: `Project "${pName}" (${pCode}) was permanently removed from MongoDB Atlas by ${req.user?.name || 'Authorized User'}.`,
    });

    return res.status(200).json({
      success: true,
      message: `Project ${pName} (${pCode}) deleted permanently from database.`,
      deletedId: pId,
      deletedCode: pCode,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
};
