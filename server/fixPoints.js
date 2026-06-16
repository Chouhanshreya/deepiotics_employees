const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');

const fixPoints = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected\n');

    // Get all users
    const users = await User.find({});

    console.log(`Found ${users.length} users\n`);
    console.log('Fixing corrupted points...\n');

    for (const user of users) {
      const oldPoints = user.points;
      let newPoints = 0;

      // If points is a string or corrupted number
      if (typeof oldPoints === 'string') {
        newPoints = 0; // Reset to 0
      } else if (oldPoints > 100000) {
        // If points are too high (corrupted), reset to reasonable value
        newPoints = 0;
      } else {
        newPoints = parseInt(oldPoints, 10) || 0;
      }

      user.points = newPoints;
      await user.save();

      console.log(`✅ ${user.name.padEnd(20)} | Old: ${String(oldPoints).padEnd(10)} | New: ${newPoints}`);
    }

    console.log('\n✅ All points fixed!');
    console.log('\n💡 Now you can assign points properly from the UI.');
    console.log('   The points will add correctly as numbers.\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

fixPoints();
