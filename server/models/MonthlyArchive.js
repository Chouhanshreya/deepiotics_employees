const mongoose = require('mongoose');

const monthlyArchiveSchema = new mongoose.Schema({
  month: { type: Number, required: true }, // 1-12
  year: { type: Number, required: true },
  snapshots: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      name: String,
      email: String,
      role: String,
      department: String,
      points: Number,
      rank: Number
    }
  ],
  bestEmployee: {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: String,
    department: String,
    points: Number
  },
  bestTL: {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: String,
    department: String,
    teamPoints: Number
  },
  resetBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resetAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('MonthlyArchive', monthlyArchiveSchema);
