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

    // Calculate the inclusive lower bound month/year
    const now = new Date();
    const lowerBound = new Date(now.getFullYear(), now.getMonth() - (N - 1), 1);
    const minIdx = monthIndex(lowerBound);  // e.g. N=3, now=Jun 2026 → Apr 2026 → 24304
    const maxIdx = monthIndex(now);          // current month

    const pipeline = [
      // 1. Compute a scalar index so we can range-match easily
      {
        $addFields: {
          monthIdx: {
            $add: [{ $multiply: ['$year', 12] }, '$month']
          }
        }
      },

      // 2. Keep only rows inside the last N calendar months (inclusive both ends)
      {
        $match: {
          monthIdx: { $gte: minIdx, $lte: maxIdx }
        }
      },

      // 3. Roll up per employee
      {
        $group: {
          _id: '$employeeId',
          totalPoints: { $sum: '$points' },
          avgPoints:   { $avg: '$points' },
          monthsWithData: { $sum: 1 }
        }
      },

      // 4. Join employee info from the users collection
      {
        $lookup: {
          from: 'users',          // MongoDB collection name (Mongoose pluralises 'User' → 'users')
          localField: '_id',
          foreignField: '_id',
          as: 'employee'
        }
      },

      // 5. Flatten the joined array (each employee has exactly one User doc)
      {
        $unwind: {
          path: '$employee',
          preserveNullAndEmptyArrays: true  // keep rows even if user was deleted
        }
      },

      // 6. Shape the output — drop internal fields, round avg to 2 dp
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

      // 7. Best performers first
      {
        $sort: { totalPoints: -1 }
      }
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
