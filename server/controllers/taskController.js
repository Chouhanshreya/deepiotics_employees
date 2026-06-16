const Task = require('../models/Task');
const User = require('../models/User');

// @desc    Get all tasks
// @route   GET /api/tasks
// @access  Private (Admin, TL)
exports.getAllTasks = async (req, res) => {
  try {
    let query = {};

    // If TL, only show tasks for their team members
    if (req.user.role === 'TL') {
      const teamMembers = await User.find({ teamLead: req.user._id }).select('_id');
      const teamMemberIds = teamMembers.map(member => member._id);
      query = { assignedTo: { $in: teamMemberIds } };
    }

    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name')
      .sort('-createdAt');

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get tasks for current user
// @route   GET /api/tasks/my-tasks
// @access  Private
exports.getMyTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ assignedTo: req.user._id })
      .populate('createdBy', 'name')
      .sort('-createdAt');

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create task
// @route   POST /api/tasks
// @access  Private (Admin, TL)
exports.createTask = async (req, res) => {
  try {
    const { title, description, assignedTo, points } = req.body;

    if (!title || !assignedTo) {
      return res.status(400).json({ message: 'Please provide title and assignedTo' });
    }

    // Check if assigned user exists
    const user = await User.findById(assignedTo);
    if (!user) {
      return res.status(404).json({ message: 'Assigned user not found' });
    }

    // TL can only assign tasks to their team members
    if (req.user.role === 'TL' && user.teamLead?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only assign tasks to your team members' });
    }

    const task = await Task.create({
      title,
      description: description || '',
      assignedTo,
      points: points || 0,
      createdBy: req.user._id
    });

    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name');

    res.status(201).json(populatedTask);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
exports.updateTask = async (req, res) => {
  try {
    const { title, description, status, points } = req.body;

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user has permission
    const isAssignedUser = task.assignedTo.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'Admin';
    const isTL = req.user.role === 'TL';

    if (!isAssignedUser && !isAdmin && !isTL) {
      return res.status(403).json({ message: 'Not authorized to update this task' });
    }

    // Update fields
    if (title) task.title = title;
    if (description !== undefined) task.description = description;
    if (status) {
      const oldStatus = task.status;
      task.status = status;

      // If task is completed, add points and increment tasksCompleted
      if (status === 'Done' && oldStatus !== 'Done') {
        const user = await User.findById(task.assignedTo);
        if (user) {
          user.points += task.points;
          user.tasksCompleted += 1;
          await user.save();
        }
      }
    }
    if (points !== undefined && (isAdmin || isTL)) {
      task.points = points;
    }

    await task.save();

    const updatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name');

    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private (Admin, TL)
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    await task.deleteOne();

    res.json({ message: 'Task removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
