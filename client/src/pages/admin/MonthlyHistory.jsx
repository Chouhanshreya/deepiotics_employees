import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { Calendar, TrendingUp, Star, ChevronDown, RefreshCw, Trophy } from 'lucide-react';
import Avatar from '../../components/Avatar';
import api from '../../utils/api';
import { useDepartment } from '../../context/DepartmentContext';

const MONTH_NAMES = ['','Jan','Feb','Mar','Apr','May','Jun',
                        'Jul','Aug','Sep','Oct','Nov','Dec'];

const BAR_COLORS = [
  '#6366f1','#8b5cf6','#ec4899','#f97316','#14b8a6',
  '#3b82f6','#22c55e','#f59e0b','#ef4444','#06b6d4'
];

const RANGE_OPTIONS = [
  { label: '1 Month',   value: 1  },
  { label: '3 Months',  value: 3  },
  { label: '6 Months',  value: 6  },
  { label: '12 Months', value: 12 },
];

// ─── API helpers ──────────────────────────────────────────────────────────────
const getAnalysis          = (months, dept) => api.get(`/analysis?months=${months}${dept ? `&department=${encodeURIComponent(dept)}` : ''}`);
const getRankings          = (m, y, dept)   => api.get(`/rankings?month=${m}&year=${y}${dept ? `&department=${encodeURIComponent(dept)}` : ''}`);
const calcRankings         = (m, y)         => api.post('/rankings/calculate', { month: m, year: y });
const getAvailableMonths   = ()             => api.get('/points/available-months');
const getTopPerformersByRange = (n, dept)   => api.get(`/analysis/top-performers?months=${n}${dept ? `&department=${encodeURIComponent(dept)}` : ''}`);

// ─────────────────────────────────────────────────────────────────────────────

