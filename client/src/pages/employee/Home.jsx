import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getGreeting, getCurrentDate, getNextTierInfo, getTierBadge } from '../../utils/helpers';
import { getQuoteOfTheDay } from '../../utils/quotes';
import { getLeaderboard, getPointHistory, getBestPerformers } from '../../utils/api';
import { Trophy, Award, TrendingUp, Clock, ChevronRight, X, Sparkles } from 'lucide-react';
import TierBadge from '../../components/TierBadge';
import Avatar from '../../components/Avatar';

const categoryIcon = (cat) => {
  const map = { General: '⭐', Performance: '🚀', Teamwork: '🤝', Innovation: '💡', Leadership: '👑', Punctuality: '⏰', 'Extra Mile': '🔥' };
  return map[cat] || '⭐';
};

const categoryColor = (cat) => {
  const map = {
    General: 'bg-gray-100 text-gray-600',
    Performance: 'bg-blue-100 text-blue-700',
    Teamwork: 'bg-green-100 text-green-700',
    Innovation: 'bg-yellow-100 text-yellow-700',
    Leadership: 'bg-purple-100 text-purple-700',
    Punctuality: 'bg-teal-100 text-teal-700',
    'Extra Mile': 'bg-orange-100 text-orange-700',
  };
  return map[cat] || 'bg-gray-100 text-gray-600';
};

// Confetti particle component
const Confetti = () => {
  const pieces = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 1.5}s`,
    duration: `${1.5 + Math.random() * 2}s`,
    color: ['#fbbf24','#a855f7','#6366f1','#ec4899','#10b981','#f97316'][i % 6],
    size: `${6 + Math.random() * 8}px`,
  }));
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {pieces.map(p => (
        <div
          key={p.id}
          className="absolute rounded-sm animate-bounce"
          style={{
            left: p.left,
            top: '-10px',
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            animationDelay: p.delay,
            animationDuration: p.duration,
          }}
        />
      ))}
    </div>
  );
};

// Congratulations Modal
const CongratsModal = ({ type, name, onClose }) => {
  const isBestTL = type === 'bestTL';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className={`relative w-full max-w-md rounded-3xl shadow-2xl overflow-hidden
        ${isBestTL
          ? 'bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-700'
          : 'bg-gradient-to-br from-amber-400 via-yellow-400 to-orange-400'}`}>

        <Confetti />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
        >
          <X size={16} className="text-white" />
        </button>

        <div className="relative z-10 flex flex-col items-center text-center px-8 py-10">
          {/* Trophy icon */}
          <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-5 shadow-xl
            ${isBestTL ? 'bg-purple-500/40' : 'bg-amber-500/40'}`}>
            <span className="text-6xl">{isBestTL ? '👑' : '🏅'}</span>
          </div>

          <p className={`text-xs font-black uppercase tracking-widest mb-2
            ${isBestTL ? 'text-purple-200' : 'text-amber-800'}`}>
            🎉 Congratulations, {name?.split(' ')[0]}!
          </p>

          <h2 className="text-3xl font-black text-white leading-tight mb-3">
            {isBestTL ? 'Best Team Lead' : 'Best Employee'}
            <br />of the Month!
          </h2>

          <p className={`text-sm leading-relaxed mb-8
            ${isBestTL ? 'text-purple-200' : 'text-amber-900'}`}>
            {isBestTL
              ? 'Your outstanding leadership and team performance have been recognized. Keep inspiring your team!'
              : 'Your hard work and dedication have been recognized by your team lead. Keep up the amazing work!'}
          </p>

          <button
            onClick={onClose}
            className={`px-8 py-3 rounded-2xl font-bold text-sm transition-all active:scale-95
              ${isBestTL
                ? 'bg-white text-purple-700 hover:bg-purple-50 shadow-lg'
                : 'bg-white text-amber-700 hover:bg-amber-50 shadow-lg'}`}>
            Thanks! 🙌
          </button>
        </div>

        {/* Decorative circles */}
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full" />
        <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full" />
      </div>
    </div>
  );
};

