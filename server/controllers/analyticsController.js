const User = require('../models/User');
const PointHistory = require('../models/PointHistory');
const Task = require('../models/Task');

// @desc    Get overview stats
// @route   GET /api/analytics/overview
// @access  Private (Admin, TL)
exports.getOverview = async (req, res) => {
  try {
    let query = {};

    // If TL, show stats for all Employees and TLs (not Admins)
    if (req.user.role === 'TL') {
      query = { role: { $in: ['Employee', 'TL'] } };
    }

    // Total employees
    const totalEmployees = await User.countDocuments({ 
      ...query, 
      role: 'Employee' 
    });

    // Total points distributed
    const users = await User.find({ ...query, role: 'Employee' });
    const totalPoints = users.reduce((sum, user) => sum + user.points, 0);

    // Top performer
    const topPerformer = await User.findOne({ ...query, role: 'Employee' })
      .sort('-points')
      .select('-password');

    // Active streaks count (users with streak > 0)
    const activeStreaks = await User.countDocuments({ 
      ...query, 
      role: 'Employee',
      activeStreak: { $gt: 0 }
    });

    res.json({
      totalEmployees,
      totalPoints,
      topPerformer,
      activeStreaks
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get top performers
// @route   GET /api/analytics/top-performers
// @access  Private (Admin, TL)
exports.getTopPerformers = async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'TL') {
      query = { role: { $in: ['Employee', 'TL'] } };
    }

    const topPerformers = await User.find({ ...query, role: 'Employee' })
      .select('-password')
      .sort('-points')
      .limit(10);

    res.json(topPerformers);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get points distribution over time
// @route   GET /api/analytics/points-timeline
// @access  Private (Admin, TL)
exports.getPointsTimeline = async (req, res) => {
  try {
    const { period = 'weekly' } = req.query;

    let query = {};
    
    if (req.user.role === 'TL') {
      // Get all Employees and TLs (not Admins)
      const users = await User.find({ role: { $in: ['Employee', 'TL'] } }).select('_id');
      const userIds = users.map(user => user._id);
      query = { employee: { $in: userIds } };
    }

    // Get point history
    const pointHistory = await PointHistory.find(query).sort('createdAt');

    // Group by period
    const timeline = {};
    
    pointHistory.forEach(entry => {
      const date = new Date(entry.createdAt);
      let key;

      if (period === 'weekly') {
        // Get week start date
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else {
        // Monthly
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }

      if (!timeline[key]) {
        timeline[key] = 0;
      }
      timeline[key] += entry.points;
    });

    // Convert to array format
    const result = Object.keys(timeline).map(key => ({
      period: key,
      points: timeline[key]
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get user stats
// @route   GET /api/analytics/user-stats/:id
// @access  Private
exports.getUserStats = async (req, res) => {
  try {
    const userId = req.params.id || req.user._id;

    // Get user
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get monthly points (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyPoints = await PointHistory.aggregate([
      {
        $match: {
          employee: user._id,
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          total: { $sum: '$points' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Get tasks completed this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const tasksThisMonth = await Task.countDocuments({
      assignedTo: userId,
      status: 'Done',
      updatedAt: { $gte: startOfMonth }
    });

    res.json({
      user,
      monthlyPoints,
      tasksThisMonth,
      totalTasks: user.tasksCompleted,
      streak: user.activeStreak
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
