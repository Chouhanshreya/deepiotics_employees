/**
 * initCurrentMonth.js
 * -------------------
 * Creates monthlyPoints rows (points: 0) for the CURRENT month
 * for every existing Employee and TL in the database.
 *
 * Run this once after adding your real employees through the UI.
 * After this, assign points normally through Point Management.
 *
 * Run: node scripts/initCurrentMonth.js
 */
require('dotenv').config();
const mongoose      = require('mongoose');
const User          = require('../models/User');
const MonthlyPoints = require('../models/MonthlyPoints');

const GREEN  = s => `\x1b[32m${s}\x1b[0m`;
const YELLOW = s => `\x1b[33m${s}\x1b[0m`;
const BOLD   = s => `\x1b[1m${s}\x1b[0m`;

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log(GREEN('✅ MongoDB Connected\n'));

  const now   = new Date();
  const month = now.getMonth() + 1;
  const year  = now.getFullYear();

  const MONTH_NAMES = ['','Jan','Feb','Mar','Apr','May','Jun',
                           'Jul','Aug','Sep','Oct','Nov','Dec'];

  console.log(BOLD(`━━━ Initializing ${MONTH_NAMES[month]} ${year} MonthlyPoints ━━━\n`));

  const users = await User.find({ role: { $in: ['Employee', 'TL'] } })
    .select('_id name role department');

  if (users.length === 0) {
    console.log('⚠️  No employees or TLs found in the database.');
    console.log('   Add your real employees through the UI first, then run this script.\n');
    await mongoose.disconnect();
    process.exit(0);
  }

  let created = 0;
  let existed = 0;

  for (const user of users) {
    const result = await MonthlyPoints.findOneAndUpdate(
      { employeeId: user._id, month, year },
      {
        $setOnInsert: { employeeId: user._id, month, year, points: 0 }
      },
      { upsert: true, new: false }
    );

    if (!result) {
      console.log(`  ${GREEN('✅')} Created  ${user.name.padEnd(22)} ${user.role.padEnd(10)} → ${month}/${year} = 0 pts`);
      created++;
    } else {
      console.log(`  ℹ️  Existed  ${user.name.padEnd(22)} ${user.role.padEnd(10)} → already has ${result.points} pts`);
      existed++;
    }
  }

  console.log(BOLD(`\n━━━ Done ━━━`));
  console.log(`\n  ${created} rows created, ${existed} already existed`);
  console.log(`  ${GREEN('✅')} ${MONTH_NAMES[month]} ${year} is now initialized for ${users.length} users`);
  console.log(`\n  Now assign real points through the Point Management page.`);
  console.log(`  At month end → Settings → "Close Month & Start New Month"\n`);

  await mongoose.disconnect();
  process.exit(0);
}

run().catch(e => {
  console.error('\x1b[31mError:\x1b[0m', e.message);
  process.exit(1);
});
