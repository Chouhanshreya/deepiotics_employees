const User = require('../models/User');
const PointHistory = require('../models/PointHistory');
const MonthlyArchive = require('../models/MonthlyArchive');

// @desc    Get TL leaderboard (TL ranked by their team's total points)
// @route   GET /api/admin/leaderboard/tls
// @access  Private (Admin, TL)
exports.getTLLeaderboard = async (req, res) => {
  try {
    const tls = await User.find({ role: 'TL' }).select('-password');

    const tlsWithTeamPoints = await Promise.all(
      tls.map(async (tl) => {
        const teamMembers = await User.find({ teamLead: tl._id, role: 'Employee' });
        const teamPoints = teamMembers.reduce((sum, emp) => sum + emp.points, 0);
        return {
          ...tl.toJSON(),
          teamPoints,
          teamSize: teamMembers.length
        };
      })
    );

    // Sort by team points descending, tie-break by join date
    tlsWithTeamPoints.sort((a, b) => {
      if (b.teamPoints !== a.teamPoints) return b.teamPoints - a.teamPoints;
      return new Date(a.joinDate) - new Date(b.joinDate);
    });

    const ranked = tlsWithTeamPoints.map((tl, index) => ({
      ...tl,
      rank: index + 1
    }));

    res.json(ranked);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Declare Best Employee of the Month
// @route   POST /api/admin/best-employee
// @access  Private (Admin)
exports.declareBestEmployee = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'Please provide userId' });
    }

    const user = await User.findById(userId);
    if (!user || user.role !== 'Employee') {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Clear previous best employee flag
    await User.updateMany({ isBestEmployee: true }, { isBestEmployee: false });

    // Set new best employee
    user.isBestEmployee = true;
    await user.save();

    res.json({ message: `${user.name} declared as Best Employee of the Month!`, user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Declare Best TL of the Month
// @route   POST /api/admin/best-tl
// @access  Private (Admin)
exports.declareBestTL = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'Please provide userId' });
    }

    const user = await User.findById(userId);
    if (!user || user.role !== 'TL') {
      return res.status(404).json({ message: 'TL not found' });
    }

    // Clear previous best TL flag
    await User.updateMany({ isBestTL: true }, { isBestTL: false });

    // Set new best TL
    user.isBestTL = true;
    await user.save();

    res.json({ message: `${user.name} declared as Best TL of the Month!`, user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get current best performers
// @route   GET /api/admin/best-performers
// @access  Private
exports.getBestPerformers = async (req, res) => {
  try {
    const bestEmployee = await User.findOne({ isBestEmployee: true }).select('-password');
    const bestTL = await User.findOne({ isBestTL: true }).select('-password');

    res.json({ bestEmployee, bestTL });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Reset monthly points — archive current data, zero out points
// @route   POST /api/admin/reset-month
// @access  Private (Admin)
exports.resetMonth = async (req, res) => {
  try {
    const now = new Date();
    const month = now.getMonth() + 1; // 1-indexed
    const year = now.getFullYear();

    // Check if already reset this month
    const existing = await MonthlyArchive.findOne({ month, year });
    if (existing) {
      return res.status(400).json({
        message: `Month ${month}/${year} has already been reset and archived.`
      });
    }

    // Get all non-admin users for snapshot
    const allUsers = await User.find({ role: { $ne: 'Admin' } }).select('-password');

    // Sort employees by points for ranking
    const employees = allUsers
      .filter(u => u.role === 'Employee')
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        return new Date(a.joinDate) - new Date(b.joinDate);
      });

    // Build TL ranking by team points
    const tls = allUsers.filter(u => u.role === 'TL');
    const tlsWithTeamPoints = await Promise.all(
      tls.map(async (tl) => {
        const teamMembers = await User.find({ teamLead: tl._id, role: 'Employee' });
        const teamPoints = teamMembers.reduce((sum, emp) => sum + emp.points, 0);
        return { tl, teamPoints };
      })
    );
    tlsWithTeamPoints.sort((a, b) => b.teamPoints - a.teamPoints);

    // Build snapshots array
    const snapshots = [
      ...employees.map((u, i) => ({
        userId: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        department: u.department,
        points: u.points,
        rank: i + 1
      })),
      ...tlsWithTeamPoints.map(({ tl }, i) => ({
        userId: tl._id,
        name: tl.name,
        email: tl.email,
        role: tl.role,
        department: tl.department,
        points: tl.points,
        rank: i + 1
      }))
    ];

    // Determine best performers for archive
    const bestEmployeeUser = employees[0] || null;
    const bestTLData = tlsWithTeamPoints[0] || null;

    const archiveBestEmployee = bestEmployeeUser
      ? { userId: bestEmployeeUser._id, name: bestEmployeeUser.name, department: bestEmployeeUser.department, points: bestEmployeeUser.points }
      : null;

    const archiveBestTL = bestTLData
      ? { userId: bestTLData.tl._id, name: bestTLData.tl.name, department: bestTLData.tl.department, teamPoints: bestTLData.teamPoints }
      : null;

    // Save archive
    await MonthlyArchive.create({
      month,
      year,
      snapshots,
      bestEmployee: archiveBestEmployee,
      bestTL: archiveBestTL,
      resetBy: req.user._id
    });

    // Add to each user's monthlyHistory and reset points
    for (const u of allUsers) {
      const snap = snapshots.find(s => s.userId.toString() === u._id.toString());
      if (snap) {
        u.monthlyHistory = u.monthlyHistory || [];
        u.monthlyHistory.push({ month, year, points: snap.points, rank: snap.rank });
      }
      u.points = 0;
      u.isBestEmployee = false;
      u.isBestTL = false;
      await u.save();
    }

    // Clear point history for this month (archive is saved, no need to keep raw entries)
    // We keep raw entries for audit — do NOT delete PointHistory

    res.json({
      message: `Month ${month}/${year} has been reset. All points archived.`,
      archive: { month, year, totalUsers: allUsers.length }
    });
  } catch (error) {
    console.error('Reset month error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get monthly archives
// @route   GET /api/admin/archives
// @access  Private (Admin)
exports.getArchives = async (req, res) => {
  try {
    const archives = await MonthlyArchive.find()
      .sort({ year: -1, month: -1 })
      .select('-snapshots'); // Don't send full snapshot in list view

    res.json(archives);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get single archive
// @route   GET /api/admin/archives/:id
// @access  Private (Admin)
exports.getArchiveById = async (req, res) => {
  try {
    const archive = await MonthlyArchive.findById(req.params.id);
    if (!archive) {
      return res.status(404).json({ message: 'Archive not found' });
    }
    res.json(archive);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
