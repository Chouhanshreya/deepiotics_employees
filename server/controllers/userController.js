const User = require('../models/User');
const PointHistory = require('../models/PointHistory');

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
      // Employees can only view their own profile or teammates
      if (user._id.toString() !== req.user._id.toString() && 
          user.teamLead?.toString() !== req.user.teamLead?.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
      // Employees cannot see TL or Admin profiles
      if (user.role === 'TL' || user.role === 'Admin') {
        return res.status(403).json({ message: 'Access denied' });
      }
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
    // Get all employees sorted by points
    const users = await User.find({ role: 'Employee' })
      .select('-password')
      .sort('-points');

    // Add rank to each user
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
    const { points, note } = req.body;

    // Convert points to number and validate
    const pointsToAdd = parseInt(points, 10);

    if (!pointsToAdd || isNaN(pointsToAdd) || pointsToAdd <= 0) {
      return res.status(400).json({ message: 'Please provide valid points (positive number)' });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // TL can only assign points to THEIR team members
    if (req.user.role === 'TL') {
      // Check if the user is a member of this TL's team
      if (!user.teamLead || user.teamLead.toString() !== req.user._id.toString()) {
        return res.status(403).json({ 
          message: 'You can only assign points to your team members. This employee belongs to another team or has no team lead.' 
        });
      }
    }

    // Update user points - ensure both are numbers
    const currentPoints = parseInt(user.points, 10) || 0;
    user.points = currentPoints + pointsToAdd;
    await user.save();

    console.log(`✅ ${req.user.name} (${req.user.role}) assigned ${pointsToAdd} points to ${user.name}. New total: ${user.points}`);

    // Create point history
    await PointHistory.create({
      employee: user._id,
      points: pointsToAdd,
      note: note || '',
      assignedBy: req.user._id
    });

    const updatedUser = await User.findById(user._id)
      .select('-password')
      .populate('teamLead', 'name email');

    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get point history for user
// @route   GET /api/users/:id/points/history
// @access  Private (Admin, TL)
exports.getPointHistory = async (req, res) => {
  try {
    const history = await PointHistory.find({ employee: req.params.id })
      .populate('assignedBy', 'name')
      .sort('-createdAt');

    res.json(history);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
