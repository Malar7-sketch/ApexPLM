const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  blockUser,
  unblockUser,
  resetPassword,
} = require('../controllers/userController');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');

router.route('/')
  .get(getUsers)
  .post(createUser);

router.route('/:id')
  .get(getUserById)
  .put(updateUser)
  .delete(deleteUser);

router.patch('/:id/block', blockUser);
router.patch('/:id/unblock', unblockUser);
router.post('/:id/reset-password', resetPassword);

module.exports = router;
