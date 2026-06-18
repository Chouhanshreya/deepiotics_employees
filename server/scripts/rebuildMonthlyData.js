/**
 * rebuildMonthlyData.js
 * Wipes and rebuilds monthlypoints + rankings using CURRENT user IDs.
 * Run: node scripts/rebuildMonthlyData.js
 */
require('dotenv').config();
const mongoose     = require('mongoose');
const User         = require('../models/User');
const MonthlyPoints = require('../models/MonthlyPoints');
const Ranking       = require('../models/Ranking');

const JUNE_PTS = {
  'Alice Brown': 2500, 'Bob Wilson': 1800, 'Charlie Davis': 1200,
  'Diana Miller': 900, 'Eve Taylor': 600,  'Frank Anderson': 3200,
  'Grace Thomas': 2100,'Henry Martinez': 1500,'Ivy Garcia': 800,
  'Jack Robinson': 400,'John Smith': 0,    'Sarah Johnson': 0
};
const JULY_PTS = {
  'Alice Brown': 2800, 'Bob Wilson': 1600, 'Charlie Davis': 2200,
  'Diana Miller': 950, 'Eve Taylor': 3100, 'Frank Anderson': 1400,
  'Grace Thomas': 2600,'Henry Martinez': 1750,'Ivy Garcia': 700,
  'Jack Robinson': 500,'John Smith': 320,  'Sarah Johnson': 480
};

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected\n');

  // 1. Wipe stale data
  await MonthlyPoints.deleteMany({});
  await Ranking.deleteMany({});
  console.log('Wiped all monthlypoints and rankings\n');

  // 2. Get current users
  const users    = await User.find({ role: { $in: ['Employee', 'TL'] } });
  const empUsers = users.filter(u => u.role === 'Employee');
  const tlUsers  = users.filter(u => u.role === 'TL');

  // 3. Insert June + July monthlypoints
  const docs = [];
  for (const u of users) {
    docs.push({ employeeId: u._id, month: 6, year: 2026, points: JUNE_PTS[u.name] ?? 0 });
    docs.push({ employeeId: u._id, month: 7, year: 2026, points: JULY_PTS[u.name] ?? 0 });
    console.log(`  ${u.name.padEnd(20)} Jun=${JUNE_PTS[u.name]??0}  Jul=${JULY_PTS[u.name]??0}`);
  }
  await MonthlyPoints.insertMany(docs);
  console.log(`\nInserted ${docs.length} monthlypoints docs\n`);

  // 4. Build rankings
  const topJuneEmp = empUsers.sort((a,b) => (JUNE_PTS[b.name]??0)-(JUNE_PTS[a.name]??0))[0];
  const topJuneTL  = tlUsers.sort((a,b)  => (JUNE_PTS[b.name]??0)-(JUNE_PTS[a.name]??0))[0];
  const topJulyEmp = empUsers.sort((a,b) => (JULY_PTS[b.name]??0)-(JULY_PTS[a.name]??0))[0];
  const topJulyTL  = tlUsers.sort((a,b)  => (JULY_PTS[b.name]??0)-(JULY_PTS[a.name]??0))[0];

  await Ranking.insertMany([
    { employeeId: topJuneEmp._id,  month: 6, year: 2026, rankPosition: 1, isStarPerformer: true,  isBestTL: false },
    { employeeId: topJuneTL._id,   month: 6, year: 2026, rankPosition: 1, isStarPerformer: false, isBestTL: true  },
    { employeeId: topJulyEmp._id,  month: 7, year: 2026, rankPosition: 1, isStarPerformer: true,  isBestTL: false },
    { employeeId: topJulyTL._id,   month: 7, year: 2026, rankPosition: 1, isStarPerformer: false, isBestTL: true  },
  ]);

  console.log('Rankings:');
  console.log(`  Jun Star Performer : ${topJuneEmp.name} (${JUNE_PTS[topJuneEmp.name]} pts)`);
  console.log(`  Jun Best TL        : ${topJuneTL.name}  (${JUNE_PTS[topJuneTL.name]} pts)`);
  console.log(`  Jul Star Performer : ${topJulyEmp.name} (${JULY_PTS[topJulyEmp.name]} pts)`);
  console.log(`  Jul Best TL        : ${topJulyTL.name}  (${JULY_PTS[topJulyTL.name]} pts)`);

  // 5. Update User.points to July and set badges
  await User.updateMany({}, { points: 0, isBestEmployee: false, isBestTL: false });
  for (const u of users) {
    await User.findByIdAndUpdate(u._id, {
      points:        JULY_PTS[u.name] ?? 0,
      isBestEmployee: u._id.equals(topJulyEmp._id),
      isBestTL:       u._id.equals(topJulyTL._id)
    });
  }

  console.log('\nAll done. Refresh the browser.\n');
  await mongoose.disconnect();
  process.exit(0);
}

run().catch(e => { console.error(e.message); process.exit(1); });
