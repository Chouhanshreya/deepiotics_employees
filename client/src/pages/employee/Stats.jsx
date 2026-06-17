import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getUserStats, getPointHistory, getLeaderboard } from '../../utils/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, RadialBarChart, RadialBar, PieChart, Pie, Cell,
  Legend
} from 'recharts';
import { Award, TrendingUp, Trophy } from 'lucide-react';
import TierBadge from '../../components/TierBadge';
import { getNextTierInfo, getTierBadge } from '../../utils/helpers';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const CATEGORY_COLORS = {
  General: '#6366f1',
  Performance: '#3b82f6',
  Teamwork: '#22c55e',
  Innovation: '#eab308',
  Leadership: '#a855f7',
  Punctuality: '#14b8a6',
  'Extra Mile': '#f97316',
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-100 shadow-lg rounded-xl px-4 py-3 text-sm">
        <p className="font-bold text-gray-700 mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }} className="font-semibold">
            {p.name}: {p.value} pts
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const Stats = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [rank, setRank] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [statsRes, histRes, lbRes] = await Promise.all([
        getUserStats(),
        getPointHistory(user._id),
        getLeaderboard()
      ]);
      setStats(statsRes.data);
      setHistory(histRes.data || []);
      const idx = lbRes.data.findIndex(u => u._id === user._id);
      setRank(idx >= 0 ? idx + 1 : null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // --- Data preparation ---

  // Monthly bar chart (last 6 months from API)
  const monthlyBarData = (stats?.monthlyPoints || []).map(item => ({
    month: MONTHS[item._id.month - 1],
    points: item.total
  }));

  // Area chart — cumulative points over history entries
  let cumulative = 0;
  const cumulativeData = [...history].reverse().map((entry, i) => {
    cumulative += entry.points;
    return {
      index: i + 1,
      date: new Date(entry.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      cumulative,
      points: entry.points,
    };
  });

  // Category breakdown pie chart
  const categoryMap = {};
  history.forEach(h => {
    const cat = h.category || 'General';
    categoryMap[cat] = (categoryMap[cat] || 0) + h.points;
  });
  const categoryData = Object.entries(categoryMap).map(([name, value]) => ({ name, value }));

  // Tier progress radial
  const tierInfo = getNextTierInfo(user?.points || 0);
  const radialData = [
    {
      name: 'Progress',
      value: Math.min(tierInfo.progress, 100),
      fill: '#6366f1'
    }
  ];

  const totalPoints = user?.points || 0;
  const awardsCount = history.length;
  const thisMonthPoints = stats?.monthlyPoints?.find(m => {
    const now = new Date();
    return m._id.month === now.getMonth() + 1 && m._id.year === now.getFullYear();
  })?.total || 0;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800">📊 My Stats</h1>
        <p className="text-gray-500 text-sm mt-1">Your performance overview and point analytics</p>
      </div>

      {/* Top stat cards — only real data, no tasks/streak */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center mb-3">
            <Award className="text-amber-600" size={20} />
          </div>
          <p className="text-3xl font-black text-amber-600">{totalPoints}</p>
          <p className="text-xs text-gray-500 mt-1 font-medium">Total Points</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center mb-3">
            <Trophy className="text-purple-600" size={20} />
          </div>
          <p className="text-3xl font-black text-purple-600">{rank ? `#${rank}` : '—'}</p>
          <p className="text-xs text-gray-500 mt-1 font-medium">Leaderboard Rank</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center mb-3">
            <TrendingUp className="text-blue-600" size={20} />
          </div>
          <p className="text-3xl font-black text-blue-600">{thisMonthPoints}</p>
          <p className="text-xs text-gray-500 mt-1 font-medium">This Month</p>
        </div>
      </div>

      {/* Row 1: Monthly Bar + Tier Radial */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Monthly Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-700 mb-1">Monthly Points</h3>
          <p className="text-xs text-gray-400 mb-5">Points earned per month (last 6 months)</p>
          {monthlyBarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyBarData} barSize={36}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="points" name="Points" radius={[8, 8, 0, 0]}
                  fill="url(#barGradient)" />
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#a855f7" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-52 flex flex-col items-center justify-center text-gray-300">
              <Award size={40} className="mb-2" />
              <p className="text-sm">No monthly data yet</p>
            </div>
          )}
        </div>

        {/* Tier Radial */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col items-center justify-center">
          <h3 className="font-bold text-gray-700 mb-1 self-start">Tier Progress</h3>
          <p className="text-xs text-gray-400 mb-4 self-start">How close to next tier</p>
          <div className="relative">
            <ResponsiveContainer width={180} height={180}>
              <RadialBarChart
                cx="50%" cy="50%"
                innerRadius="65%" outerRadius="90%"
                startAngle={225} endAngle={-45}
                data={[{ value: 100, fill: '#f3f4f6' }, { value: Math.min(tierInfo.progress, 100), fill: 'url(#radialGradient)' }]}
              >
                <defs>
                  <linearGradient id="radialGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#a855f7" />
                  </linearGradient>
                </defs>
                <RadialBar dataKey="value" cornerRadius={10} background={false} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-2xl font-black text-primary">{Math.round(tierInfo.progress)}%</p>
              <p className="text-xs text-gray-400 mt-0.5">{getTierBadge(user?.tier)} {user?.tier}</p>
            </div>
          </div>
          {tierInfo.nextTier !== 'Max' ? (
            <p className="text-xs text-gray-500 mt-3 text-center">
              <span className="font-bold text-primary">{tierInfo.pointsNeeded} pts</span> to reach <span className="font-bold">{tierInfo.nextTier}</span>
            </p>
          ) : (
            <p className="text-xs font-bold text-amber-500 mt-3">🏆 Max Tier Achieved!</p>
          )}
          <div className="mt-3">
            <TierBadge tier={user?.tier} />
          </div>
        </div>
      </div>

      {/* Row 2: Cumulative Area Chart */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-bold text-gray-700 mb-1">Points Growth</h3>
        <p className="text-xs text-gray-400 mb-5">Cumulative points over time as awards were received</p>
        {cumulativeData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={cumulativeData}>
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip content={({ active, payload, label }) => active && payload?.length ? (
                <div className="bg-white border border-gray-100 shadow-lg rounded-xl px-4 py-3 text-sm">
                  <p className="font-bold text-gray-600">{label}</p>
                  <p className="text-primary font-black">Total: {payload[0]?.value} pts</p>
                  <p className="text-gray-500">+{payload[1]?.value} this award</p>
                </div>
              ) : null} />
              <Area type="monotone" dataKey="cumulative" name="Total" stroke="#6366f1" strokeWidth={3} fill="url(#areaGradient)" dot={false} />
              <Bar dataKey="points" name="Award" fill="#a855f750" radius={[4,4,0,0]} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-52 flex flex-col items-center justify-center text-gray-300">
            <TrendingUp size={40} className="mb-2" />
            <p className="text-sm">No awards yet</p>
          </div>
        )}
      </div>

      {/* Row 3: Category Pie Chart */}
      {categoryData.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-700 mb-1">Points by Category</h3>
          <p className="text-xs text-gray-400 mb-5">Breakdown of how your points were earned</p>
          <div className="flex flex-col lg:flex-row items-center gap-8">
            <ResponsiveContainer width={260} height={260}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%" cy="50%"
                  innerRadius={65}
                  outerRadius={110}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={index} fill={CATEGORY_COLORS[entry.name] || '#6366f1'} />
                  ))}
                </Pie>
                <Tooltip formatter={(v, n) => [`${v} pts`, n]} />
              </PieChart>
            </ResponsiveContainer>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 flex-1">
              {categoryData.map((entry, i) => (
                <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-2.5 min-w-[140px]">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ background: CATEGORY_COLORS[entry.name] || '#6366f1' }} />
                  <div>
                    <p className="text-xs font-semibold text-gray-700">{entry.name}</p>
                    <p className="text-sm font-black" style={{ color: CATEGORY_COLORS[entry.name] || '#6366f1' }}>{entry.value} pts</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Stats;
