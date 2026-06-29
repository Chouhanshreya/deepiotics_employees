const MonthlyPoints = require('../models/MonthlyPoints');

/**
 * Compute the (year * 12 + month) integer for a given Date.
 * This turns any month/year pair into a monotonically increasing number that
 * can be compared directly in a $match stage without date arithmetic in JS.
 *
 * e.g. Jan 2025 → 2025*12+1 = 24301
 *      Dec 2024 → 2024*12+12 = 24300
 */
const monthIndex = (date) => date.getFullYear() * 12 + (date.getMonth() + 1);

/**
 * Shared aggregation — returns ranked list of employees/TLs for last N months.
 * Optionally filtered to a specific role ('Employee' or 'TL') and/or department.
 */
const buildTopPerformersPipeline = (N, roleFilter, deptFilter) => {
  const now = new Date();
  const lowerBound = new Date(now.getFullYear(), now.getMonth() - (N - 1), 1);
  const minIdx = monthIndex(lowerBound);
  const maxIdx = monthIndex(now);

  return [
    { $addFields: { monthIdx: { $add: [{ $multiply: ['$year', 12] }, '$month'] } } },
    { $match: { monthIdx: { $gte: minIdx, $lte: maxIdx } } },
    { $group: { _id: '$employeeId', totalPoints: { $sum: '$points' }, monthsWithData: { $sum: 1 } } },
    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
    { $match: { 'user.0': { $exists: true } } },
    { $unwind: '$user' },
    ...(roleFilter ? [{ $match: { 'user.role': roleFilter } }] : []),
    ...(deptFilter ? [{ $match: { 'user.department': deptFilter } }] : []),
    { $project: {
        _id: 0,
        employeeId:   '$_id',
        name:         '$user.name',
        role:         '$user.role',
        department:   '$user.department',
        totalPoints:  1,
        monthsWithData: 1
    }},
    { $sort: { totalPoints: -1 } }
  ];
};

// ---------------------------------------------------------------------------
// GET /api/analysis?months=N
//
// Returns every employee's totalPoints and avgPoints over the last N calendar
// months (N = 1 | 3 | 6 | 12 — validated, dynamic). Sorted by totalPoints
// descending so rank is implicit in the array order.
//
// Aggregation pipeline:
//   1. $addFields  — compute a scalar monthIndex per document
//   2. $match      — keep only documents within the last N months
//   3. $group      — roll up per employee: $sum and $avg
//   4. $lookup     — join name, role, department from the users collection
//   5. $unwind     — flatten the joined array into a single field
//   6. $project    — shape the output
//   7. $sort       — totalPoints desc
// ---------------------------------------------------------------------------
exports.getAnalysis = async (req, res) => {
  try {
    const ALLOWED_MONTHS = [1, 3, 6, 12];

    const rawN = parseInt(req.query.months, 10);
    if (!rawN || !ALLOWED_MONTHS.includes(rawN)) {
      return res.status(400).json({
        message: `months query param must be one of: ${ALLOWED_MONTHS.join(', ')}`
      });
    }

    const N = rawN;
    const dept = req.query.department || null;   // optional dept filter

    const now = new Date();
    const lowerBound = new Date(now.getFullYear(), now.getMonth() - (N - 1), 1);
    const minIdx = monthIndex(lowerBound);
    const maxIdx = monthIndex(now);

    const pipeline = [
      {
        $addFields: {
          monthIdx: { $add: [{ $multiply: ['$year', 12] }, '$month'] }
        }
      },
      { $match: { monthIdx: { $gte: minIdx, $lte: maxIdx } } },
      {
        $group: {
          _id: '$employeeId',
          totalPoints: { $sum: '$points' },
          avgPoints:   { $avg: '$points' },
          monthsWithData: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'employee'
        }
      },
      { $match: { 'employee.0': { $exists: true } } },
      { $unwind: '$employee' },
      // Department filter — applied after join
      ...(dept ? [{ $match: { 'employee.department': dept } }] : []),
      {
        $project: {
          _id: 0,
          employeeId: '$_id',
          name:        '$employee.name',
          role:        '$employee.role',
          department:  '$employee.department',
          totalPoints: 1,
          avgPoints:   { $round: ['$avgPoints', 2] },
          monthsWithData: 1
        }
      },
      { $sort: { totalPoints: -1 } }
    ];

    const results = await MonthlyPoints.aggregate(pipeline);

    return res.json({
      months: N,
      rangeFrom: `${lowerBound.getFullYear()}-${String(lowerBound.getMonth() + 1).padStart(2, '0')}`,
      rangeTo:   `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
      count: results.length,
      data: results
    });
  } catch (error) {
    console.error('getAnalysis error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ---------------------------------------------------------------------------
// GET /api/analysis/top-performers?months=N
//
// Returns the #1 Employee and #1 TL by total points across the last N months.
// N can be 1, 3, 6, or 12.
// Used for the "Best of 3 Months / 6 Months" feature on the Monthly History page.
// ---------------------------------------------------------------------------
exports.getTopPerformersByRange = async (req, res) => {
  try {
    const ALLOWED = [1, 3, 6, 12];
    const N = parseInt(req.query.months, 10);
    if (!N || !ALLOWED.includes(N)) {
      return res.status(400).json({ message: `months must be one of: ${ALLOWED.join(', ')}` });
    }

    const dept = req.query.department || null;   // optional dept filter

    const now        = new Date();
    const lowerBound = new Date(now.getFullYear(), now.getMonth() - (N - 1), 1);

    // Run employee and TL pipelines in parallel, passing dept filter
    const [empResults, tlResults] = await Promise.all([
      MonthlyPoints.aggregate(buildTopPerformersPipeline(N, 'Employee', dept)),
      MonthlyPoints.aggregate(buildTopPerformersPipeline(N, 'TL', dept))
    ]);

    const MONTH_NAMES = ['','Jan','Feb','Mar','Apr','May','Jun',
                             'Jul','Aug','Sep','Oct','Nov','Dec'];

    return res.json({
      months: N,
      rangeFrom: `${MONTH_NAMES[lowerBound.getMonth() + 1]} ${lowerBound.getFullYear()}`,
      rangeTo:   `${MONTH_NAMES[now.getMonth() + 1]} ${now.getFullYear()}`,
      bestEmployee: empResults[0] ?? null,
      bestTL:       tlResults[0]  ?? null,
      topEmployees: empResults.slice(0, 5),
      topTLs:       tlResults.slice(0, 5),
    });
  } catch (error) {
    console.error('getTopPerformersByRange error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};
