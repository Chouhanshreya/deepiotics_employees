require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const PointHistory = require('./models/PointHistory');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  console.log('Connected. Recalculating points from history...\n');

  const users = await User.find({ role: { $in: ['Employee', 'TL'] } });

  for (const user of users) {
    const history = await PointHistory.find({ employee: user._id });
    const realPoints = history.reduce((sum, h) => sum + h.points, 0);

    if (user.points !== realPoints) {
      console.log(`FIXED  ${user.name}: ${user.points} pts → ${realPoints} pts`);
      user.points = realPoints;
      await user.save();
    } else {
      console.log(`OK     ${user.name}: ${user.points} pts`);
    }
  }

  console.log('\n✅ All points synced with real history!');
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
