const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔐 Login attempt:', email);

    // Validate input
    if (!email || !password) {
      console.log('❌ Missing email or password');
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Check if user exists
    const user = await User.findOne({ email }).populate('teamLead', 'name');

    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.log('✅ User found:', user.name, user.role);

    // Check password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      console.log('❌ Password mismatch');
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.log('✅ Password correct');

    // Generate token
    const token = generateToken(user._id);
    console.log('✅ Token generated:', token.substring(0, 20) + '...');

    // Set cookie with localhost-friendly settings
    const cookieOptions = {
      httpOnly: true,
      secure: false, // Set to false for localhost
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: '/'
    };

    res.cookie('token', token, cookieOptions);

    console.log('✅ Cookie set with options:', JSON.stringify(cookieOptions, null, 2));
    console.log('✅ Sending response...');

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      points: user.points,
      tier: user.tier,
      teamLead: user.teamLead,
      tasksCompleted: user.tasksCompleted,
      activeStreak: user.activeStreak,
      token
    });
  } catch (error) {
    console.log('❌ Login error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  console.log('👋 Logout request received');
  
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0),
    secure: false,
    sameSite: 'lax',
    path: '/'
  });

  console.log('✅ Cookie cleared, user logged out');
  res.json({ message: 'Logged out successfully' });
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('teamLead', 'name email');

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
