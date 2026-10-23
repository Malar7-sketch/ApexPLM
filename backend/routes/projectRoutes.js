const express = require('express');
const router = express.Router();
const {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
} = require('../controllers/projectController');
const { getBOM, saveBOM } = require('../controllers/bomController');

router.route('/')
  .get(getProjects)
  .post(createProject);

router.route('/:id')
  .get(getProjectById)
  .put(updateProject)
  .delete(deleteProject);

// BOM nested under project
router.route('/:projectId/bom')
  .get(getBOM)
  .post(saveBOM);

module.exports = router;
