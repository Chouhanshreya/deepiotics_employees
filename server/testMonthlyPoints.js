/**
 * testMonthlyPoints.js
 * ---------------------
 * Self-contained integration test for the monthly points system.
 * Run with:  node testMonthlyPoints.js
 *
 * The script will:
 *   1. Seed the DB if admin credentials don't exist yet
 *   2. Login and capture the JWT (from response body as Bearer, since
 *      httpOnly cookies aren't directly readable in Node http scripts)
 *   3. Run all monthly-points endpoint tests and print PASS/FAIL per step
 *
 * Uses only built-in Node.js modules — no extra deps required.
 */

const http  = require('http');
const https = require('https');

const PORT        = 5000;
const SEED_SECRET = 'deepiotics_seed_2026https://deepiotics-employees-1.onrender.com';

let bearerToken = '';  // set after login

// ─── tiny HTTP helper ──────────────────────────────────────────────────────

function request(method, path, body, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const headers = {
      'Content-Type': 'application/json',
      ...(bearerToken ? { Authorization: `Bearer ${bearerToken}` } : {}),
      ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
      ...extraHeaders
    };

    const options = { hostname: 'localhost', port: PORT, path, method, headers };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });

    req.on('error', (e) => {
      if (e.code === 'ECONNREFUSED') {
        reject(new Error(`Cannot connect to server on port ${PORT}. Is it running? (npm run dev)`));
      } else {
        reject(e);
      }
    });

    if (payload) req.write(payload);
    req.end();
  });
}

// ─── pretty printer ────────────────────────────────────────────────────────

const GREEN = s => `\x1b[32m${s}\x1b[0m`;
const RED   = s => `\x1b[31m${s}\x1b[0m`;
const CYAN  = s => `\x1b[36m${s}\x1b[0m`;
const BOLD  = s => `\x1b[1m${s}\x1b[0m`;

let passed = 0, failed = 0;

function check(label, condition, detail = '') {
  if (condition) {
    console.log(`  ${GREEN('✅ PASS')}  ${label}${detail ? '  →  ' + CYAN(detail) : ''}`);
    passed++;
  } else {
    console.log(`  ${RED('❌ FAIL')}  ${label}${detail ? '  →  ' + RED(detail) : ''}`);
    failed++;
  }
  return condition;
}

// ─── main ──────────────────────────────────────────────────────────────────

