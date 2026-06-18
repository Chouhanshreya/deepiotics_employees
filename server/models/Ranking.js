const mongoose = require('mongoose');

/**
 * Ranking — stores the monthly Star Performer and Best TL for each month/year.
 * Written once at month-end (or on admin trigger). Never mutated after creation.
 */
const rankingSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
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
    rankPosition: {
      type: Number,
      default: 1
    },
    isStarPerformer: {
      type: Boolean,
      default: false
    },
    isBestTL: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Index to quickly find all rankings for a given month/year
rankingSchema.index({ month: 1, year: 1 });

module.exports = mongoose.model('Ranking', rankingSchema);
