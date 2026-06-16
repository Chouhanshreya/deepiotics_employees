const express = require('express');
const router = express.Router();
const {
  getAllTasks,
  getMyTasks,
  createTask,
  updateTask,
  deleteTask
} = require('../controllers/taskController');
const { protect, authorize } = require('../middleware/auth');

router.get('/my-tasks', protect, getMyTasks);

router.route('/')
  .get(protect, authorize('Admin', 'TL'), getAllTasks)
  .post(protect, authorize('Admin', 'TL'), createTask);

router.route('/:id')
  .put(protect, updateTask)
  .delete(protect, authorize('Admin', 'TL'), deleteTask);

module.exports = router;
