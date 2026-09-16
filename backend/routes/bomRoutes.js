const express = require('express');
const router = express.Router();
const {
  getBOM,
  getAllBOMs,
  saveBOM,
  updateBOM,
  deleteBOM,
} = require('../controllers/bomController');

router.route('/')
  .get(getAllBOMs)
  .post(saveBOM);

router.route('/:id')
  .get(getBOM)
  .put(updateBOM)
  .delete(deleteBOM);

module.exports = router;
