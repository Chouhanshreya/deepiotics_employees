/**
 * seedJulyPoints.js
 * -----------------
 * Assigns realistic July 2026 points to all employees and TLs,
 * updates User.points (live leaderboard), recalculates June AND July rankings.
 *
 * Run: node scripts/seedJulyPoints.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User         = require('../models/User');
const MonthlyPoints = require('../models/MonthlyPoints');
const Ranking       = require('../models/Ranking');

const GREEN  = s => `\x1b[32m${s}\x1b[0m`;
const YELLOW = s => `\x1b[33m${s}\x1b[0m`;
const BOLD   = s => `\x1b[1m${s}\x1b[0m`;
const CYAN   = s => `\x1b[36m${s}\x1b[0m`;

// July 2026 points — realistic spread
const JULY_POINTS = {
  'Alice Brown':    2800,
  'Bob Wilson':     1600,
  'Charlie Davis':  2200,
  'Diana Miller':   950,
  'Eve Taylor':     3100,   // Eve is the July star — big improvement
  'Frank Anderson': 1400,
  'Grace Thomas':   2600,
  'Henry Martinez': 1750,
  'Ivy Garcia':     700,
  'Jack Robinson':  500,
  'John Smith':     320,    // TL
  'Sarah Johnson':  480,    // TL
};

async function recalcRankings(month, year, allUsers) {
  const employeeIds = allUsers.filter(u => u.role === 'Employee').map(u => u._id);
  const tlIds       = allUsers.filter(u => u.role === 'TL').map(u => u._id);

  const topEmpDoc = await MonthlyPoints.findOne(
    { month, year, employeeId: { $in: employeeIds } }
  ).sort({ points: -1 });

  const topTLDoc = await MonthlyPoints.findOne(
    { month, year, employeeId: { $in: tlIds } }
  ).sort({ points: -1 });

  let starPerformer = null, bestTL = null;

  if (topEmpDoc) {
    starPerformer = await Ranking.findOneAndUpdate(
      { employeeId: topEmpDoc.employeeId, month, year, isStarPerformer: true },
      { $set: { employeeId: topEmpDoc.employeeId, month, year, rankPosition: 1, isStarPerformer: true, isBestTL: false } },
      { upsert: true, new: true }
    );
  }

  if (topTLDoc) {
    bestTL = await Ranking.findOneAndUpdate(
      { employeeId: topTLDoc.employeeId, month, year, isBestTL: true },
      { $set: { employeeId: topTLDoc.employeeId, month, year, rankPosition: 1, isStarPerformer: false, isBestTL: true } },
      { upsert: true, new: true }
    );
  }

  return { starPerformer, bestTL };
}

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log(GREEN('✅ MongoDB Connected\n'));

  const allUsers = await User.find({ role: { $in: ['Employee', 'TL'] } }).select('_id name role department');

  // ── 1. Assign July points ─────────────────────────────────────────────────
  console.log(BOLD('━━━ Assigning July 2026 Points ━━━\n'));
  console.log(CYAN('  Name                  Role       July Points  → User.points'));
  console.log(CYAN('  ──────────────────────────────────────────────────────────'));

  for (const user of allUsers) {
    const pts = JULY_POINTS[user.name] ?? Math.floor(Math.random() * 1000) + 200;

    // Upsert MonthlyPoints for July
    await MonthlyPoints.findOneAndUpdate(
      { employeeId: user._id, month: 7, year: 2026 },
      {
        $set: { points: pts },
        $setOnInsert: { employeeId: user._id, month: 7, year: 2026 }
      },
      { upsert: true, new: true }
    );

    // Update live User.points so leaderboard reflects July
    await User.findByIdAndUpdate(user._id, { $set: { points: pts } });

    console.log(`  ${user.name.padEnd(22)}${user.role.padEnd(11)}${String(pts).padStart(6)}        → ${GREEN(pts)}`);
  }

  // ── 2. Recalculate June rankings (now with correct user IDs after reseed) ─
  console.log(BOLD('\n━━━ Recalculating June 2026 Rankings ━━━\n'));

  // First fix June MonthlyPoints to match current user IDs
  // (the simulateMonthRollover already saved these correctly — just recalc)
  const { starPerformer: juneStar, bestTL: juneTL } = await recalcRankings(6, 2026, allUsers);

  const juneStarUser = juneStar ? await User.findById(juneStar.employeeId).select('name') : null;
  const juneTLUser   = juneTL   ? await User.findById(juneTL.employeeId).select('name')   : null;
  console.log(`  ⭐  June Star Performer: ${GREEN(juneStarUser?.name || '—')}`);
  console.log(`  🏆  June Best TL:        ${GREEN(juneTLUser?.name   || '—')}`);

  // ── 3. Calculate July rankings ────────────────────────────────────────────
  console.log(BOLD('\n━━━ Calculating July 2026 Rankings ━━━\n'));
  const { starPerformer: julyStar, bestTL: julyTL } = await recalcRankings(7, 2026, allUsers);

  const julyStarUser = julyStar ? await User.findById(julyStar.employeeId).select('name') : null;
  const julyTLUser   = julyTL   ? await User.findById(julyTL.employeeId).select('name')   : null;
  console.log(`  ⭐  July Star Performer: ${GREEN(julyStarUser?.name || '—')}`);
  console.log(`  🏆  July Best TL:        ${GREEN(julyTLUser?.name   || '—')}`);

  // ── 4. Update isBestEmployee / isBestTL badges on User docs ───────────────
  await User.updateMany({}, { $set: { isBestEmployee: false, isBestTL: false } });
  if (julyStar) await User.findByIdAndUpdate(julyStar.employeeId, { isBestEmployee: true });
  if (julyTL)   await User.findByIdAndUpdate(julyTL.employeeId,   { isBestTL: true });

  // ── 5. Print final leaderboard ────────────────────────────────────────────
  console.log(BOLD('\n━━━ Current Leaderboard (July 2026) ━━━\n'));
  const ranked = await User.find({ role: { $in: ['Employee', 'TL'] } })
    .select('name role department points isBestEmployee isBestTL')
    .sort({ points: -1 });

  console.log(CYAN('  Rank  Name                  Role       Dept           Points  Badge'));
  console.log(CYAN('  ────────────────────────────────────────────────────────────────────'));
  ranked.forEach((u, i) => {
    const badge = u.isBestEmployee ? ' ⭐ Star Performer'
                : u.isBestTL       ? ' 👑 Best TL'
                : '';
    console.log(`  #${String(i+1).padEnd(4)} ${u.name.padEnd(22)}${u.role.padEnd(11)}${u.department.padEnd(15)}${YELLOW(String(u.points).padStart(5))}${badge}`);
  });

  console.log(BOLD('\n━━━ Done ━━━'));
  console.log(`\n  ${GREEN('✅')} July points assigned to all ${allUsers.length} users`);
  console.log(`  ${GREEN('✅')} June + July rankings calculated`);
  console.log(`  ${GREEN('✅')} Leaderboard updated — refresh the browser\n`);

  await mongoose.disconnect();
  process.exit(0);
}

run().catch(err => {
  console.error('\x1b[31mError:\x1b[0m', err.message);
  process.exit(1);
});
