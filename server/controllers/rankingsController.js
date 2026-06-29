const mongoose = require('mongoose');
const MonthlyPoints = require('../models/MonthlyPoints');
const Ranking = require('../models/Ranking');
const User = require('../models/User');

/**
 * Core logic — finds Star Performer and Best TL for a given month/year and
 * writes them to the rankings collection. Called both by the cron job and the
 * admin-triggered POST /api/rankings/calculate endpoint.
 *
 * @param {number} month  1-12
 * @param {number} year   e.g. 2026
 * @returns {{ starPerformer, bestTL }}
 */
const calculateRankings = async (month, year) => {
  // Get all Employee IDs and TL IDs in one query
  const employees = await User.find({ role: { $in: ['Employee', 'TL'] } }).select('_id role');
  const employeeIds = employees.filter(u => u.role === 'Employee').map(u => u._id);
  const tlIds       = employees.filter(u => u.role === 'TL').map(u => u._id);

  // Find the top Employee for this month
  const topEmployeeDoc = await MonthlyPoints.findOne({
    month,
    year,
    employeeId: { $in: employeeIds }
  }).sort({ points: -1 });

  // Find the top TL for this month
  const topTLDoc = await MonthlyPoints.findOne({
    month,
    year,
    employeeId: { $in: tlIds }
  }).sort({ points: -1 });

  // Upsert into rankings collection — one record per winner per month/year.
  // We use individual upserts so running calculate twice is idempotent.
  let starPerformer = null;
  let bestTL = null;

  if (topEmployeeDoc) {
    starPerformer = await Ranking.findOneAndUpdate(
      { employeeId: topEmployeeDoc.employeeId, month, year, isStarPerformer: true },
      {
        $set: {
          employeeId:     topEmployeeDoc.employeeId,
          month,
          year,
          rankPosition:   1,
          isStarPerformer: true,
          isBestTL:        false
        }
      },
      { upsert: true, new: true }
    );
  }

  if (topTLDoc) {
    bestTL = await Ranking.findOneAndUpdate(
      { employeeId: topTLDoc.employeeId, month, year, isBestTL: true },
      {
        $set: {
          employeeId: topTLDoc.employeeId,
          month,
          year,
          rankPosition:    1,
          isStarPerformer: false,
          isBestTL:        true
        }
      },
      { upsert: true, new: true }
    );
  }

  return { starPerformer, bestTL };
};

// ---------------------------------------------------------------------------
// GET /api/rankings/live?department=R%26D
// Returns the CURRENT live Star Performer (highest points Employee) and
// Best TL (highest points TL) for THIS month — computed on the fly from
// MonthlyPoints. No manual calculate needed. Always up to date.
// Optional ?department= filter restricts results to one department.
// ---------------------------------------------------------------------------
exports.getLiveRankings = async (req, res) => {
  try {
    const now   = new Date();
    const month = now.getMonth() + 1;
    const year  = now.getFullYear();

    const userFilter = { role: { $in: ['Employee', 'TL'] } };
    if (req.query.department) userFilter.department = req.query.department;

    // Get all user IDs by role (+ optional dept) in one query
    const users    = await User.find(userFilter).select('_id role');
    const empIds   = users.filter(u => u.role === 'Employee').map(u => u._id);
    const tlIds    = users.filter(u => u.role === 'TL').map(u => u._id);

    // Top employee this month
    const topEmpDoc = empIds.length ? await MonthlyPoints.findOne({
      month, year, employeeId: { $in: empIds }, points: { $gt: 0 }
    }).sort({ points: -1 }) : null;

    // Top TL this month
    const topTLDoc = tlIds.length ? await MonthlyPoints.findOne({
      month, year, employeeId: { $in: tlIds }, points: { $gt: 0 }
    }).sort({ points: -1 }) : null;

    // Populate names
    const starPerformer = topEmpDoc
      ? await User.findById(topEmpDoc.employeeId).select('name department role points')
      : null;
    const bestTL = topTLDoc
      ? await User.findById(topTLDoc.employeeId).select('name department role points')
      : null;

    return res.json({
      month, year,
      live: true,   // flag so UI knows this is real-time, not stored
      starPerformer: starPerformer
        ? { ...starPerformer.toObject(), monthPoints: topEmpDoc.points }
        : null,
      bestTL: bestTL
        ? { ...bestTL.toObject(), monthPoints: topTLDoc.points }
        : null,
    });
  } catch (error) {
    console.error('getLiveRankings error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ---------------------------------------------------------------------------
// POST /api/rankings/calculate
// Body (optional): { month, year }  — defaults to current month/year
//
// Admin-triggered endpoint. Idempotent: running it multiple times is safe.
// ---------------------------------------------------------------------------
exports.calculateRankingsHandler = async (req, res) => {
  try {
    const now = new Date();
    const month = req.body.month ? parseInt(req.body.month, 10) : now.getMonth() + 1;
    const year  = req.body.year  ? parseInt(req.body.year,  10) : now.getFullYear();

    if (month < 1 || month > 12) {
      return res.status(400).json({ message: 'month must be between 1 and 12' });
    }
    if (year < 2000 || year > 2100) {
      return res.status(400).json({ message: 'year seems invalid' });
    }

    const { starPerformer, bestTL } = await calculateRankings(month, year);

    // Also reflect the badges on the User documents for quick UI reads
    if (starPerformer) {
      await User.updateMany({ isBestEmployee: true }, { isBestEmployee: false });
      await User.findByIdAndUpdate(starPerformer.employeeId, { isBestEmployee: true });
    }
    if (bestTL) {
      await User.updateMany({ isBestTL: true }, { isBestTL: false });
      await User.findByIdAndUpdate(bestTL.employeeId, { isBestTL: true });
    }

    return res.json({
      message: `Rankings calculated for ${month}/${year}`,
      starPerformer,
      bestTL
    });
  } catch (error) {
    console.error('calculateRankingsHandler error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ---------------------------------------------------------------------------
// GET /api/rankings?month=M&year=Y
// Returns the stored rankings for a given month/year.
// Uses aggregation $lookup so names are always populated even if populate fails.
// ---------------------------------------------------------------------------
exports.getRankings = async (req, res) => {
  try {
    const now   = new Date();
    const month = req.query.month ? parseInt(req.query.month, 10) : now.getMonth() + 1;
    const year  = req.query.year  ? parseInt(req.query.year,  10) : now.getFullYear();
    const dept  = req.query.department || null;

    const pipeline = [
      { $match: { month, year } },
      {
        $lookup: {
          from: 'users',
          localField: 'employeeId',
          foreignField: '_id',
          as: 'employeeData'
        }
      },
      {
        $addFields: {
          employeeId: {
            $cond: {
              if: { $gt: [{ $size: '$employeeData' }, 0] },
              then: {
                _id:        { $arrayElemAt: ['$employeeData._id', 0] },
                name:       { $arrayElemAt: ['$employeeData.name', 0] },
                role:       { $arrayElemAt: ['$employeeData.role', 0] },
                department: { $arrayElemAt: ['$employeeData.department', 0] }
              },
              else: { name: 'Unknown', role: '—', department: '—' }
            }
          }
        }
      },
      { $project: { employeeData: 0 } },
      // Filter by dept AFTER joining (so we have department on employeeId)
      ...(dept ? [{ $match: { 'employeeId.department': dept } }] : []),
      { $sort: { isStarPerformer: -1 } }
    ];

    const rankings = await require('../models/Ranking').aggregate(pipeline);

    return res.json({ month, year, rankings });
  } catch (error) {
    console.error('getRankings error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};
