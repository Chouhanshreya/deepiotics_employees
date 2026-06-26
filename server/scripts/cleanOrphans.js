/**
 * cleanOrphans.js
 *
 * Deletes MonthlyPoints and PointHistory records that reference
 * user IDs which no longer exist in the users collection.
 * These are the source of "Unknown" entries in Monthly History.
 *
 * Usage (from the server/ directory):
 *   node scripts/cleanOrphans.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

async function main() {
  console.log('🔌 Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected\n');

  const User          = require('../models/User');
  const MonthlyPoints = require('../models/MonthlyPoints');
  const PointHistory  = require('../models/PointHistory');

  // Get all valid user IDs
  const validUsers = await User.find({}).select('_id');
  const validIds   = validUsers.map(u => u._id.toString());

  // Find orphaned MonthlyPoints
  const allMP = await MonthlyPoints.find({}).select('employeeId');
  const orphanMPIds = allMP
    .filter(mp => !validIds.includes(mp.employeeId.toString()))
    .map(mp => mp._id);

  // Find orphaned PointHistory
  const allPH = await PointHistory.find({}).select('employee');
  const orphanPHIds = allPH
    .filter(ph => !validIds.includes(ph.employee.toString()))
    .map(ph => ph._id);

  console.log(`Found ${orphanMPIds.length} orphaned MonthlyPoints records`);
  console.log(`Found ${orphanPHIds.length} orphaned PointHistory records`);

  if (orphanMPIds.length > 0) {
    await MonthlyPoints.deleteMany({ _id: { $in: orphanMPIds } });
    console.log(`🗑️  Deleted ${orphanMPIds.length} orphaned MonthlyPoints`);
  }

  if (orphanPHIds.length > 0) {
    await PointHistory.deleteMany({ _id: { $in: orphanPHIds } });
    console.log(`🗑️  Deleted ${orphanPHIds.length} orphaned PointHistory`);
  }

  if (orphanMPIds.length === 0 && orphanPHIds.length === 0) {
    console.log('✅ No orphaned records found — database is clean!');
  } else {
    console.log('\n✅ Cleanup complete. "Unknown" entries will no longer appear.');
  }

  await mongoose.disconnect();
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
