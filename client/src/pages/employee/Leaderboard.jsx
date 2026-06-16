import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getLeaderboard } from '../../utils/api';
import { getNextTierInfo } from '../../utils/helpers';
import Avatar from '../../components/Avatar';
import TierBadge from '../../components/TierBadge';
import { Trophy, TrendingUp } from 'lucide-react';

const Leaderboard = () => {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const response = await getLeaderboard();
      setLeaderboard(response.data);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const nextTierInfo = getNextTierInfo(user?.points || 0);

  const getRankColor = (rank) => {
    if (rank === 1) return 'text-amber-500';
    if (rank === 2) return 'text-gray-400';
    if (rank === 3) return 'text-orange-700';
    return 'text-gray-600';
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  const currentUserRank = leaderboard.findIndex(u => u._id === user._id) + 1;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">🏆 Leaderboard</h1>

      {/* Progress Card */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Your Progress</h3>
            <p className="text-sm text-gray-600">Current Tier: {user?.tier}</p>
          </div>
          <TierBadge tier={user?.tier} />
        </div>
        
        {nextTierInfo.nextTier !== 'Max' && (
          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-600">Points to {nextTierInfo.nextTier}</span>
              <span className="font-semibold text-primary">{nextTierInfo.pointsNeeded} points</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-primary h-3 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(nextTierInfo.progress, 100)}%` }}
              />
            </div>
          </div>
        )}
        {nextTierInfo.nextTier === 'Max' && (
          <div className="flex items-center gap-2 text-amber-600">
            <Trophy size={20} />
            <span className="font-semibold">Maximum Tier Achieved! 🎉</span>
          </div>
        )}
      </div>

      {/* Leaderboard Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Rank</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Employee</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Department</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Tier</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {leaderboard.map((employee) => {
                const isCurrentUser = employee._id === user._id;
                return (
                  <tr 
                    key={employee._id}
                    className={isCurrentUser ? 'bg-blue-50' : 'hover:bg-gray-50'}
                  >
                    <td className="px-6 py-4">
                      <span className={`text-xl font-bold ${getRankColor(employee.rank)}`}>
                        {getRankIcon(employee.rank)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={employee.name} size="sm" />
                        <div>
                          <p className="font-medium text-gray-800">
                            {employee.name}
                            {isCurrentUser && (
                              <span className="ml-2 text-xs bg-blue-600 text-white px-2 py-1 rounded-full">
                                You
                              </span>
                            )}
                          </p>
                          <p className="text-sm text-gray-500">{employee.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{employee.department}</td>
                    <td className="px-6 py-4">
                      <TierBadge tier={employee.tier} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-lg font-bold text-primary">{employee.points}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
