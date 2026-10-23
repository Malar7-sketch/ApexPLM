const express = require('express');
const router = express.Router();
const {
  getNCRs,
  getNCRById,
  createNCR,
  updateNCR,
  deleteNCR,
} = require('../controllers/ncrController');

router.route('/')
  .get(getNCRs)
  .post(createNCR);

router.route('/:id')
  .get(getNCRById)
  .put(updateNCR)
  .delete(deleteNCR);

module.exports = router;
