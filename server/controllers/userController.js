const User = require('../models/User');
const PointHistory = require('../models/PointHistory');
const MonthlyPoints = require('../models/MonthlyPoints');

/**
 * Shared helper — ensures a MonthlyPoints row exists for the current month.
 * Called automatically when a user is created or points are assigned.
 * Uses upsert so it's always safe to call — never duplicates.
 */
const ensureCurrentMonthRow = async (userId) => {
  const now   = new Date();
  const month = now.getMonth() + 1;
  const year  = now.getFullYear();
  await MonthlyPoints.findOneAndUpdate(
    { employeeId: userId, month, year },
    { $setOnInsert: { employeeId: userId, month, year, points: 0 } },
    { upsert: true, new: false }
  );
};

// @desc    Get all users (Admin sees all, TL sees their team)
// @route   GET /api/users
// @access  Private (Admin, TL)
exports.getAllUsers = async (req, res) => {
  try {
    let query = {};

    // If TL, show all Employees and TLs, but not Admins
    if (req.user.role === 'TL') {
      query = { 
        role: { $in: ['Employee', 'TL'] }
      };
    }
    // Admin sees everyone (no filter)

    const users = await User.find(query)
      .select('-password')
      .populate('teamLead', 'name email')
      .sort('-points');

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('teamLead', 'name email');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check access permissions
    if (req.user.role === 'Employee') {
      // Employees cannot see TL or Admin profiles
      if (user.role === 'TL' || user.role === 'Admin') {
        return res.status(403).json({ message: 'Access denied' });
      }
      // Employees can see any other Employee profile (for leaderboard)
    } else if (req.user.role === 'TL') {
      // TL can view Employees and other TLs, but not Admins
      if (user.role === 'Admin') {
        return res.status(403).json({ message: 'Access denied' });
      }
    }
    // Admin can view everyone (no restrictions)

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create new user
// @route   POST /api/users
// @access  Private (Admin, TL)
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role, department, teamLead } = req.body;

    // Validate input
    if (!name || !email || !password || !department) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // TL can only create Employees
    if (req.user.role === 'TL' && role !== 'Employee') {
      return res.status(403).json({ message: 'TL can only create Employee accounts' });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'Employee',
      department,
      teamLead: teamLead || (req.user.role === 'TL' ? req.user._id : null)
    });

    // Auto-create current month's MonthlyPoints row (points: 0)
    // so the employee appears in Monthly History from day one
    if (user.role === 'Employee' || user.role === 'TL') {
      await ensureCurrentMonthRow(user._id);
    }

    const userResponse = await User.findById(user._id)
      .select('-password')
      .populate('teamLead', 'name email');

    res.status(201).json(userResponse);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (Admin)
exports.updateUser = async (req, res) => {
  try {
    const { name, email, role, department, teamLead } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (department) user.department = department;
    if (teamLead !== undefined) user.teamLead = teamLead;

    await user.save();

    const updatedUser = await User.findById(user._id)
      .select('-password')
      .populate('teamLead', 'name email');

    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Admin)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.deleteOne();

    res.json({ message: 'User removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get leaderboard
// @route   GET /api/users/leaderboard
// @access  Private
exports.getLeaderboard = async (req, res) => {
  try {
    // Return both Employees and TLs sorted by points (not Admins)
    const users = await User.find({ role: { $in: ['Employee', 'TL'] } })
      .select('-password')
      .populate('teamLead', 'name')
      .sort('-points');

    const leaderboard = users.map((user, index) => ({
      ...user.toJSON(),
      rank: index + 1
    }));

    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get team members
// @route   GET /api/users/team
// @access  Private (Employee, TL)
exports.getTeamMembers = async (req, res) => {
  try {
    let teammates = [];

    if (req.user.role === 'TL') {
      // Team Leads see all employees assigned to them
      teammates = await User.find({
        teamLead: req.user._id,
        role: 'Employee'
      })
        .select('-password')
        .sort('-points');
    } else {
      // Regular employees see teammates (same team lead, excluding self)
      teammates = await User.find({
        teamLead: req.user.teamLead,
        role: 'Employee',
        _id: { $ne: req.user._id }
      })
        .select('-password')
        .sort('-points');
    }

    res.json(teammates);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Assign points to user
// @route   POST /api/users/:id/points
// @access  Private (Admin, TL)
exports.assignPoints = async (req, res) => {
  try {
    const { points, note, category } = req.body;

    // Convert points to number and validate
    const pointsToAdd = parseInt(points, 10);

    if (!pointsToAdd || isNaN(pointsToAdd) || pointsToAdd === 0) {
      return res.status(400).json({ message: 'Please provide valid points (non-zero number)' });
    }

    if (pointsToAdd > 1000 || pointsToAdd < -1000) {
      return res.status(400).json({ message: 'Points must be between -1000 and +1000' });
    }

    const targetUser = await User.findById(req.params.id);

    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Block assigning points to yourself
    if (req.user._id.toString() === targetUser._id.toString()) {
      return res.status(403).json({ message: 'You cannot assign points to yourself' });
    }

    // TL restrictions: can only assign to their direct team employees, not to other TLs or Admins
    if (req.user.role === 'TL') {
      if (targetUser.role !== 'Employee') {
        return res.status(403).json({ message: 'TL can only assign points to Employees, not to other TLs or Admins' });
      }
      if (!targetUser.teamLead || targetUser.teamLead.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'You can only assign points to employees in your own team' });
      }
    }

    // Admin can assign to anyone except themselves (already blocked above) and other Admins
    if (req.user.role === 'Admin' && targetUser.role === 'Admin') {
      return res.status(403).json({ message: 'Admin cannot assign points to another Admin' });
    }

    // Update employee points (can go negative for deductions)
    const currentPoints = parseInt(targetUser.points, 10) || 0;
    targetUser.points = currentPoints + pointsToAdd;
    await targetUser.save();

    console.log(`✅ ${req.user.name} (${req.user.role}) assigned ${pointsToAdd} pts [${category || 'General'}] to ${targetUser.name}. Total: ${targetUser.points}`);

    // Also update MonthlyPoints for the current month (upsert — safe if row doesn't exist yet)
    const now   = new Date();
    const month = now.getMonth() + 1;
    const year  = now.getFullYear();
    await MonthlyPoints.findOneAndUpdate(
      { employeeId: targetUser._id, month, year },
      {
        $inc: { points: pointsToAdd },
        $setOnInsert: { employeeId: targetUser._id, month, year }
      },
      { upsert: true, new: true }
    );

    // Create point history for the employee
    await PointHistory.create({
      employee: targetUser._id,
      points: pointsToAdd,
      note: note || '',
      category: category || 'General',
      assignedBy: req.user._id
    });


    const updatedUser = await User.findById(targetUser._id)
      .select('-password')
      .populate('teamLead', 'name email');

    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get point history for user
// @route   GET /api/users/:id/points/history
// @access  Private
exports.getPointHistory = async (req, res) => {
  try {
    const targetId = req.params.id;

    // All roles can view point history of any Employee
    // (used in leaderboard profile popup for all roles)
    const history = await PointHistory.find({ employee: targetId })
      .populate('assignedBy', 'name role')
      .sort('-createdAt')
      .limit(50);

    res.json(history);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
