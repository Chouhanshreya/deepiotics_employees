/**
 * Recalculates every user's points by summing all their PointHistory entries.
 * Run once to fix users whose points were clamped to 0 by the old Math.max(0, ...) guard.
 *
 * Usage: node recalcPoints.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const PointHistory = require('./models/PointHistory');

const recalc = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ MongoDB Connected\n');

  const users = await User.find({ role: { $in: ['Employee', 'TL'] } });

  let updated = 0;
  for (const user of users) {
    const history = await PointHistory.find({ employee: user._id });
    const correctPoints = history.reduce((sum, h) => sum + h.points, 0);

    if (user.points !== correctPoints) {
      console.log(`🔧 ${user.name}: stored=${user.points}  correct=${correctPoints}`);
      user.points = correctPoints;
      await user.save();
      updated++;
    }
  }

  if (updated === 0) {
    console.log('✅ All points are already correct — nothing to update.');
  } else {
    console.log(`\n✅ Fixed ${updated} user(s).`);
  }

  process.exit(0);
};

recalc().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
