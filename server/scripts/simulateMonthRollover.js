/**
 * simulateMonthRollover.js
 * ------------------------
 * Simulates what the cron job does on the 1st of every month.
 *
 * What it does:
 *   1. Shows all employees' CURRENT points (June 2026)
 *   2. Saves June 2026 data into MonthlyPoints (as historical record)
 *   3. Calculates Star Performer + Best TL for June → writes to Rankings
 *   4. Resets all User.points to 0
 *   5. Creates fresh July 2026 rows in MonthlyPoints (points: 0)
 *   6. Shows the new state so you can see the reset happened
 *
 * Run with:  node scripts/simulateMonthRollover.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const MonthlyPoints = require('../models/MonthlyPoints');
const Ranking = require('../models/Ranking');

const BOLD  = s => `\x1b[1m${s}\x1b[0m`;
const GREEN = s => `\x1b[32m${s}\x1b[0m`;
const CYAN  = s => `\x1b[36m${s}\x1b[0m`;
const YELLOW = s => `\x1b[33m${s}\x1b[0m`;
const RED   = s => `\x1b[31m${s}\x1b[0m`;

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log(GREEN('✅ MongoDB Connected\n'));

  // ── Months we're working with ─────────────────────────────────────────────
  const OLD_MONTH = 6;  const OLD_YEAR = 2026;   // June  — month ending
  const NEW_MONTH = 7;  const NEW_YEAR = 2026;   // July  — month starting

  // ── Step 1: Show current state ────────────────────────────────────────────
  console.log(BOLD('━━━ BEFORE ROLLOVER (June 2026) ━━━\n'));

  const allUsers = await User.find({ role: { $in: ['Employee', 'TL'] } })
    .select('name role department points')
    .sort({ role: 1, points: -1 });

  console.log(CYAN('  Name                  Role       Dept           Points'));
  console.log(CYAN('  ─────────────────────────────────────────────────────'));
  for (const u of allUsers) {
    const pts = String(u.points).padStart(6);
    console.log(`  ${u.name.padEnd(22)}${u.role.padEnd(11)}${u.department.padEnd(15)}${pts}`);
  }

  // ── Step 2: Save June data into MonthlyPoints (upsert — safe to re-run) ──
  console.log(BOLD('\n━━━ STEP 1: Archiving June 2026 into MonthlyPoints ━━━\n'));

  let archived = 0;
  for (const u of allUsers) {
    await MonthlyPoints.findOneAndUpdate(
      { employeeId: u._id, month: OLD_MONTH, year: OLD_YEAR },
      {
        $set: { points: u.points },
        $setOnInsert: { employeeId: u._id, month: OLD_MONTH, year: OLD_YEAR }
      },
      { upsert: true, new: true }
    );
    console.log(`  ${GREEN('✅')} Saved ${u.name.padEnd(20)} → ${OLD_MONTH}/${OLD_YEAR} = ${YELLOW(u.points + ' pts')}`);
    archived++;
  }
  console.log(`\n  ${archived} records saved to monthlypoints collection.`);

  // ── Step 3: Calculate rankings for June ───────────────────────────────────
  console.log(BOLD('\n━━━ STEP 2: Calculating Rankings for June 2026 ━━━\n'));

  const employees = allUsers.filter(u => u.role === 'Employee');
  const tls       = allUsers.filter(u => u.role === 'TL');

  const topEmployee = employees.sort((a, b) => b.points - a.points)[0];
  const topTL       = tls.sort((a, b) => b.points - a.points)[0];

  if (topEmployee) {
    await Ranking.findOneAndUpdate(
      { employeeId: topEmployee._id, month: OLD_MONTH, year: OLD_YEAR, isStarPerformer: true },
      { $set: { employeeId: topEmployee._id, month: OLD_MONTH, year: OLD_YEAR,
                rankPosition: 1, isStarPerformer: true, isBestTL: false } },
      { upsert: true, new: true }
    );
    console.log(`  ⭐  Star Performer: ${GREEN(topEmployee.name)} with ${YELLOW(topEmployee.points + ' pts')}`);
  }

  if (topTL) {
    await Ranking.findOneAndUpdate(
      { employeeId: topTL._id, month: OLD_MONTH, year: OLD_YEAR, isBestTL: true },
      { $set: { employeeId: topTL._id, month: OLD_MONTH, year: OLD_YEAR,
                rankPosition: 1, isStarPerformer: false, isBestTL: true } },
      { upsert: true, new: true }
    );
    console.log(`  🏆  Best TL:         ${GREEN(topTL.name)} with ${YELLOW(topTL.points + ' pts')}`);
  }

  // ── Step 4: Reset all User.points to 0 ────────────────────────────────────
  console.log(BOLD('\n━━━ STEP 3: Resetting all User.points to 0 ━━━\n'));

  const resetResult = await User.updateMany(
    { role: { $in: ['Employee', 'TL'] } },
    { $set: { points: 0 } }
  );
  console.log(`  ${GREEN('✅')} Reset ${resetResult.modifiedCount} users to 0 points.`);

  // ── Step 5: Create July 2026 rows in MonthlyPoints ────────────────────────
  console.log(BOLD('\n━━━ STEP 4: Creating July 2026 MonthlyPoints rows ━━━\n'));

  let created = 0, existed = 0;
  for (const u of allUsers) {
    const existing = await MonthlyPoints.findOneAndUpdate(
      { employeeId: u._id, month: NEW_MONTH, year: NEW_YEAR },
      { $setOnInsert: { employeeId: u._id, month: NEW_MONTH, year: NEW_YEAR, points: 0 } },
      { upsert: true, new: false }
    );
    if (!existing) {
      console.log(`  ${GREEN('✅')} Created July row for ${u.name.padEnd(20)} → points: 0`);
      created++;
    } else {
      console.log(`  ${CYAN('ℹ️ ')} July row already existed for ${u.name} (skipped)`);
      existed++;
    }
  }
  console.log(`\n  ${created} new rows created, ${existed} already existed.`);

  // ── Step 6: Show new state ─────────────────────────────────────────────────
  console.log(BOLD('\n━━━ AFTER ROLLOVER (July 2026) ━━━\n'));

  const freshUsers = await User.find({ role: { $in: ['Employee', 'TL'] } })
    .select('name role department points')
    .sort({ role: 1, name: 1 });

  console.log(CYAN('  Name                  Role       Dept           Points'));
  console.log(CYAN('  ─────────────────────────────────────────────────────'));
  for (const u of freshUsers) {
    const pts = String(u.points).padStart(6);
    console.log(`  ${u.name.padEnd(22)}${u.role.padEnd(11)}${u.department.padEnd(15)}${GREEN(pts)}`);
  }

  // ── Step 7: Verify June history is still intact ───────────────────────────
  console.log(BOLD('\n━━━ VERIFY: June 2026 history still intact in MonthlyPoints ━━━\n'));

  const juneRecords = await MonthlyPoints.find({ month: OLD_MONTH, year: OLD_YEAR })
    .populate('employeeId', 'name role')
    .sort({ points: -1 });

  console.log(CYAN('  Name                  Role       June Points'));
  console.log(CYAN('  ──────────────────────────────────────────'));
  for (const r of juneRecords) {
    const name = r.employeeId?.name || 'Unknown';
    const role = r.employeeId?.role || '?';
    console.log(`  ${name.padEnd(22)}${role.padEnd(11)}${YELLOW(r.points + ' pts')}`);
  }

  // ── Step 8: Show July rows ─────────────────────────────────────────────────
  console.log(BOLD('\n━━━ July 2026 rows in MonthlyPoints (all start at 0) ━━━\n'));

  const julyRecords = await MonthlyPoints.find({ month: NEW_MONTH, year: NEW_YEAR })
    .populate('employeeId', 'name role')
    .sort({ 'employeeId.role': 1 });

  console.log(CYAN('  Name                  Role       July Points'));
  console.log(CYAN('  ──────────────────────────────────────────'));
  for (const r of julyRecords) {
    const name = r.employeeId?.name || 'Unknown';
    const role = r.employeeId?.role || '?';
    console.log(`  ${name.padEnd(22)}${role.padEnd(11)}${GREEN(r.points + ' pts')}`);
  }

  console.log(BOLD('\n━━━ Rollover Complete ━━━'));
  console.log(`\n  ${GREEN('✅')} June 2026 preserved as history`);
  console.log(`  ${GREEN('✅')} Star Performer + Best TL recorded for June`);
  console.log(`  ${GREEN('✅')} All user points reset to 0`);
  console.log(`  ${GREEN('✅')} July 2026 rows created — ready for a fresh month\n`);

  await mongoose.disconnect();
  process.exit(0);
}

run().catch(err => {
  console.error(RED('Error: ') + err.message);
  process.exit(1);
});
