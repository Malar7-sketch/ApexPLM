const express = require('express');
const router = express.Router();
const {
  getDocuments,
  getDocumentById,
  createDocument,
  updateDocument,
  deleteDocument,
  downloadDocumentFile,
} = require('../controllers/documentController');

router.route('/')
  .get(getDocuments)
  .post(createDocument);

router.route('/:id/download')
  .get(downloadDocumentFile);

router.route('/:id')
  .get(getDocumentById)
  .put(updateDocument)
  .delete(deleteDocument);

module.exports = router;
