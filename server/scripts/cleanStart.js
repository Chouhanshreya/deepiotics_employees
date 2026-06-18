/**
 * cleanStart.js
 * -------------
 * Wipes ALL test/seed data and starts fresh with the current real month.
 * Creates only one Admin account — no fake employees, no fake points.
 *
 * Run: node scripts/cleanStart.js
 *
 * After running this:
 *   - Login at your live URL with admin@deepiotics.com / (password you set below)
 *   - Create real employees and TLs through the UI (Admin → Create Employee)
 *   - Assign real points through Point Management
 */
require('dotenv').config();
const mongoose      = require('mongoose');
const User          = require('../models/User');
const MonthlyPoints = require('../models/MonthlyPoints');
const Ranking       = require('../models/Ranking');
const MonthlyArchive = require('../models/MonthlyArchive');
const PointHistory  = require('../models/PointHistory');
const Task          = require('../models/Task');

// ─── CONFIGURE YOUR REAL ADMIN CREDENTIALS HERE ───────────────────────────────
const ADMIN_NAME     = 'Admin';
const ADMIN_EMAIL    = 'admin@deepiotics.com';
const ADMIN_PASSWORD = 'Deepiotics@2026';   // change this to your real password
const ADMIN_DEPT     = 'Management';
// ─────────────────────────────────────────────────────────────────────────────

const GREEN  = s => `\x1b[32m${s}\x1b[0m`;
const YELLOW = s => `\x1b[33m${s}\x1b[0m`;
const BOLD   = s => `\x1b[1m${s}\x1b[0m`;
const RED    = s => `\x1b[31m${s}\x1b[0m`;

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log(GREEN('✅ MongoDB Connected\n'));

  // ── Step 1: Wipe everything ───────────────────────────────────────────────
  console.log(BOLD('━━━ Wiping all existing data ━━━\n'));

  const counts = {
    users:          await User.countDocuments(),
    monthlyPoints:  await MonthlyPoints.countDocuments(),
    rankings:       await Ranking.countDocuments(),
    archives:       await MonthlyArchive.countDocuments(),
    pointHistory:   await PointHistory.countDocuments(),
    tasks:          await Task.countDocuments(),
  };

  console.log('  Before wipe:');
  Object.entries(counts).forEach(([k,v]) => console.log(`    ${k.padEnd(16)}: ${v}`));

  await User.deleteMany({});
  await MonthlyPoints.deleteMany({});
  await Ranking.deleteMany({});
  await MonthlyArchive.deleteMany({});
  await PointHistory.deleteMany({});
  await Task.deleteMany({});

  console.log(GREEN('\n  ✅ All collections wiped.\n'));

  // ── Step 2: Create admin account ─────────────────────────────────────────
  console.log(BOLD('━━━ Creating Admin Account ━━━\n'));

  const admin = new User({
    name:       ADMIN_NAME,
    email:      ADMIN_EMAIL,
    password:   ADMIN_PASSWORD,   // pre-save hook hashes this automatically
    role:       'Admin',
    department: ADMIN_DEPT,
    points:     0,
  });
  await admin.save();

  console.log(`  ${GREEN('✅')} Admin created:`);
  console.log(`     Email    : ${YELLOW(ADMIN_EMAIL)}`);
  console.log(`     Password : ${YELLOW(ADMIN_PASSWORD)}`);
  console.log(`     Role     : Admin\n`);

  // ── Step 3: Initialize current month in monthlyPoints ────────────────────
  // This creates the June 2026 "slot" so the system is ready.
  // Points will remain 0 until you assign them through the UI.
  const now   = new Date();
  const month = now.getMonth() + 1;
  const year  = now.getFullYear();

  console.log(BOLD(`━━━ Initializing ${month}/${year} in MonthlyPoints (empty, ready for real data) ━━━\n`));
  console.log(`  No employees exist yet — monthlyPoints rows will be created`);
  console.log(`  automatically when you add employees and assign points.\n`);

  // ── Done ──────────────────────────────────────────────────────────────────
  console.log(BOLD('━━━ Clean Start Complete ━━━\n'));
  console.log(`  ${GREEN('✅')} Database is clean`);
  console.log(`  ${GREEN('✅')} Admin account ready`);
  console.log(`  ${GREEN('✅')} No fake data\n`);
  console.log(BOLD('  Next steps:'));
  console.log(`  1. Login at your app with ${YELLOW(ADMIN_EMAIL)} / ${YELLOW(ADMIN_PASSWORD)}`);
  console.log(`  2. Go to Create Employee → add your real team members`);
  console.log(`  3. Assign real TLs and link employees to them`);
  console.log(`  4. Use Point Management to assign real points\n`);

  await mongoose.disconnect();
  process.exit(0);
}

run().catch(e => {
  console.error(RED('Error: ') + e.message);
  process.exit(1);
});
