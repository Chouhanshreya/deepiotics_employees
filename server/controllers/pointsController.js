const mongoose = require('mongoose');
const User = require('../models/User');
const MonthlyPoints = require('../models/MonthlyPoints');

/**
 * Helper — returns { month, year } for the current calendar month.
 */
const getCurrentMonthYear = () => {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
};

// ---------------------------------------------------------------------------
// POST /api/points/update
// Body: { employeeId, pointsToAdd }
//
// Finds or creates the current month's MonthlyPoints document for the employee
// and increments points via $inc + upsert. Works even if the cron hasn't
// pre-created the row yet — the upsert handles that edge case.
// ---------------------------------------------------------------------------
exports.updatePoints = async (req, res) => {
  try {
    const { employeeId, pointsToAdd } = req.body;

    // --- Input validation ---
    if (!employeeId) {
      return res.status(400).json({ message: 'employeeId is required' });
    }

    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      return res.status(400).json({ message: 'employeeId is not a valid ObjectId' });
    }

    const pts = parseInt(pointsToAdd, 10);
    if (pointsToAdd === undefined || pointsToAdd === null || isNaN(pts) || pts === 0) {
      return res.status(400).json({ message: 'pointsToAdd must be a non-zero integer' });
    }

    if (pts > 1000 || pts < -1000) {
      return res.status(400).json({ message: 'pointsToAdd must be between -1000 and +1000' });
    }

    // Confirm employee exists (and is not an Admin)
    const employee = await User.findById(employeeId).select('name role');
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    if (employee.role === 'Admin') {
      return res.status(400).json({ message: 'Cannot assign monthly points to an Admin' });
    }

    const { month, year } = getCurrentMonthYear();

    // $inc with upsert: if no doc exists yet for this month it is created with
    // points = 0 first (via $setOnInsert) then incremented, all atomically.
    const doc = await MonthlyPoints.findOneAndUpdate(
      { employeeId, month, year },
      {
        $inc: { points: pts },
        $setOnInsert: { employeeId, month, year }
      },
      {
        upsert: true,
        new: true,       // return the updated doc
        runValidators: true
      }
    );

    return res.json({
      message: `Points updated for ${employee.name} — ${month}/${year}`,
      monthlyPoints: doc
    });
  } catch (error) {
    // Duplicate key on the compound index should never happen with upsert,
    // but guard against it anyway.
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Duplicate monthly points entry (concurrent write?)', error: error.message });
    }
    console.error('updatePoints error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ---------------------------------------------------------------------------
// GET /api/points/available-months
// Returns distinct {month, year} pairs that have monthlyPoints data,
// sorted most-recent first. Used to populate the dropdown in the UI.
// ---------------------------------------------------------------------------
exports.getAvailableMonths = async (req, res) => {
  try {
    const months = await MonthlyPoints.aggregate([
      {
        $group: {
          _id: { month: '$month', year: '$year' }
        }
      },
      {
        $sort: { '_id.year': -1, '_id.month': -1 }  // most recent first
      },
      {
        $project: {
          _id: 0,
          month: '$_id.month',
          year:  '$_id.year'
        }
      }
    ]);

    return res.json({ months });
  } catch (error) {
    console.error('getAvailableMonths error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};
exports.getCurrentMonthPoints = async (req, res) => {
  try {
    const { employeeId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      return res.status(400).json({ message: 'employeeId is not a valid ObjectId' });
    }

    const { month, year } = getCurrentMonthYear();

    const doc = await MonthlyPoints.findOne({ employeeId, month, year });

    return res.json({
      employeeId,
      month,
      year,
      points: doc ? doc.points : 0
    });
  } catch (error) {
    console.error('getCurrentMonthPoints error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ---------------------------------------------------------------------------
// GET /api/points/month-top?month=M&year=Y&department=X
// Returns the top Employee and top TL for a specific month.
// Priority: manual BestPerformer > auto BestPerformer > highest MonthlyPoints.
// Optional ?department= restricts to that department.
// Used by Monthly History winner cards.
// ---------------------------------------------------------------------------
exports.getMonthTopScorers = async (req, res) => {
  try {
    const now   = new Date();
    const month = req.query.month ? parseInt(req.query.month, 10) : now.getMonth() + 1;
    const year  = req.query.year  ? parseInt(req.query.year,  10) : now.getFullYear();
    const dept  = req.query.department || null;

    const BestPerformer = require('../models/BestPerformer');

    // ── Step 1: Check BestPerformer declared records (manual > auto) ──────
    if (dept) {
      const [manualEmp, autoEmp, manualTL, autoTL] = await Promise.all([
        BestPerformer.findOne({ department: dept, role: 'Employee', type: 'manual', month, year }).populate('employeeId', 'name department role'),
        BestPerformer.findOne({ department: dept, role: 'Employee', type: 'auto',   month, year }).populate('employeeId', 'name department role'),
        BestPerformer.findOne({ department: dept, role: 'TL',       type: 'manual', month, year }).populate('employeeId', 'name department role'),
        BestPerformer.findOne({ department: dept, role: 'TL',       type: 'auto',   month, year }).populate('employeeId', 'name department role'),
      ]);

      const declaredEmp = manualEmp?.employeeId || autoEmp?.employeeId || null;
      const declaredTL  = manualTL?.employeeId  || autoTL?.employeeId  || null;

      if (declaredEmp || declaredTL) {
        const [empMonthPts, tlMonthPts] = await Promise.all([
          declaredEmp ? MonthlyPoints.findOne({ employeeId: declaredEmp._id, month, year }) : null,
          declaredTL  ? MonthlyPoints.findOne({ employeeId: declaredTL._id,  month, year }) : null,
        ]);
        return res.json({
          month, year,
          starPerformer: declaredEmp ? { ...declaredEmp.toObject(), monthPoints: empMonthPts?.points ?? 0 } : null,
          bestTL:        declaredTL  ? { ...declaredTL.toObject(),  monthPoints: tlMonthPts?.points  ?? 0 } : null,
        });
      }
    }

    // No dept or no declared records — check cross-dept declared records
    if (!dept) {
      const [manualEmp, autoEmp, manualTL, autoTL] = await Promise.all([
        BestPerformer.findOne({ role: 'Employee', type: 'manual', month, year }).sort({ updatedAt: -1 }).populate('employeeId', 'name department role'),
        BestPerformer.findOne({ role: 'Employee', type: 'auto',   month, year }).sort({ updatedAt: -1 }).populate('employeeId', 'name department role'),
        BestPerformer.findOne({ role: 'TL',       type: 'manual', month, year }).sort({ updatedAt: -1 }).populate('employeeId', 'name department role'),
        BestPerformer.findOne({ role: 'TL',       type: 'auto',   month, year }).sort({ updatedAt: -1 }).populate('employeeId', 'name department role'),
      ]);

      const declaredEmp = manualEmp?.employeeId || autoEmp?.employeeId || null;
      const declaredTL  = manualTL?.employeeId  || autoTL?.employeeId  || null;

      if (declaredEmp || declaredTL) {
        const [empMonthPts, tlMonthPts] = await Promise.all([
          declaredEmp ? MonthlyPoints.findOne({ employeeId: declaredEmp._id, month, year }) : null,
          declaredTL  ? MonthlyPoints.findOne({ employeeId: declaredTL._id,  month, year }) : null,
        ]);
        return res.json({
          month, year,
          starPerformer: declaredEmp ? { ...declaredEmp.toObject(), monthPoints: empMonthPts?.points ?? 0 } : null,
          bestTL:        declaredTL  ? { ...declaredTL.toObject(),  monthPoints: tlMonthPts?.points  ?? 0 } : null,
        });
      }
    }

    // ── Step 2: Fall back to highest MonthlyPoints (no declaration yet) ───
    const userFilter = { role: { $in: ['Employee', 'TL'] } };
    if (dept) userFilter.department = dept;

    const users  = await User.find(userFilter).select('_id role name department points');
    const empIds = users.filter(u => u.role === 'Employee').map(u => u._id);
    const tlIds  = users.filter(u => u.role === 'TL').map(u => u._id);

    const [topEmpDoc, topTLDoc] = await Promise.all([
      empIds.length ? MonthlyPoints.findOne({ month, year, employeeId: { $in: empIds } }).sort({ points: -1 }) : null,
      tlIds.length  ? MonthlyPoints.findOne({ month, year, employeeId: { $in: tlIds  } }).sort({ points: -1 }) : null,
    ]);

    const starPerformer = topEmpDoc
      ? await User.findById(topEmpDoc.employeeId).select('name department role')
      : null;
    const bestTL = topTLDoc
      ? await User.findById(topTLDoc.employeeId).select('name department role')
      : null;

    return res.json({
      month, year,
      starPerformer: starPerformer ? { ...starPerformer.toObject(), monthPoints: topEmpDoc.points } : null,
      bestTL:        bestTL        ? { ...bestTL.toObject(),        monthPoints: topTLDoc.points  } : null,
    });
  } catch (error) {
    console.error('getMonthTopScorers error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};
