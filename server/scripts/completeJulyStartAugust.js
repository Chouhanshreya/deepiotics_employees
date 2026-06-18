/**
 * completeJulyStartAugust.js
 * --------------------------
 * 1. Locks July 2026 as a completed month (rankings already exist — just confirms them)
 * 2. Resets User.points to 0  (August starts fresh)
 * 3. Creates August 2026 monthlypoints rows (points: 0) for every employee/TL
 * 4. Seeds realistic August 2026 points into monthlypoints + updates User.points
 * 5. Calculates August Star Performer + Best TL → writes to rankings
 *
 * Run: node scripts/completeJulyStartAugust.js
 */
require('dotenv').config();
const mongoose      = require('mongoose');
const User          = require('../models/User');
const MonthlyPoints = require('../models/MonthlyPoints');
const Ranking       = require('../models/Ranking');

const BOLD   = s => `\x1b[1m${s}\x1b[0m`;
const GREEN  = s => `\x1b[32m${s}\x1b[0m`;
const YELLOW = s => `\x1b[33m${s}\x1b[0m`;
const CYAN   = s => `\x1b[36m${s}\x1b[0m`;
const DIM    = s => `\x1b[2m${s}\x1b[0m`;

// August 2026 — new month, new scores
const AUGUST_PTS = {
  'Alice Brown':    3200,   // Alice bounces back to #1
  'Bob Wilson':     2100,
  'Charlie Davis':  1800,
  'Diana Miller':   2750,   // Diana big improvement
  'Eve Taylor':     2400,   // still strong after July win
  'Frank Anderson': 900,
  'Grace Thomas':   3050,   // Grace chasing Alice
  'Henry Martinez': 1300,
  'Ivy Garcia':     600,
  'Jack Robinson':  450,
  'John Smith':     410,    // TL
  'Sarah Johnson':  290,    // TL
};

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log(GREEN('✅ MongoDB Connected\n'));

  const users    = await User.find({ role: { $in: ['Employee', 'TL'] } });
  const empUsers = users.filter(u => u.role === 'Employee');
  const tlUsers  = users.filter(u => u.role === 'TL');

  // ── Step 1: Confirm July is locked (rankings exist) ──────────────────────
  console.log(BOLD('━━━ STEP 1: July 2026 — Confirming Locked ━━━\n'));

  const julyStar = await Ranking.findOne({ month: 7, year: 2026, isStarPerformer: true })
    .populate('employeeId', 'name department');
  const julyTL   = await Ranking.findOne({ month: 7, year: 2026, isBestTL: true })
    .populate('employeeId', 'name department');

  if (julyStar?.employeeId?.name) {
    console.log(`  ⭐  July Star Performer : ${GREEN(julyStar.employeeId.name)} — ${julyStar.employeeId.department}`);
  } else {
    console.log(`  ⚠️  July Star Performer not found — recalculating...`);
    const topEmpDoc = await MonthlyPoints.findOne({ month: 7, year: 2026, employeeId: { $in: empUsers.map(u => u._id) } }).sort({ points: -1 });
    if (topEmpDoc) {
      await Ranking.findOneAndUpdate(
        { month: 7, year: 2026, isStarPerformer: true },
        { $set: { employeeId: topEmpDoc.employeeId, month: 7, year: 2026, rankPosition: 1, isStarPerformer: true, isBestTL: false } },
        { upsert: true }
      );
      const u = await User.findById(topEmpDoc.employeeId);
      console.log(`  ⭐  July Star Performer : ${GREEN(u?.name || '?')} — ${u?.department}`);
    }
  }

  if (julyTL?.employeeId?.name) {
    console.log(`  👑  July Best TL        : ${GREEN(julyTL.employeeId.name)} — ${julyTL.employeeId.department}`);
  } else {
    const topTLDoc = await MonthlyPoints.findOne({ month: 7, year: 2026, employeeId: { $in: tlUsers.map(u => u._id) } }).sort({ points: -1 });
    if (topTLDoc) {
      await Ranking.findOneAndUpdate(
        { month: 7, year: 2026, isBestTL: true },
        { $set: { employeeId: topTLDoc.employeeId, month: 7, year: 2026, rankPosition: 1, isStarPerformer: false, isBestTL: true } },
        { upsert: true }
      );
      const u = await User.findById(topTLDoc.employeeId);
      console.log(`  👑  July Best TL        : ${GREEN(u?.name || '?')} — ${u?.department}`);
    }
  }

  console.log(`\n  ${GREEN('✅')} July 2026 is locked. Historical data preserved.\n`);

  // ── Step 2: Reset User.points to 0 for August fresh start ────────────────
  console.log(BOLD('━━━ STEP 2: Resetting All Points → 0 (August starts) ━━━\n'));

  const resetResult = await User.updateMany(
    { role: { $in: ['Employee', 'TL'] } },
    { $set: { points: 0, isBestEmployee: false, isBestTL: false } }
  );
  console.log(`  ${GREEN('✅')} ${resetResult.modifiedCount} users reset to 0 points.\n`);

  // ── Step 3: Create empty August rows (the cron would do this automatically) ──
  console.log(BOLD('━━━ STEP 3: Creating August 2026 MonthlyPoints rows ━━━\n'));

  let created = 0;
  for (const u of users) {
    const existing = await MonthlyPoints.findOne({ employeeId: u._id, month: 8, year: 2026 });
    if (!existing) {
      await MonthlyPoints.create({ employeeId: u._id, month: 8, year: 2026, points: 0 });
      created++;
    }
  }
  console.log(`  ${GREEN('✅')} ${created} fresh August rows created (points: 0).\n`);

  // ── Step 4: Seed August points ────────────────────────────────────────────
  console.log(BOLD('━━━ STEP 4: Seeding August 2026 Points ━━━\n'));
  console.log(CYAN('  Name                  Role       Aug Points'));
  console.log(CYAN('  ──────────────────────────────────────────'));

  for (const u of users) {
    const pts = AUGUST_PTS[u.name] ?? Math.floor(Math.random() * 800) + 200;

    // Update monthlypoints for August
    await MonthlyPoints.findOneAndUpdate(
      { employeeId: u._id, month: 8, year: 2026 },
      { $set: { points: pts } }
    );

    // Update live User.points so leaderboard reflects August
    await User.findByIdAndUpdate(u._id, { $set: { points: pts } });

    console.log(`  ${u.name.padEnd(22)}${u.role.padEnd(11)}${YELLOW(String(pts).padStart(5))}`);
  }

  // ── Step 5: Calculate August rankings ────────────────────────────────────
  console.log(BOLD('\n━━━ STEP 5: Calculating August 2026 Rankings ━━━\n'));

  const topAugEmp = await MonthlyPoints.findOne(
    { month: 8, year: 2026, employeeId: { $in: empUsers.map(u => u._id) } }
  ).sort({ points: -1 });

  const topAugTL = await MonthlyPoints.findOne(
    { month: 8, year: 2026, employeeId: { $in: tlUsers.map(u => u._id) } }
  ).sort({ points: -1 });

  if (topAugEmp) {
    await Ranking.findOneAndUpdate(
      { month: 8, year: 2026, isStarPerformer: true },
      { $set: { employeeId: topAugEmp.employeeId, month: 8, year: 2026, rankPosition: 1, isStarPerformer: true, isBestTL: false } },
      { upsert: true }
    );
    const u = await User.findByIdAndUpdate(
      topAugEmp.employeeId,
      { isBestEmployee: true },
      { new: true }
    );
    console.log(`  ⭐  August Star Performer : ${GREEN(u.name)} (${YELLOW(AUGUST_PTS[u.name] + ' pts')})`);
  }

  if (topAugTL) {
    await Ranking.findOneAndUpdate(
      { month: 8, year: 2026, isBestTL: true },
      { $set: { employeeId: topAugTL.employeeId, month: 8, year: 2026, rankPosition: 1, isStarPerformer: false, isBestTL: true } },
      { upsert: true }
    );
    const u = await User.findByIdAndUpdate(
      topAugTL.employeeId,
      { isBestTL: true },
      { new: true }
    );
    console.log(`  👑  August Best TL        : ${GREEN(u.name)} (${YELLOW(AUGUST_PTS[u.name] + ' pts')})`);
  }

  // ── Step 6: Final leaderboard ─────────────────────────────────────────────
  console.log(BOLD('\n━━━ Final Leaderboard — August 2026 ━━━\n'));

  const ranked = await User.find({ role: { $in: ['Employee', 'TL'] } })
    .sort({ points: -1 });

  console.log(CYAN('  Rank  Name                  Role       Dept           Points  Badge'));
  console.log(CYAN('  ──────────────────────────────────────────────────────────────────'));
  ranked.forEach((u, i) => {
    const badge = u.isBestEmployee ? ' ⭐ Star Performer'
                : u.isBestTL       ? ' 👑 Best TL'
                : '';
    console.log(`  #${String(i+1).padEnd(4)} ${u.name.padEnd(22)}${u.role.padEnd(11)}${u.department.padEnd(15)}${YELLOW(String(u.points).padStart(5))}${badge}`);
  });

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log(BOLD('\n━━━ Summary ━━━'));
  console.log(`\n  ${GREEN('✅')} June 2026  — historical data preserved`);
  console.log(`  ${GREEN('✅')} July 2026  — locked as completed month`);
  console.log(`  ${GREEN('✅')} August 2026 — fresh start, points seeded, rankings calculated`);
  console.log(`\n  Now in Monthly History:`);
  console.log(`  ${DIM('→ Jun 2026 : Frank Anderson ⭐  |  John Smith 👑')}`);
  console.log(`  ${DIM('→ Jul 2026 : Eve Taylor ⭐     |  Sarah Johnson 👑')}`);
  console.log(`  ${DIM('→ Aug 2026 : Alice Brown ⭐    |  John Smith 👑')}\n`);

  await mongoose.disconnect();
  process.exit(0);
}

run().catch(e => { console.error('\x1b[31mError:\x1b[0m', e.message); process.exit(1); });
