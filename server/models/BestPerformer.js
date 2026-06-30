const mongoose = require('mongoose');

/**
 * BestPerformer — stores declared Best Employee and Best TL per dept per month.
 * Two separate records per dept per role per month:
 *   type: 'auto'   — computed from highest MonthlyPoints (Auto-Calculate button)
 *   type: 'manual' — admin manually picked someone
 */
const bestPerformerSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    department: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ['Employee', 'TL'],
      required: true
    },
    type: {
      type: String,
      enum: ['auto', 'manual'],
      default: 'manual'
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
    declaredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  { timestamps: true }
);

// One winner per (dept + role + type + month + year)
bestPerformerSchema.index({ department: 1, role: 1, type: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('BestPerformer', bestPerformerSchema);