const Home = () => {
  const { user } = useAuth();
  const [rank, setRank] = useState(null);
  const [pointHistory, setPointHistory] = useState([]);
  const [bestPerformers, setBestPerformers] = useState({ bestEmployee: null, bestTL: null });
  const [leaderboardTop3, setLeaderboardTop3] = useState([]);
  const [loading, setLoading] = useState(true);
  const [congratsModal, setCongratsModal] = useState(null); // { type: 'bestEmployee' | 'bestTL', name }

  useEffect(() => {
    fetchAll();
  }, [user._id]);

  const fetchAll = async () => {
    try {
      const [lbRes, histRes, bestRes] = await Promise.all([
        getLeaderboard(),
        getPointHistory(user._id),
        getBestPerformers()
      ]);

      const idx = lbRes.data.findIndex(u => u._id === user._id);
      setRank(idx >= 0 ? idx + 1 : null);
      setLeaderboardTop3(lbRes.data.slice(0, 3));
      setPointHistory(histRes.data || []);
      setBestPerformers(bestRes.data);

      // Show congratulations modal on every fresh login (no storage — pure state)
      const { bestEmployee, bestTL } = bestRes.data;
      if (bestEmployee && bestEmployee._id === user._id) {
        setCongratsModal({ type: 'bestEmployee', name: user.name });
      } else if (bestTL && bestTL._id === user._id) {
        setCongratsModal({ type: 'bestTL', name: user.name });
      }
    } catch (err) {
      console.error('Home fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const quote = getQuoteOfTheDay();
  const greeting = getGreeting();
  const currentDate = getCurrentDate();
  const tierInfo = getNextTierInfo(user?.points || 0);
  const totalPointsEarned = pointHistory.reduce((s, h) => s + h.points, 0);
  const isTopPerformer = rank === 1;
  // Drive award banners from fresh API data, not stale AuthContext user object
  const isBestEmployee = bestPerformers.bestEmployee?._id === user?._id;
  const isBestTL = bestPerformers.bestTL?._id === user?._id;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      {/* Congratulations modal — shown once per session when user wins best award */}
      {congratsModal && (
        <CongratsModal
          type={congratsModal.type}
          name={congratsModal.name}
          onClose={() => setCongratsModal(null)}
        />
      )}

      {/* Top greeting row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            {greeting}, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-gray-500 mt-1 text-sm">{currentDate}</p>
        </div>
        <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
          <Avatar name={user?.name} size="sm" />
          <div>
            <p className="font-bold text-gray-800 text-sm">{user?.name}</p>
            <p className="text-xs text-gray-500">{user?.department}</p>
          </div>
          <div className="ml-2">
            <TierBadge tier={user?.tier} />
          </div>
        </div>
      </div>

      {/* Best performer banner — Employee */}
      {isBestEmployee && (
        <div className="bg-gradient-to-r from-amber-400 to-yellow-300 rounded-2xl p-5 flex items-center gap-4 shadow-md">
          <span className="text-5xl">🏅</span>
          <div>
            <p className="text-amber-900 font-black text-xl">You're the Best Employee of the Month!</p>
            <p className="text-amber-800 text-sm mt-0.5">Outstanding performance recognized by your team lead.</p>
          </div>
        </div>
      )}

      {/* Congratulation banner — Best TL */}
      {isBestTL && (
        <div className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-indigo-500 to-purple-500 rounded-2xl p-6 shadow-xl">
          {/* decorative blobs */}
          <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/10 rounded-full" />
          <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-white/10 rounded-full" />
          <div className="relative z-10 flex items-center gap-5">
            <span className="text-6xl drop-shadow-lg">👑</span>
            <div>
              <p className="text-purple-200 text-xs font-bold uppercase tracking-widest mb-1">🎉 Congratulations!</p>
              <p className="text-white font-black text-2xl leading-tight">
                You're the Best Team Lead of the Month!
              </p>
              <p className="text-purple-200 text-sm mt-2">
                Your team's performance has been recognized as the best this month. Keep leading with excellence!
              </p>
            </div>
          </div>
          {/* Confetti dots */}
          <div className="absolute top-3 right-16 w-2 h-2 bg-yellow-300 rounded-full opacity-80" />
          <div className="absolute top-8 right-24 w-1.5 h-1.5 bg-pink-300 rounded-full opacity-70" />
          <div className="absolute bottom-4 right-12 w-2 h-2 bg-teal-300 rounded-full opacity-80" />
          <div className="absolute top-5 right-36 w-1 h-1 bg-white rounded-full opacity-60" />
        </div>
      )}

      {/* Quote */}
      <div className="bg-gradient-to-r from-primary to-secondary rounded-2xl p-6 shadow-lg">
        <p className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-2">💭 Thought of the Day</p>
        <p className="text-white text-lg font-medium italic leading-relaxed">"{quote}"</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Points */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center mb-3">
            <Award className="text-amber-600" size={20} />
          </div>
          <p className="text-3xl font-black text-amber-600">{user?.points || 0}</p>
          <p className="text-sm text-gray-500 mt-1">Total Points</p>
        </div>

        {/* Rank */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center mb-3">
            <Trophy className="text-purple-600" size={20} />
          </div>
          <p className="text-3xl font-black text-purple-600">{rank ? `#${rank}` : '—'}</p>
          <p className="text-sm text-gray-500 mt-1">Your Rank</p>
        </div>

        {/* Awards received */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center mb-3">
            <TrendingUp className="text-pink-600" size={20} />
          </div>
          <p className="text-3xl font-black text-pink-600">{pointHistory.length}</p>
          <p className="text-sm text-gray-500 mt-1">Awards Received</p>
        </div>
      </div>

      {/* Tier progress + Top 3 row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Tier Progress */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Tier Progress</p>
              <p className="text-lg font-bold text-gray-800 mt-1 flex items-center gap-2">
                {getTierBadge(user?.tier)} {user?.tier}
              </p>
            </div>
            <TierBadge tier={user?.tier} />
          </div>
          {tierInfo.nextTier !== 'Max' ? (
            <>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500">Next: <span className="font-semibold text-gray-700">{tierInfo.nextTier}</span></span>
                <span className="font-bold text-primary">{tierInfo.pointsNeeded} pts needed</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
                <div
                  className="h-4 rounded-full bg-gradient-to-r from-primary to-secondary transition-all duration-700"
                  style={{ width: `${Math.min(tierInfo.progress, 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-2">{Math.round(tierInfo.progress)}% to {tierInfo.nextTier}</p>
            </>
          ) : (
            <div className="flex items-center gap-2 mt-2 text-amber-600 font-semibold">
              <Trophy size={20} /> Maximum tier achieved! 🎉
            </div>
          )}
        </div>

        {/* Top 3 Leaderboard mini */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-4">🏆 Top Performers</p>
          {loading ? (
            <div className="text-gray-400 text-sm">Loading...</div>
          ) : (
            <div className="space-y-3">
              {leaderboardTop3.map((emp, i) => {
                const medals = ['🥇', '🥈', '🥉'];
                const isMe = emp._id === user._id;
                return (
                  <div key={emp._id} className={`flex items-center gap-3 p-3 rounded-xl ${isMe ? 'bg-primary/5 border border-primary/20' : 'bg-gray-50'}`}>
                    <span className="text-2xl w-8 text-center">{medals[i]}</span>
                    <Avatar name={emp.name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-800 truncate">
                        {emp.name} {isMe && <span className="text-xs text-primary">(You)</span>}
                      </p>
                      <p className="text-xs text-gray-400">{emp.department}</p>
                    </div>
                    <span className="font-black text-amber-600 text-sm">{emp.points} pts</span>
                  </div>
                );
              })}
              {rank && rank > 3 && (
                <div className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-gray-200">
                  <span className="text-lg w-8 text-center font-bold text-gray-400">#{rank}</span>
                  <Avatar name={user.name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-700 truncate">{user.name} <span className="text-xs text-primary">(You)</span></p>
                    <p className="text-xs text-gray-400">{user.department}</p>
                  </div>
                  <span className="font-black text-amber-600 text-sm">{user.points} pts</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Best performers banner */}
      {(bestPerformers.bestEmployee || bestPerformers.bestTL) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bestPerformers.bestEmployee && (
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl p-5 flex items-center gap-4">
              <span className="text-4xl">🏅</span>
              <div>
                <p className="text-xs font-bold text-amber-600 uppercase tracking-wide">Best Employee of the Month</p>
                <p className="text-lg font-bold text-gray-800 mt-1">{bestPerformers.bestEmployee.name}</p>
                <p className="text-sm text-gray-500">{bestPerformers.bestEmployee.department} · {bestPerformers.bestEmployee.points} pts</p>
              </div>
            </div>
          )}
          {bestPerformers.bestTL && (
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl p-5 flex items-center gap-4">
              <span className="text-4xl">👑</span>
              <div>
                <p className="text-xs font-bold text-purple-600 uppercase tracking-wide">Best TL of the Month</p>
                <p className="text-lg font-bold text-gray-800 mt-1">{bestPerformers.bestTL.name}</p>
                <p className="text-sm text-gray-500">{bestPerformers.bestTL.department}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Point History — real data */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Clock className="text-gray-400" size={18} />
            <h3 className="font-bold text-gray-700">My Point History</h3>
          </div>
          <span className="text-xs bg-amber-50 text-amber-600 border border-amber-200 px-3 py-1 rounded-full font-semibold">
            {pointHistory.length} awards · {totalPointsEarned} pts earned
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-gray-400">
            <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin mr-2" />
            Loading...
          </div>
        ) : pointHistory.length === 0 ? (
          <div className="text-center py-14">
            <div className="text-5xl mb-3">🎯</div>
            <p className="font-semibold text-gray-500">No points yet</p>
            <p className="text-sm text-gray-400 mt-1">Complete tasks and get recognized to earn points!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {pointHistory.map((entry) => (
              <div key={entry._id} className="flex items-start gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center text-xl shrink-0 mt-0.5">
                  {categoryIcon(entry.category)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xl font-black ${entry.points < 0 ? 'text-red-500' : 'text-amber-600'}`}>
                      {entry.points > 0 ? '+' : ''}{entry.points} pts
                    </span>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${categoryColor(entry.category)}`}>
                      {entry.category || 'General'}
                    </span>
                  </div>
                  {entry.note ? (
                    <p className="text-sm text-gray-700 mt-1.5 font-medium">
                      📝 "{entry.note}"
                    </p>
                  ) : (
                    <p className="text-xs text-gray-400 mt-1 italic">No reason specified</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1.5">
                    Awarded by <span className="font-semibold text-gray-600">{entry.assignedBy?.name || 'Unknown'}</span>
                    {' · '}
                    {new Date(entry.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric'
                    })}
                  </p>
                </div>
                <span className="text-xs text-gray-300 shrink-0 mt-1">
                  {new Date(entry.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default Home;
