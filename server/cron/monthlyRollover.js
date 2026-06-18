const cron = require('node-cron');
const User = require('../models/User');
const MonthlyPoints = require('../models/MonthlyPoints');
const { calculateRankings } = require('../controllers/rankingsController');

/**
 * Monthly rollover job — fires at 00:05 on the 1st of every month.
 *
 * What it does:
 *   1. Calculates Star Performer + Best TL for the month that just ended and
 *      writes them to the rankings collection.
 *   2. Pre-creates a MonthlyPoints row (points: 0) for the NEW month for
 *      every employee/TL, using upsert so it is idempotent and never touches
 *      existing months' documents.
 *
 * The 5-minute offset (00:05 instead of 00:00) avoids any midnight race
 * conditions where some systems are still on the previous day.
 *
 * Cron syntax: '5 0 1 * *'
 *   ┌──────── minute  (5)
 *   │ ┌────── hour    (0)
 *   │ │ ┌──── day of month (1)
 *   │ │ │ ┌── month   (every)
 *   │ │ │ │ ┌ day of week (every)
 *   5 0 1 * *
 */
const startMonthlyRolloverCron = () => {
  cron.schedule('5 0 1 * *', async () => {
    const now = new Date();
    const newMonth = now.getMonth() + 1;  // current month (already the new month)
    const newYear  = now.getFullYear();

    // The month that just ended
    const prevDate  = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonth = prevDate.getMonth() + 1;
    const prevYear  = prevDate.getFullYear();

    console.log(`\n🗓  Monthly rollover started — ${newMonth}/${newYear}`);

    try {
      // --- Step 1: Calculate rankings for the month that just ended ---
      console.log(`📊 Calculating rankings for ${prevMonth}/${prevYear}...`);
      const { starPerformer, bestTL } = await calculateRankings(prevMonth, prevYear);

      if (starPerformer) {
        console.log(`⭐  Star Performer recorded (employeeId: ${starPerformer.employeeId})`);
      } else {
        console.log('⚠️  No star performer found — no employee points data for last month?');
      }

      if (bestTL) {
        console.log(`🏆  Best TL recorded (employeeId: ${bestTL.employeeId})`);
      } else {
        console.log('⚠️  No best TL found — no TL points data for last month?');
      }

      // --- Step 2: Pre-create new month rows for all employees and TLs ---
      const users = await User.find({ role: { $in: ['Employee', 'TL'] } }).select('_id');
      console.log(`👥 Pre-creating ${newMonth}/${newYear} rows for ${users.length} users...`);

      let created = 0;
      let skipped = 0;

      for (const user of users) {
        const result = await MonthlyPoints.findOneAndUpdate(
          { employeeId: user._id, month: newMonth, year: newYear },
          {
            $setOnInsert: {
              employeeId: user._id,
              month: newMonth,
              year: newYear,
              points: 0
            }
          },
          { upsert: true, new: false }  // new:false → returns null when newly inserted
        );

        // result is null  → newly inserted (upsert created the doc)
        // result is a doc → already existed, nothing changed
        if (result === null) {
          created++;
        } else {
          skipped++;
        }
      }

      console.log(`✅ Rollover complete — ${created} rows created, ${skipped} already existed.`);
    } catch (err) {
      console.error('❌ Monthly rollover cron error:', err);
    }
  });

  console.log('⏰ Monthly rollover cron scheduled (runs at 00:05 on the 1st of each month)');
};

module.exports = { startMonthlyRolloverCron };
