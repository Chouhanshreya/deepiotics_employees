const mongoose = require('mongoose');

/**
 * MonthlyPoints — one document per employee per calendar month.
 *
 * Design rules:
 *   - Never delete or overwrite old month documents once the month has passed.
 *   - Only the current month's document is ever incremented via $inc / upsert.
 *   - The compound unique index on (employeeId, month, year) guarantees
 *     exactly one row per employee per month and makes upserts safe.
 */
const monthlyPointsSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true  // single-field index for fast per-employee lookups
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12
    },
    year: {
      type: Number,
      required: true
    },
    points: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true  // adds createdAt + updatedAt automatically
  }
);

// Compound unique index — prevents duplicate rows and enables safe upserts
monthlyPointsSchema.index(
  { employeeId: 1, month: 1, year: 1 },
  { unique: true, name: 'unique_employee_month_year' }
);

module.exports = mongoose.model('MonthlyPoints', monthlyPointsSchema);
