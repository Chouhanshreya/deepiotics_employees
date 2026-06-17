const mongoose = require('mongoose');

const pointHistorySchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  points: {
    type: Number,
    required: true
  },
  category: {
    type: String,
    enum: ['General', 'Performance', 'Teamwork', 'Innovation', 'Leadership', 'Punctuality', 'Extra Mile'],
    default: 'General'
  },
  note: {
    type: String,
    default: ''
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('PointHistory', pointHistorySchema);
