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
    enum: [
      // Employee Positive
      'Quality of Work',
      'Timely Delivery',
      'Client Feedback',
      'Communication & Reporting',
      'Complaint History',
      // Employee Negative
      'Client Complaint',
      'Delayed Delivery',
      'Poor Communication',
      'No Updates Provided',
      'Incomplete Work',
      'Repeated Mistakes',
      'Client Comments Ignored',
      'Client Escalation',
      // TL Positive
      'Team Delivery Performance',
      'Team Quality Performance',
      'Client Satisfaction',
      'Team Management & Reporting',
      'Low Team Complaint Rate',
      // TL Negative (same labels as employee negatives but TL-context)
      'Team Client Complaint',
      'Team Delayed Delivery',
      'Team Poor Communication',
      'Team No Updates Provided',
      'Team Incomplete Work',
      'Team Repeated Mistakes',
      'Team Client Comments Ignored',
      'Team Client Escalation',
      // General
      'General'
    ],
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
