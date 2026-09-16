const express = require('express');
const router = express.Router();
const {
  getDocuments,
  getDocumentById,
  createDocument,
  updateDocument,
  deleteDocument,
} = require('../controllers/documentController');

router.route('/')
  .get(getDocuments)
  .post(createDocument);

router.route('/:id')
  .get(getDocumentById)
  .put(updateDocument)
  .delete(deleteDocument);

module.exports = router;