const MonthlyHistory = () => {
  const { activeDept, deptFilter } = useDepartment();
  // Available months loaded from DB (only months with real data)
  const [availableMonths, setAvailableMonths] = useState([]);
  const [selKey,   setSelKey]   = useState('');   // "M-YYYY" string
  const [selMonth, setSelMonth] = useState(null);
  const [selYear,  setSelYear]  = useState(null);

  const [range,      setRange]      = useState(3);
  const [cumulData,  setCumulData]  = useState(null);
  const [rankings,   setRankings]   = useState(null);

  // Multi-month best performers (3 months and 6 months)
  const [multiWinners, setMultiWinners] = useState({ 3: null, 6: null });
  const [multiLoading, setMultiLoading] = useState(true);

  const [monthsLoading, setMonthsLoading] = useState(true);
  const [cumulLoading,  setCumulLoading]  = useState(false);
  const [rankLoading,   setRankLoading]   = useState(false);
  const [calcLoading,   setCalcLoading]   = useState(false);
  const [toast,         setToast]         = useState('');

  // ── 1. Load available months on mount ────────────────────────────────────
  useEffect(() => {
    (async () => {
      setMonthsLoading(true);
      try {
        const res = await getAvailableMonths();
        const months = res.data.months || [];   // [{month:8,year:2026},{month:7,year:2026},...]
        setAvailableMonths(months);

        // Default to the most recent month (first in the sorted list)
        if (months.length > 0) {
          const first = months[0];
          setSelMonth(first.month);
          setSelYear(first.year);
          setSelKey(`${first.month}-${first.year}`);
        }
      } catch (e) {
        console.error('getAvailableMonths error', e);
        // Fallback: current month
        const now = new Date();
        const m = now.getMonth() + 1;
        const y = now.getFullYear();
        setAvailableMonths([{ month: m, year: y }]);
        setSelMonth(m); setSelYear(y); setSelKey(`${m}-${y}`);
      } finally {
        setMonthsLoading(false);
      }
    })();
  }, []);

  // ── 2. Fetch rankings when selected month OR dept changes ─────────────────
  useEffect(() => {
    if (!selMonth || !selYear) return;
    (async () => {
      setRankLoading(true);
      setRankings(null);
      try {
        const res = await getRankings(selMonth, selYear, deptFilter);
        setRankings(res.data);
      } catch (e) {
        console.error('getRankings error', e);
      } finally {
        setRankLoading(false);
      }
    })();
  }, [selMonth, selYear, deptFilter]);

  // ── 3. Fetch cumulative analysis when range OR dept changes ───────────────
  useEffect(() => {
    (async () => {
      setCumulLoading(true);
      try {
        const res = await getAnalysis(range, deptFilter);
        setCumulData(res.data);
      } catch (e) {
        console.error('getAnalysis error', e);
      } finally {
        setCumulLoading(false);
      }
    })();
  }, [range, deptFilter]);

  // ── 4. Fetch 3-month and 6-month best performers when dept changes ─────────
  useEffect(() => {
    (async () => {
      setMultiLoading(true);
      try {
        const [res3, res6] = await Promise.all([
          getTopPerformersByRange(3, deptFilter),
          getTopPerformersByRange(6, deptFilter),
        ]);
        setMultiWinners({ 3: res3.data, 6: res6.data });
      } catch (e) {
        console.error('multiWinners error', e);
      } finally {
        setMultiLoading(false);
      }
    })();
  }, [deptFilter]);

  // ── handlers ──────────────────────────────────────────────────────────────
  const handleMonthChange = (e) => {
    const val = e.target.value;
    setSelKey(val);
    const [m, y] = val.split('-').map(Number);
    setSelMonth(m);
    setSelYear(y);
  };

  const handleCalcRankings = async () => {
    if (!selMonth || !selYear) return;
    setCalcLoading(true);
    setRankings(null);
    try {
      await calcRankings(selMonth, selYear);
      await new Promise(r => setTimeout(r, 400));
      const res = await getRankings(selMonth, selYear, deptFilter);
      setRankings(res.data);
      showToast(`Rankings calculated for ${MONTH_NAMES[selMonth]} ${selYear} ✅`);
    } catch (e) {
      console.error('calcRankings error', e);
      showToast('Failed to calculate rankings ❌');
    } finally {
      setCalcLoading(false);
    }
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  // ── derived ───────────────────────────────────────────────────────────────
  const starPerformer = rankings?.rankings?.find(r => r.isStarPerformer);
  const bestTL        = rankings?.rankings?.find(r => r.isBestTL);
  // Filter cumulative table by dept if admin has toggled a dept
  const rawTableData  = cumulData?.data || [];
  const tableData     = deptFilter
    ? rawTableData.filter(e => e.department === deptFilter)
    : rawTableData;
  const chartData     = tableData.slice(0, 10).map(e => ({
    name: e.name?.split(' ')[0] || '?',
    pts:  e.totalPoints,
  }));
  const selectedLabel = selMonth && selYear
    ? `${MONTH_NAMES[selMonth]} ${selYear}`
    : '';

  // ─── render ───────────────────────────────────────────────────────────────
  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 w-full">

      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-gray-800 text-white text-sm px-5 py-3 rounded-xl shadow-xl">
          {toast}
        </div>
      )}

      {/* ── Header + Month Dropdown ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-800 flex items-center gap-2">
            <Calendar size={24} className="text-indigo-500" />
            Monthly History
            {deptFilter && (
              <span className={`text-sm font-semibold px-3 py-1 rounded-full
                ${activeDept === 'R&D' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
                {activeDept === 'R&D' ? '🔬' : '💻'} {activeDept}
              </span>
            )}
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Select a month to see that month's performance and winners
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Month dropdown — only shows months with actual data */}
          <div className="relative">
            {monthsLoading ? (
              <div className="w-36 h-10 bg-gray-100 rounded-xl animate-pulse" />
            ) : (
              <>
                <select
                  value={selKey}
                  onChange={handleMonthChange}
                  className="appearance-none bg-white border border-gray-200 shadow-sm text-gray-800 font-bold text-sm pl-4 pr-10 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 cursor-pointer min-w-[150px]"
                >
                  {availableMonths.map(({ month, year }) => (
                    <option key={`${month}-${year}`} value={`${month}-${year}`}>
                      {MONTH_NAMES[month]} {year}
                    </option>
                  ))}
                </select>
                <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </>
            )}
          </div>

          <button
            onClick={() => {
              if (selMonth && selYear) {
                setRankings(null);
                getRankings(selMonth, selYear, deptFilter)
                  .then(r => setRankings(r.data))
                  .catch(console.error);
              }
              setCumulData(null);
              getAnalysis(range, deptFilter)
                .then(r => setCumulData(r.data))
                .catch(console.error);
            }}
            className="p-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* ── Winner Cards ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Star Performer */}
        {rankLoading ? (
          <div className="bg-amber-50 rounded-2xl h-28 flex items-center justify-center border border-amber-100">
            <div className="w-6 h-6 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : starPerformer ? (
          <div className="bg-gradient-to-br from-amber-400 to-yellow-300 rounded-2xl p-5 flex items-center gap-5 shadow-md">
            <span className="text-6xl select-none">🏅</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-amber-800 uppercase tracking-widest mb-1">
                ⭐ Star Performer — {selectedLabel}
              </p>
              <p className="text-2xl font-black text-white truncate">
                {starPerformer.employeeId?.name || starPerformer.name || '—'}
              </p>
              <p className="text-amber-100 text-sm mt-0.5">
                {starPerformer.employeeId?.department || starPerformer.department || ''} · Employee
              </p>
            </div>
          </div>
        ) : (
          <div
            onClick={handleCalcRankings}
            className="bg-amber-50 border-2 border-dashed border-amber-200 rounded-2xl p-5 flex items-center gap-4 cursor-pointer hover:bg-amber-100 transition-colors"
          >
            <span className="text-5xl opacity-40 select-none">🏅</span>
            <div>
              <p className="font-semibold text-amber-700">No Star Performer yet</p>
              <p className="text-sm text-amber-500 mt-0.5">
                Click to calculate for <span className="font-bold">{selectedLabel}</span>
              </p>
            </div>
          </div>
        )}

        {/* Best TL */}
        {rankLoading ? (
          <div className="bg-purple-50 rounded-2xl h-28 flex items-center justify-center border border-purple-100">
            <div className="w-6 h-6 border-4 border-purple-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : bestTL ? (
          <div className="bg-gradient-to-br from-purple-500 to-indigo-500 rounded-2xl p-5 flex items-center gap-5 shadow-md">
            <span className="text-6xl select-none">👑</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-purple-200 uppercase tracking-widest mb-1">
                🏆 Best TL — {selectedLabel}
              </p>
              <p className="text-2xl font-black text-white truncate">
                {bestTL.employeeId?.name || bestTL.name || '—'}
              </p>
              <p className="text-purple-200 text-sm mt-0.5">
                {bestTL.employeeId?.department || bestTL.department || ''} · Team Lead
              </p>
            </div>
          </div>
        ) : (
          <div
            onClick={handleCalcRankings}
            className="bg-purple-50 border-2 border-dashed border-purple-200 rounded-2xl p-5 flex items-center gap-4 cursor-pointer hover:bg-purple-100 transition-colors"
          >
            <span className="text-5xl opacity-40 select-none">👑</span>
            <div>
              <p className="font-semibold text-purple-700">No Best TL yet</p>
              <p className="text-sm text-purple-500 mt-0.5">
                Click to calculate for <span className="font-bold">{selectedLabel}</span>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Recalculate button */}
      <div className="flex justify-end">
        <button
          onClick={handleCalcRankings}
          disabled={calcLoading || !selMonth}
          className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-60 text-white text-sm font-semibold px-5 py-2 rounded-xl transition-colors shadow-sm"
        >
          {calcLoading
            ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : <Star size={15} />
          }
          {calcLoading ? 'Calculating…' : `Recalculate ${selectedLabel} Rankings`}
        </button>
      </div>

      {/* ── Multi-Month Best Performers (3 months & 6 months) ────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
          <Trophy size={18} className="text-amber-500" />
          <h2 className="font-bold text-gray-700">Best Performers by Period</h2>
          <span className="text-xs text-gray-400 ml-1">— highest cumulative points</span>
        </div>

        {multiLoading ? (
          <div className="h-40 flex items-center justify-center">
            <div className="w-7 h-7 border-4 border-indigo-300 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="p-5 space-y-5">
            {[3, 6].map(n => {
              const data = multiWinners[n];
              const emp  = data?.bestEmployee;
              const tl   = data?.bestTL;
              return (
                <div key={n}>
                  {/* Period label */}
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">
                    Last {n} Months &nbsp;
                    <span className="text-gray-300 font-normal normal-case tracking-normal">
                      ({data?.rangeFrom} → {data?.rangeTo})
                    </span>
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Best Employee */}
                    {emp ? (
                      <div className="flex items-center gap-4 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl p-4">
                        <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-2xl shrink-0">
                          🏅
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-0.5">
                            ⭐ Best Employee — {n}M
                          </p>
                          <p className="font-black text-gray-800 text-lg truncate">{emp.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {emp.department} &nbsp;·&nbsp;
                            <span className="font-bold text-amber-600">{emp.totalPoints} pts total</span>
                            &nbsp;across {emp.monthsWithData} month{emp.monthsWithData !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-4">
                        <span className="text-3xl opacity-30">🏅</span>
                        <p className="text-sm text-gray-400">No employee data for last {n} months</p>
                      </div>
                    )}

                    {/* Best TL */}
                    {tl ? (
                      <div className="flex items-center gap-4 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl p-4">
                        <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-2xl shrink-0">
                          👑
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-0.5">
                            🏆 Best TL — {n}M
                          </p>
                          <p className="font-black text-gray-800 text-lg truncate">{tl.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {tl.department} &nbsp;·&nbsp;
                            <span className="font-bold text-purple-600">{tl.totalPoints} pts total</span>
                            &nbsp;across {tl.monthsWithData} month{tl.monthsWithData !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-4">
                        <span className="text-3xl opacity-30">👑</span>
                        <p className="text-sm text-gray-400">No TL data for last {n} months</p>
                      </div>
                    )}
                  </div>

                  {/* Top 5 mini-leaderboard for this period */}
                  {(data?.topEmployees?.length > 0 || data?.topTLs?.length > 0) && (
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Top 5 employees */}
                      {data.topEmployees?.length > 0 && (
                        <div className="bg-gray-50 rounded-xl p-3">
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                            Top Employees ({n}M)
                          </p>
                          <div className="space-y-1.5">
                            {data.topEmployees.map((e, i) => {
                              const medals = ['🥇','🥈','🥉'];
                              return (
                                <div key={e.employeeId} className="flex items-center gap-2">
                                  <span className="text-sm w-5 text-center">
                                    {medals[i] ?? <span className="text-gray-400 text-xs">#{i+1}</span>}
                                  </span>
                                  <Avatar name={e.name || '?'} size="xs" />
                                  <span className="text-sm text-gray-700 flex-1 truncate">{e.name}</span>
                                  <span className="text-sm font-bold text-amber-600">{e.totalPoints}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Top 5 TLs */}
                      {data.topTLs?.length > 0 && (
                        <div className="bg-gray-50 rounded-xl p-3">
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                            Top TLs ({n}M)
                          </p>
                          <div className="space-y-1.5">
                            {data.topTLs.map((t, i) => {
                              const medals = ['🥇','🥈','🥉'];
                              return (
                                <div key={t.employeeId} className="flex items-center gap-2">
                                  <span className="text-sm w-5 text-center">
                                    {medals[i] ?? <span className="text-gray-400 text-xs">#{i+1}</span>}
                                  </span>
                                  <Avatar name={t.name || '?'} size="xs" />
                                  <span className="text-sm text-gray-700 flex-1 truncate">{t.name}</span>
                                  <span className="text-sm font-bold text-purple-600">{t.totalPoints}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Divider between 3M and 6M */}
                  {n === 3 && <div className="border-t border-gray-100 mt-5" />}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Performance Analysis (cumulative range) ─────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2 flex-wrap">
            <TrendingUp size={18} className="text-indigo-500" />
            <h2 className="font-bold text-gray-700">Performance Analysis</h2>
            <span className="text-xs text-gray-400">— cumulative points over selected range</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {RANGE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setRange(opt.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  range === opt.value
                    ? 'bg-indigo-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {cumulLoading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Summary strip */}
            {cumulData && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-gray-100 border-b border-gray-100">
                {[
                  { label: 'Date Range',      value: `${cumulData.rangeFrom} → ${cumulData.rangeTo}` },
                  { label: 'Total Employees', value: cumulData.count },
                  { label: 'Highest Score',   value: `${cumulData.data?.[0]?.totalPoints ?? 0} pts` },
                  { label: 'Top Performer',   value: cumulData.data?.[0]?.name ?? '—' },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-white px-5 py-4">
                    <p className="text-xs text-gray-400 font-medium">{label}</p>
                    <p className="text-sm font-bold text-gray-700 truncate">{value}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Bar chart */}
            {chartData.length > 0 ? (
              <div className="px-6 pt-5 pb-2">
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-4">
                  Top 10 — Total Points ({range === 1 ? 'This month' : `Last ${range} months`})
                </p>
                <ResponsiveContainer width="100%" height={230}>
                  <BarChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      formatter={(v) => [`${v} pts`, 'Total Points']}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.1)', fontSize: '12px' }}
                    />
                    <Bar dataKey="pts" radius={[6, 6, 0, 0]} maxBarSize={42}>
                      {chartData.map((_, i) => (
                        <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-40 flex items-center justify-center text-gray-300 text-sm">
                No data for this range yet
              </div>
            )}

            {/* Ranked table */}
            {tableData.length > 0 && (
              <div className="overflow-x-auto mt-2">
                <table className="w-full text-sm min-w-[360px]">
                  <thead>
                    <tr className="bg-gray-50 text-left">
                      <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider w-12">Rank</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Employee</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden sm:table-cell">Role</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">Department</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Pts</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right hidden sm:table-cell">Avg/Mo</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right hidden md:table-cell">Months</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {tableData.map((emp, idx) => {
                      const medals = ['🥇','🥈','🥉'];
                      const empId  = emp.employeeId?.toString?.() ?? emp.employeeId;
                      const isMonthStar = starPerformer &&
                        (starPerformer.employeeId?._id?.toString() === empId ||
                         starPerformer.employeeId?.toString() === empId);
                      const isMonthTL   = bestTL &&
                        (bestTL.employeeId?._id?.toString() === empId ||
                         bestTL.employeeId?.toString() === empId);

                      return (
                        <tr
                          key={emp.employeeId}
                          className={`transition-colors ${
                            isMonthStar ? 'bg-amber-50 hover:bg-amber-100'
                          : isMonthTL   ? 'bg-purple-50 hover:bg-purple-100'
                          : 'hover:bg-gray-50'}`}
                        >
                          <td className="px-4 py-3 text-center text-base">
                            {medals[idx] ?? <span className="text-gray-400 font-semibold text-sm">#{idx+1}</span>}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Avatar name={emp.name || '?'} size="sm" />
                              <div className="min-w-0">
                                <p className="font-semibold text-gray-800 text-sm truncate">{emp.name || 'Unknown'}</p>
                                <div className="flex gap-1 flex-wrap mt-0.5">
                                  {isMonthStar && (
                                    <span className="text-xs bg-amber-200 text-amber-800 font-bold px-1.5 py-0.5 rounded-full">⭐ Star</span>
                                  )}
                                  {isMonthTL && (
                                    <span className="text-xs bg-purple-200 text-purple-800 font-bold px-1.5 py-0.5 rounded-full">👑 Best TL</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 hidden sm:table-cell">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                              emp.role === 'TL' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
                            }`}>{emp.role}</span>
                          </td>
                          <td className="px-4 py-3 text-gray-500 text-xs hidden md:table-cell">{emp.department}</td>
                          <td className="px-4 py-3 text-right font-black text-indigo-600">{emp.totalPoints}</td>
                          <td className="px-4 py-3 text-right text-gray-500 text-sm hidden sm:table-cell">{emp.avgPoints}</td>
                          <td className="px-4 py-3 text-right text-gray-400 text-sm hidden md:table-cell">{emp.monthsWithData}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MonthlyHistory;
