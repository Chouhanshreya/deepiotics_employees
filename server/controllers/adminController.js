const User = require('../models/User');
const PointHistory = require('../models/PointHistory');
const MonthlyArchive = require('../models/MonthlyArchive');
const MonthlyPoints = require('../models/MonthlyPoints');
const Ranking = require('../models/Ranking');
const BestPerformer = require('../models/BestPerformer');

// @desc    Get TL leaderboard (TL ranked by their team's total points)
// @route   GET /api/admin/leaderboard/tls?department=R%26D
// @access  Private (Admin, TL)
exports.getTLLeaderboard = async (req, res) => {
  try {
    const tlFilter = { role: 'TL' };
    if (req.query.department) tlFilter.department = req.query.department;

    const tls = await User.find(tlFilter).select('-password');

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

    // Build accurate isBestTL flags from BestPerformer collection (manual > auto)
    const now   = new Date();
    const month = now.getMonth() + 1;
    const year  = now.getFullYear();
    const depts = [...new Set(tlsWithTeamPoints.map(t => t.department).filter(Boolean))];

    const bestTLIdByDept = {};
    await Promise.all(depts.map(async (dept) => {
      const [manualTL, autoTL] = await Promise.all([
        BestPerformer.findOne({ department: dept, role: 'TL', type: 'manual', month, year }),
        BestPerformer.findOne({ department: dept, role: 'TL', type: 'auto',   month, year }),
      ]);
      const bestTLId = (manualTL?.employeeId || autoTL?.employeeId)?.toString() || null;
      if (bestTLId) bestTLIdByDept[dept] = bestTLId;
    }));

    const ranked = tlsWithTeamPoints.map((tl, index) => ({
      ...tl,
      rank: index + 1,
      isBestTL: bestTLIdByDept[tl.department] === tl._id.toString(),
    }));

    res.json(ranked);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Declare Best Employee of the Month
// @route   POST /api/admin/best-employee
// @body    { userId, department?, type? }  type: 'manual'(default) | 'auto'
// @access  Private (Admin)
exports.declareBestEmployee = async (req, res) => {
  try {
    const { userId, department, type = 'manual' } = req.body;

    if (!userId) return res.status(400).json({ message: 'Please provide userId' });

    const user = await User.findById(userId);
    if (!user || (user.role !== 'Employee' && user.role !== 'TL')) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const now   = new Date();
    const month = now.getMonth() + 1;
    const year  = now.getFullYear();
    const dept  = department || user.department;

    // Upsert — separate record per (dept + role + type + month + year)
    await BestPerformer.findOneAndUpdate(
      { department: dept, role: 'Employee', type, month, year },
      { employeeId: user._id, department: dept, role: 'Employee', type, month, year, declaredBy: req.user._id },
      { upsert: true, new: true }
    );

    // Keep legacy flag in sync
    await User.updateMany({ isBestEmployee: true }, { isBestEmployee: false });
    await User.findByIdAndUpdate(user._id, { isBestEmployee: true });

    const updatedUser = await User.findById(user._id).select('-password');
    res.json({ message: `${user.name} declared as Best Employee of the Month!`, user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Declare Best TL of the Month
// @route   POST /api/admin/best-tl
// @body    { userId, department?, type? }  type: 'manual'(default) | 'auto'
// @access  Private (Admin)
exports.declareBestTL = async (req, res) => {
  try {
    const { userId, department, type = 'manual' } = req.body;

    if (!userId) return res.status(400).json({ message: 'Please provide userId' });

    const user = await User.findById(userId);
    if (!user || user.role !== 'TL') {
      return res.status(404).json({ message: 'Team Lead not found. Make sure you selected a TL.' });
    }

    const now   = new Date();
    const month = now.getMonth() + 1;
    const year  = now.getFullYear();
    const dept  = department || user.department;

    // Upsert — separate record per (dept + role + type + month + year)
    await BestPerformer.findOneAndUpdate(
      { department: dept, role: 'TL', type, month, year },
      { employeeId: user._id, department: dept, role: 'TL', type, month, year, declaredBy: req.user._id },
      { upsert: true, new: true }
    );

    // Keep legacy flag in sync
    await User.updateMany({ isBestTL: true }, { isBestTL: false });
    await User.findByIdAndUpdate(user._id, { isBestTL: true });

    const updatedUser = await User.findById(user._id).select('-password');
    res.json({ message: `${user.name} declared as Best TL of the Month!`, user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get current best performers
// @route   GET /api/admin/best-performers?department=R%26D
// @access  Private
exports.getBestPerformers = async (req, res) => {
  try {
    const now   = new Date();
    const month = now.getMonth() + 1;
    const year  = now.getFullYear();
    const dept  = req.query.department || null;

    if (dept) {
      // Dept-specific: return both auto and manual declared winners
      const [autoEmp, autoTL, manualEmp, manualTL] = await Promise.all([
        BestPerformer.findOne({ department: dept, role: 'Employee', type: 'auto',   month, year }).populate('employeeId', '-password'),
        BestPerformer.findOne({ department: dept, role: 'TL',       type: 'auto',   month, year }).populate('employeeId', '-password'),
        BestPerformer.findOne({ department: dept, role: 'Employee', type: 'manual', month, year }).populate('employeeId', '-password'),
        BestPerformer.findOne({ department: dept, role: 'TL',       type: 'manual', month, year }).populate('employeeId', '-password'),
      ]);

      // For all display pages (Leaderboard, Overview, Home): manual wins over auto
      const bestEmployee = manualEmp?.employeeId || autoEmp?.employeeId || null;
      const bestTL       = manualTL?.employeeId  || autoTL?.employeeId  || null;

      return res.json({
        bestEmployee,
        bestTL,
        // Separate fields for Settings display only
        autoEmployee:   autoEmp?.employeeId   || null,
        autoTL:         autoTL?.employeeId    || null,
        manualEmployee: manualEmp?.employeeId || null,
        manualTL:       manualTL?.employeeId  || null,
        department: dept
      });
    }

    // No dept — return latest declared winner across all depts this month
    const [latestManualEmp, latestAutoEmp, latestManualTL, latestAutoTL] = await Promise.all([
      BestPerformer.findOne({ role: 'Employee', type: 'manual', month, year }).sort({ updatedAt: -1 }).populate('employeeId', '-password'),
      BestPerformer.findOne({ role: 'Employee', type: 'auto',   month, year }).sort({ updatedAt: -1 }).populate('employeeId', '-password'),
      BestPerformer.findOne({ role: 'TL',       type: 'manual', month, year }).sort({ updatedAt: -1 }).populate('employeeId', '-password'),
      BestPerformer.findOne({ role: 'TL',       type: 'auto',   month, year }).sort({ updatedAt: -1 }).populate('employeeId', '-password'),
    ]);

    const bestEmployee = latestManualEmp?.employeeId || latestAutoEmp?.employeeId
      || await User.findOne({ isBestEmployee: true }).select('-password');
    const bestTL = latestManualTL?.employeeId || latestAutoTL?.employeeId
      || await User.findOne({ isBestTL: true }).select('-password');

    return res.json({ bestEmployee, bestTL });
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

// ---------------------------------------------------------------------------
// POST /api/admin/close-month
// Manually close the current month and start the next one.
//
// What it does:
//   1. Finds the latest month that has monthlyPoints data (the "current" month)
//   2. Calculates Star Performer + Best TL for that month → writes to rankings
//   3. Creates monthlyPoints rows for the NEXT month (points: 0) for everyone
//   4. Resets User.points to 0
//   5. Updates isBestEmployee / isBestTL badges on User docs
// ---------------------------------------------------------------------------
exports.closeMonthAndStartNew = async (req, res) => {
  try {
    // ── Find the latest month with data ─────────────────────────────────────
    const latest = await MonthlyPoints.aggregate([
      { $group: { _id: { month: '$month', year: '$year' } } },
      { $sort:  { '_id.year': -1, '_id.month': -1 } },
      { $limit: 1 }
    ]);

    if (!latest.length) {
      return res.status(400).json({ message: 'No monthlyPoints data found. Nothing to close.' });
    }

    const { month: closingMonth, year: closingYear } = latest[0]._id;

    // ── Calculate next month ─────────────────────────────────────────────────
    const nextDate  = new Date(closingYear, closingMonth, 1); // JS months 0-indexed
    const nextMonth = nextDate.getMonth() + 1;
    const nextYear  = nextDate.getFullYear();

    // Guard: don't close a month that's already been followed by another
    const alreadyExists = await MonthlyPoints.findOne({ month: nextMonth, year: nextYear });
    if (alreadyExists) {
      return res.status(400).json({
        message: `${nextMonth}/${nextYear} already has data — this month was already closed.`
      });
    }

    // ── Get all employees and TLs ────────────────────────────────────────────
    const allUsers = await User.find({ role: { $in: ['Employee', 'TL'] } }).select('_id role');
    const empIds   = allUsers.filter(u => u.role === 'Employee').map(u => u._id);
    const tlIds    = allUsers.filter(u => u.role === 'TL').map(u => u._id);

    // ── Step 1: Calculate rankings for closing month ─────────────────────────
    const topEmpDoc = await MonthlyPoints.findOne({
      month: closingMonth, year: closingYear,
      employeeId: { $in: empIds }
    }).sort({ points: -1 });

    const topTLDoc = await MonthlyPoints.findOne({
      month: closingMonth, year: closingYear,
      employeeId: { $in: tlIds }
    }).sort({ points: -1 });

    let starPerformer = null;
    let bestTL = null;

    if (topEmpDoc) {
      starPerformer = await Ranking.findOneAndUpdate(
        { employeeId: topEmpDoc.employeeId, month: closingMonth, year: closingYear, isStarPerformer: true },
        { $set: { employeeId: topEmpDoc.employeeId, month: closingMonth, year: closingYear,
                  rankPosition: 1, isStarPerformer: true, isBestTL: false } },
        { upsert: true, new: true }
      );
    }

    if (topTLDoc) {
      bestTL = await Ranking.findOneAndUpdate(
        { employeeId: topTLDoc.employeeId, month: closingMonth, year: closingYear, isBestTL: true },
        { $set: { employeeId: topTLDoc.employeeId, month: closingMonth, year: closingYear,
                  rankPosition: 1, isStarPerformer: false, isBestTL: true } },
        { upsert: true, new: true }
      );
    }

    // ── Step 2: Create next month rows (points: 0) ───────────────────────────
    let rowsCreated = 0;
    for (const user of allUsers) {
      const existing = await MonthlyPoints.findOne({
        employeeId: user._id, month: nextMonth, year: nextYear
      });
      if (!existing) {
        await MonthlyPoints.create({
          employeeId: user._id, month: nextMonth, year: nextYear, points: 0
        });
        rowsCreated++;
      }
    }

    // ── Step 3: Reset User.points to 0 ──────────────────────────────────────
    await User.updateMany(
      { role: { $in: ['Employee', 'TL'] } },
      { $set: { points: 0, isBestEmployee: false, isBestTL: false } }
    );

    // ── Step 4: Set winner badges on User docs ───────────────────────────────
    if (starPerformer) {
      await User.findByIdAndUpdate(starPerformer.employeeId, { isBestEmployee: true });
    }
    if (bestTL) {
      await User.findByIdAndUpdate(bestTL.employeeId, { isBestTL: true });
    }

    // ── Populate winner names for response ───────────────────────────────────
    const starUser = starPerformer
      ? await User.findById(starPerformer.employeeId).select('name department')
      : null;
    const tlUser = bestTL
      ? await User.findById(bestTL.employeeId).select('name department')
      : null;

    const MONTH_NAMES = ['','Jan','Feb','Mar','Apr','May','Jun',
                             'Jul','Aug','Sep','Oct','Nov','Dec'];

    return res.json({
      message: `${MONTH_NAMES[closingMonth]} ${closingYear} closed. ${MONTH_NAMES[nextMonth]} ${nextYear} started.`,
      closedMonth:  { month: closingMonth, year: closingYear },
      newMonth:     { month: nextMonth,    year: nextYear    },
      rowsCreated,
      starPerformer: starUser ? { name: starUser.name, department: starUser.department } : null,
      bestTL:        tlUser   ? { name: tlUser.name,   department: tlUser.department   } : null,
    });
  } catch (error) {
    console.error('closeMonthAndStartNew error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Clean test data — delete all MonthlyPoints/Rankings except current month,
//          reset all user points to 0, and delete all PointHistory entries.
// @route   POST /api/admin/clean-test-data
// @access  Private (Admin)
exports.cleanTestData = async (req, res) => {
  try {
    const now   = new Date();
    const month = now.getMonth() + 1;
    const year  = now.getFullYear();

    // 1. Delete all MonthlyPoints rows that are NOT the current month
    const mpResult = await MonthlyPoints.deleteMany({
      $or: [{ month: { $ne: month } }, { year: { $ne: year } }]
    });

    // 2. Upsert current-month rows for every employee/TL (points reset to 0)
    const users = await User.find({ role: { $in: ['Employee', 'TL'] } }).select('_id');
    for (const u of users) {
      await MonthlyPoints.findOneAndUpdate(
        { employeeId: u._id, month, year },
        { $set: { points: 0 } },
        { upsert: true, new: true }
      );
    }

    // 3. Delete all Rankings (test rankings from simulated months)
    const rankResult = await Ranking.deleteMany({});

    // 4. Delete all PointHistory (test entries)
    const phResult = await PointHistory.deleteMany({});

    // 5. Reset all user points to 0
    const userResult = await User.updateMany(
      { role: { $in: ['Employee', 'TL'] } },
      { $set: { points: 0 } }
    );

    console.log(`🧹 Test data cleaned: ${mpResult.deletedCount} old MonthlyPoints, ${rankResult.deletedCount} Rankings, ${phResult.deletedCount} PointHistory deleted. ${userResult.modifiedCount} users reset to 0 pts.`);

    res.json({
      message: `✅ Test data cleared. All points reset to 0 for ${month}/${year}. Ready for deployment.`,
      details: {
        oldMonthlyPointsDeleted: mpResult.deletedCount,
        currentMonthRowsEnsured: users.length,
        rankingsDeleted: rankResult.deletedCount,
        pointHistoryDeleted: phResult.deletedCount,
        usersReset: userResult.modifiedCount,
        currentMonth: `${month}/${year}`,
      }
    });
  } catch (error) {
    console.error('cleanTestData error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ---------------------------------------------------------------------------
// POST /api/admin/reconcile-points
// Fixes User.points by recalculating from PointHistory (ground truth).
// Use this to fix any doubled/incorrect User.points values.
// Safe to run multiple times — idempotent.
// ---------------------------------------------------------------------------
exports.reconcilePoints = async (req, res) => {
  try {
    // Get all non-admin users
    const allUsers = await User.find({ role: { $in: ['Employee', 'TL'] } }).select('_id name points');

    const results = [];

    for (const u of allUsers) {
      // Sum all PointHistory entries for this user (net total = positives + negatives)
      const agg = await PointHistory.aggregate([
        { $match: { employee: u._id } },
        { $group: { _id: null, total: { $sum: '$points' } } }
      ]);
      const correctPoints = agg[0]?.total ?? 0;

      if (u.points !== correctPoints) {
        await User.findByIdAndUpdate(u._id, { $set: { points: correctPoints } });
        results.push({ name: u.name, was: u.points, now: correctPoints });
        console.log(`🔧 Reconciled ${u.name}: ${u.points} → ${correctPoints}`);
      }
    }

    // Also sync MonthlyPoints for the current month to match PointHistory
    const now   = new Date();
    const month = now.getMonth() + 1;
    const year  = now.getFullYear();

    // Start of current month
    const startOfMonth = new Date(year, month - 1, 1);
    const startOfNextMonth = new Date(year, month, 1);

    for (const u of allUsers) {
      const agg = await PointHistory.aggregate([
        {
          $match: {
            employee: u._id,
            createdAt: { $gte: startOfMonth, $lt: startOfNextMonth }
          }
        },
        { $group: { _id: null, total: { $sum: '$points' } } }
      ]);
      const correctMonthPoints = agg[0]?.total ?? 0;

      await MonthlyPoints.findOneAndUpdate(
        { employeeId: u._id, month, year },
        { $set: { points: correctMonthPoints } },
        { upsert: true, new: true }
      );
    }

    console.log(`✅ Reconciliation complete. ${results.length} users corrected.`);

    res.json({
      message: `✅ Points reconciled. ${results.length} user(s) corrected.`,
      corrected: results,
      currentMonth: `${month}/${year}`
    });
  } catch (error) {
    console.error('reconcilePoints error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
