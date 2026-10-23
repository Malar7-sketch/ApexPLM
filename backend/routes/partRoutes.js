const express = require('express');
const router = express.Router();
const {
  getParts,
  getPartById,
  createPart,
  updatePart,
  deletePart,
} = require('../controllers/partController');

router.route('/')
  .get(getParts)
  .post(createPart);

router.route('/:id')
  .get(getPartById)
  .put(updatePart)
  .delete(deletePart);

module.exports = router;
