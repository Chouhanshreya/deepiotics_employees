const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getLeaderboard,
  getTeamMembers,
  assignPoints,
  getPointHistory
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

router.get('/leaderboard', protect, getLeaderboard);
router.get('/team', protect, authorize('Employee'), getTeamMembers);

router.route('/')
  .get(protect, authorize('Admin', 'TL'), getAllUsers)
  .post(protect, authorize('Admin', 'TL'), createUser);

router.route('/:id')
  .get(protect, getUserById)
  .put(protect, authorize('Admin'), updateUser)
  .delete(protect, authorize('Admin'), deleteUser);

router.post('/:id/points', protect, authorize('Admin', 'TL'), assignPoints);
router.get('/:id/points/history', protect, getPointHistory);

module.exports = router;
