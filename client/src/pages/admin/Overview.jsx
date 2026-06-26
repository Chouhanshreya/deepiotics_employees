import { useState, useEffect } from 'react';
import { getOverview, getBestPerformers, getLiveRankings } from '../../utils/api';
import Avatar from '../../components/Avatar';
import TierBadge from '../../components/TierBadge';
import { Users, Award, Trophy, TrendingUp, Star, Clock, Layers, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

const DEPT_COLORS = ['#6366f1','#8b5cf6','#ec4899','#f97316','#14b8a6','#3b82f6','#22c55e'];

const categoryIcon = (cat) => {
  const map = { General:'⭐', Performance:'🚀', Teamwork:'🤝', Innovation:'💡', Leadership:'👑', Punctuality:'⏰', 'Extra Mile':'🔥' };
  return map[cat] || '⭐';
};

const Overview = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [overview, setOverview] = useState(null);
  const [bestPerformers, setBestPerformers] = useState({ bestEmployee: null, bestTL: null });
  const [liveRankings, setLiveRankings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [ovRes, bestRes, liveRes] = await Promise.all([
        getOverview(),
        getBestPerformers(),
        getLiveRankings()
      ]);
      setOverview(ovRes.data);
      setBestPerformers(bestRes.data);
      setLiveRankings(liveRes.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to load dashboard data');
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

  if (error || !overview) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-gray-500 text-sm">{error || 'Could not load dashboard.'}</p>
        <button
          onClick={() => { setLoading(true); setError(null); fetchAll(); }}
          className="text-primary text-sm font-semibold hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  const now = new Date();
  const timeStr = now.toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' });

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 w-full">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-800">Good {now.getHours() < 12 ? 'Morning' : now.getHours() < 18 ? 'Afternoon' : 'Evening'}, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="text-gray-400 text-sm mt-1">{timeStr} · Admin Dashboard</p>
        </div>
        <button
          onClick={() => navigate('/point-management')}
          className="flex items-center gap-2 bg-primary text-white px-4 sm:px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors shadow-sm self-start sm:self-auto"
        >
          <Award size={16} /> Assign Points <ArrowRight size={14} />
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {[
          { icon: Users, label: 'Employees', value: overview.totalEmployees, bg: 'bg-blue-50', iconBg: 'bg-blue-100', color: 'text-blue-600' },
          { icon: Star, label: 'Team Leads', value: overview.totalTLs, bg: 'bg-purple-50', iconBg: 'bg-purple-100', color: 'text-purple-600' },
          { icon: Award, label: 'Total Points', value: overview.totalPoints.toLocaleString(), bg: 'bg-amber-50', iconBg: 'bg-amber-100', color: 'text-amber-600' },
          { icon: TrendingUp, label: 'This Month', value: overview.pointsThisMonth.toLocaleString(), bg: 'bg-green-50', iconBg: 'bg-green-100', color: 'text-green-600' },
          { icon: Layers, label: 'Transactions', value: overview.totalTransactions, bg: 'bg-pink-50', iconBg: 'bg-pink-100', color: 'text-pink-600' },
        ].map(({ icon: Icon, label, value, bg, iconBg, color }) => (
          <div key={label} className={`${bg} rounded-2xl p-5 border border-white shadow-sm`}>
            <div className={`${iconBg} w-10 h-10 rounded-xl flex items-center justify-center mb-3`}>
              <Icon size={20} className={color} />
            </div>
            <p className={`text-2xl font-black ${color}`}>{value}</p>
            <p className="text-xs text-gray-500 mt-1 font-medium">{label}</p>
          </div>
        ))}
      </div>

      {/* Best Performers — live from current month's highest points */}
      {(liveRankings?.starPerformer || liveRankings?.bestTL) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {liveRankings.starPerformer && (
            <div className="bg-gradient-to-r from-amber-400 to-yellow-300 rounded-2xl p-5 flex items-center gap-4 shadow-md">
              <span className="text-5xl">🏅</span>
              <div className="flex-1">
                <p className="text-xs font-black text-amber-800 uppercase tracking-widest mb-1">⭐ This Month's Star Performer</p>
                <p className="text-xl font-black text-white">{liveRankings.starPerformer.name}</p>
                <p className="text-amber-100 text-sm">{liveRankings.starPerformer.department} · {liveRankings.starPerformer.monthPoints} pts this month</p>
              </div>
            </div>
          )}
          {liveRankings.bestTL && (
            <div className="bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl p-5 flex items-center gap-4 shadow-md">
              <span className="text-5xl">👑</span>
              <div className="flex-1">
                <p className="text-xs font-black text-purple-200 uppercase tracking-widest mb-1">🏆 This Month's Best TL</p>
                <p className="text-xl font-black text-white">{liveRankings.bestTL.name}</p>
                <p className="text-purple-200 text-sm">{liveRankings.bestTL.department} · {liveRankings.bestTL.monthPoints} pts this month</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Top Performers + Department Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Top 5 */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Trophy size={18} className="text-amber-500" />
              <h3 className="font-bold text-gray-700">Top Performers</h3>
            </div>
            <button onClick={() => navigate('/employees')} className="text-xs text-primary font-semibold hover:underline flex items-center gap-1">
              View all <ArrowRight size={12} />
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {overview.top5?.map((emp, i) => {
              const medals = ['🥇','🥈','🥉'];
              return (
                <div key={emp._id} className="flex items-center gap-4 px-6 py-3 hover:bg-gray-50 transition-colors">
                  <span className="text-xl w-8 text-center">{medals[i] || `#${i+1}`}</span>
                  <Avatar name={emp.name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-800 truncate">{emp.name}</p>
                    <p className="text-xs text-gray-400">{emp.department} · <span className={`font-semibold ${emp.role === 'TL' ? 'text-purple-500' : 'text-blue-500'}`}>{emp.role}</span></p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-amber-600">{emp.points}</p>
                    <p className="text-xs text-gray-400">pts</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Department Points Bar Chart */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <Layers size={18} className="text-indigo-500" />
            <h3 className="font-bold text-gray-700">Points by Department</h3>
          </div>
          {overview.deptAgg?.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={overview.deptAgg} layout="vertical" margin={{ left: 10 }}>
                <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="_id" tick={{ fontSize: 11, fill: '#374151' }} axisLine={false} tickLine={false} width={80} />
                <Tooltip
                  formatter={(v) => [`${v} pts`, 'Points']}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="totalPoints" radius={[0, 8, 8, 0]} barSize={22}>
                  {overview.deptAgg.map((_, i) => (
                    <Cell key={i} fill={DEPT_COLORS[i % DEPT_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-52 flex items-center justify-center text-gray-300">No data yet</div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
          <Clock size={18} className="text-gray-400" />
          <h3 className="font-bold text-gray-700">Recent Point Activity</h3>
          <span className="ml-auto text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">Last 5</span>
        </div>
        <div className="divide-y divide-gray-50">
          {overview.recentPoints?.length === 0 ? (
            <div className="px-6 py-10 text-center text-gray-400 text-sm">No activity yet</div>
          ) : (
            overview.recentPoints?.map(entry => (
              <div key={entry._id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-xl shrink-0">
                  {categoryIcon(entry.category)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">
                    <span className="text-primary">{entry.assignedBy?.name}</span>
                    {' awarded '}
                    <span className="text-gray-800">{entry.employee?.name}</span>
                  </p>
                  {entry.note && (
                    <p className="text-xs text-gray-400 mt-0.5 truncate">"{entry.note}"</p>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5">{entry.employee?.department}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`font-black text-lg ${entry.points < 0 ? 'text-red-500' : 'text-amber-600'}`}>
                    {entry.points > 0 ? '+' : ''}{entry.points}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(entry.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short' })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
};

export default Overview;
