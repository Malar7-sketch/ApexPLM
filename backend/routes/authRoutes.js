const express = require('express');
const router = express.Router();
const { loginUser, getMe } = require('../controllers/authController');
const { requireAuth } = require('../middleware/authMiddleware');

router.post('/login', loginUser);
router.get('/me', requireAuth, getMe);

module.exports = router;