async function run() {
  console.log(BOLD('\n━━━ Monthly Points System — Integration Tests ━━━\n'));

  // ── 0. Seed DB if needed ─────────────────────────────────────────────────
  console.log(BOLD('[0] Check / Seed database'));
  const pingLogin = await request('POST', '/api/auth/login', {
    email: 'admin@ems.com', password: 'password123'
  });

  if (pingLogin.status !== 200) {
    console.log(`  ℹ️  Admin not found (got ${pingLogin.status}) — seeding DB now...`);
    const seed = await request('POST', '/api/seed', {}, { 'x-seed-secret': SEED_SECRET });
    if (seed.status === 200) {
      console.log(`  ${GREEN('✅')} DB seeded successfully`);
    } else {
      console.log(`  ${RED('❌')} Seed failed: ${JSON.stringify(seed.body)}`);
      console.log(`  Check SEED_SECRET in server/.env or seed the DB manually.`);
      process.exit(1);
    }
  } else {
    console.log(`  ℹ️  DB already has admin — skipping seed`);
  }

  // ── 1. Login ─────────────────────────────────────────────────────────────
  console.log(BOLD('\n[1] Admin Login'));
  const login = await request('POST', '/api/auth/login', {
    email: 'admin@ems.com', password: 'password123'
  });
  check('Status 200', login.status === 200, `got ${login.status}`);
  check('Token in response', !!login.body.token, login.body.token ? 'present' : 'missing');

  if (login.status !== 200 || !login.body.token) {
    console.log(RED('\nCannot continue without auth token.\n'));
    process.exit(1);
  }

  bearerToken = login.body.token;
  console.log(`  ℹ️  Logged in as: ${login.body.name} (${login.body.role})`);

  // ── 2. Get users — grab real employee + TL IDs ───────────────────────────
  console.log(BOLD('\n[2] Fetch Users'));
  const users = await request('GET', '/api/users');
  check('Status 200', users.status === 200, `got ${users.status}`);

  const allUsers   = Array.isArray(users.body) ? users.body : [];
  const employee   = allUsers.find(u => u.role === 'Employee');
  const tlUser     = allUsers.find(u => u.role === 'TL');
  const employeeId = employee?._id;
  const tlId       = tlUser?._id;

  check('Found an Employee', !!employeeId, employee?.name || 'none');
  check('Found a TL',        !!tlId,        tlUser?.name   || 'none');

  if (!employeeId) {
    console.log(RED('No employees found — seed failed? Exiting.'));
    process.exit(1);
  }

  // ── 3. First points update ────────────────────────────────────────────────
  console.log(BOLD('\n[3] POST /api/points/update — add 150 pts to employee'));
  const up1 = await request('POST', '/api/points/update', { employeeId, pointsToAdd: 150 });
  check('Status 200', up1.status === 200, `got ${up1.status}`);
  const pts1 = up1.body.monthlyPoints?.points;
  // On first call pts will be 150; if test was run before it will be higher — just check it's a number
  check('points is a number', typeof pts1 === 'number', `got ${pts1}`);
  check('points >= 150', pts1 >= 150, `got ${pts1}`);
  check('Correct month/year present',
    !!up1.body.monthlyPoints?.month && !!up1.body.monthlyPoints?.year,
    `${up1.body.monthlyPoints?.month}/${up1.body.monthlyPoints?.year}`);
  console.log(`  ℹ️  ${up1.body.message}`);

  // ── 4. Second call — must accumulate, not reset ───────────────────────────
  console.log(BOLD('\n[4] POST /api/points/update — add 50 more pts (must accumulate)'));
  const up2 = await request('POST', '/api/points/update', { employeeId, pointsToAdd: 50 });
  check('Status 200', up2.status === 200, `got ${up2.status}`);
  const pts2 = up2.body.monthlyPoints?.points;
  check('Incremented by exactly 50', pts2 === pts1 + 50, `was ${pts1}, now ${pts2}, expected ${pts1 + 50}`);

  // ── 5. Add points to TL ───────────────────────────────────────────────────
  if (tlId) {
    console.log(BOLD('\n[5] POST /api/points/update — add 300 pts to TL'));
    const upTL = await request('POST', '/api/points/update', { employeeId: tlId, pointsToAdd: 300 });
    check('Status 200', upTL.status === 200, `got ${upTL.status}`);
    check('TL points is a number', typeof upTL.body.monthlyPoints?.points === 'number',
      `got ${upTL.body.monthlyPoints?.points}`);
    console.log(`  ℹ️  ${upTL.body.message}`);
  }

  // ── 6. GET current month points ───────────────────────────────────────────
  console.log(BOLD('\n[6] GET /api/points/current/:employeeId'));
  const cur = await request('GET', `/api/points/current/${employeeId}`);
  check('Status 200', cur.status === 200, `got ${cur.status}`);
  check('points matches last update', cur.body.points === pts2, `got ${cur.body.points}, expected ${pts2}`);
  check('month + year present', !!cur.body.month && !!cur.body.year, `${cur.body.month}/${cur.body.year}`);

  // ── 7. Input validation ───────────────────────────────────────────────────
  console.log(BOLD('\n[7] Input validation — all bad inputs must return 400'));

  const v1 = await request('POST', '/api/points/update', { employeeId: 'not-an-id', pointsToAdd: 10 });
  check('Invalid ObjectId → 400', v1.status === 400, `${v1.status}: ${v1.body.message}`);

  const v2 = await request('POST', '/api/points/update', { employeeId, pointsToAdd: 0 });
  check('pointsToAdd=0 → 400', v2.status === 400, `${v2.status}: ${v2.body.message}`);

  const v3 = await request('POST', '/api/points/update', { employeeId, pointsToAdd: 5000 });
  check('pointsToAdd=5000 → 400 (exceeds limit)', v3.status === 400, `${v3.status}: ${v3.body.message}`);

  const v4 = await request('POST', '/api/points/update', { pointsToAdd: 10 });
  check('Missing employeeId → 400', v4.status === 400, `${v4.status}: ${v4.body.message}`);

  const v5 = await request('GET', '/api/analysis?months=5');
  check('months=5 → 400 (not in 1,3,6,12)', v5.status === 400, `${v5.status}: ${v5.body.message}`);

  const v6 = await request('GET', '/api/analysis?months=abc');
  check('months=abc → 400', v6.status === 400, `${v6.status}: ${v6.body.message}`);

  const v7 = await request('GET', '/api/analysis');
  check('missing months param → 400', v7.status === 400, `${v7.status}: ${v7.body.message}`);

  // ── 8. Analysis — months=1 ───────────────────────────────────────────────
  console.log(BOLD('\n[8] GET /api/analysis?months=1'));
  const an1 = await request('GET', '/api/analysis?months=1');
  check('Status 200', an1.status === 200, `got ${an1.status}`);
  check('data is an array', Array.isArray(an1.body.data), `type=${typeof an1.body.data}`);
  check('At least 1 result', (an1.body.data?.length ?? 0) > 0, `count=${an1.body.count}`);
  check('rangeFrom + rangeTo present', !!an1.body.rangeFrom, `${an1.body.rangeFrom} → ${an1.body.rangeTo}`);

  if (an1.body.data?.length >= 2) {
    check('Sorted descending by totalPoints',
      an1.body.data[0].totalPoints >= an1.body.data[1].totalPoints,
      `[0]=${an1.body.data[0].totalPoints}, [1]=${an1.body.data[1].totalPoints}`);
  }

  const top = an1.body.data?.[0];
  check('Employee has name + role + department', !!top?.name && !!top?.role && !!top?.department,
    `${top?.name}, ${top?.role}, ${top?.department}`);
  check('Has totalPoints + avgPoints + monthsWithData',
    top?.totalPoints !== undefined && top?.avgPoints !== undefined && top?.monthsWithData !== undefined,
    `total=${top?.totalPoints}, avg=${top?.avgPoints}, months=${top?.monthsWithData}`);
  console.log(`  ℹ️  Top: ${top?.name} — ${top?.totalPoints} pts (avg ${top?.avgPoints})`);

  // ── 9. Analysis — months=3, 6, 12 ────────────────────────────────────────
  console.log(BOLD('\n[9] GET /api/analysis — months=3, 6, 12'));
  for (const n of [3, 6, 12]) {
    const an = await request('GET', `/api/analysis?months=${n}`);
    check(`months=${n} → 200`, an.status === 200,
      `count=${an.body.count}, range=${an.body.rangeFrom} → ${an.body.rangeTo}`);
  }

  // ── 10. Rankings calculate ────────────────────────────────────────────────
  console.log(BOLD('\n[10] POST /api/rankings/calculate'));
  const rank = await request('POST', '/api/rankings/calculate', {});
  check('Status 200', rank.status === 200, `got ${rank.status}`);
  check('starPerformer present', !!rank.body.starPerformer,
    rank.body.starPerformer ? `employeeId=${rank.body.starPerformer.employeeId}` : 'null — no employee points yet?');
  check('bestTL present', !!rank.body.bestTL,
    rank.body.bestTL ? `employeeId=${rank.body.bestTL.employeeId}` : 'null — no TL points yet?');
  console.log(`  ℹ️  ${rank.body.message}`);

  // ── 11. GET rankings list ─────────────────────────────────────────────────
  console.log(BOLD('\n[11] GET /api/rankings?month=<now>&year=<now>'));
  const now   = new Date();
  const month = now.getMonth() + 1;
  const year  = now.getFullYear();
  const rList = await request('GET', `/api/rankings?month=${month}&year=${year}`);
  check('Status 200', rList.status === 200, `got ${rList.status}`);
  check('rankings array present', Array.isArray(rList.body.rankings),
    `length=${rList.body.rankings?.length}`);
  check('At least 1 ranking stored', (rList.body.rankings?.length ?? 0) > 0,
    `got ${rList.body.rankings?.length}`);

  const r0 = rList.body.rankings?.[0];
  if (r0) {
    check('Employee name populated via $lookup', !!r0.employeeId?.name, r0.employeeId?.name || 'missing');
  }

  // ── 12. Idempotency — calculate again must not error ──────────────────────
  console.log(BOLD('\n[12] Idempotency — run rankings/calculate twice'));
  const rank2 = await request('POST', '/api/rankings/calculate', { month, year });
  check('Second calculate → 200 (no duplicate error)', rank2.status === 200, `got ${rank2.status}`);

  // Confirm still only correct number of rankings (not doubled)
  const rList2 = await request('GET', `/api/rankings?month=${month}&year=${year}`);
  const countBefore = rList.body.rankings?.length ?? 0;
  const countAfter  = rList2.body.rankings?.length ?? 0;
  check('Rankings count did not double after second calculate',
    countAfter === countBefore, `before=${countBefore}, after=${countAfter}`);

  // ── 13. Immutability — increment again, old value stays a snapshot ────────
  console.log(BOLD('\n[13] Immutability — increment points again, confirm $inc works'));
  const before = await request('GET', `/api/points/current/${employeeId}`);
  const ptsBefore = before.body.points;

  await request('POST', '/api/points/update', { employeeId, pointsToAdd: 25 });

  const after = await request('GET', `/api/points/current/${employeeId}`);
  const ptsAfter = after.body.points;
  check('Points incremented by exactly 25', ptsAfter === ptsBefore + 25,
    `was ${ptsBefore}, now ${ptsAfter}, expected ${ptsBefore + 25}`);

  // ── Summary ───────────────────────────────────────────────────────────────
  const total = passed + failed;
  console.log(BOLD(`\n━━━ Results: ${GREEN(passed + ' passed')} / ${failed > 0 ? RED(failed + ' failed') : '0 failed'} / ${total} total ━━━\n`));

  if (failed > 0) process.exit(1);
}

run().catch(err => {
  console.error(RED('\nUnhandled error: ') + err.message);
  if (err.message.includes('ECONNREFUSED')) {
    console.error('  → Start the server first:  npm run dev\n');
  }
  process.exit(1);
});
