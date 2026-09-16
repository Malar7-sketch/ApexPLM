const express = require('express');
const router = express.Router();
const { getAuditLogs, createAuditLog } = require('../controllers/auditController');

router.route('/')
  .get(getAuditLogs)
  .post(createAuditLog);

module.exports = router;
