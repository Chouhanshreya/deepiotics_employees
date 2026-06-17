import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getLeaderboard, getTLLeaderboard, getBestPerformers } from '../../utils/api';
import { getNextTierInfo } from '../../utils/helpers';
import Avatar from '../../components/Avatar';
import TierBadge from '../../components/TierBadge';
import ProfileDrawer from '../../components/ProfileDrawer';
import { Trophy, Star, Users } from 'lucide-react';

const Leaderboard = () => {
  const { user, isTL, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('employees');
  const [employeeLeaderboard, setEmployeeLeaderboard] = useState([]);
  const [tlLeaderboard, setTLLeaderboard] = useState([]);
  const [bestPerformers, setBestPerformers] = useState({ bestEmployee: null, bestTL: null });
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState(null);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [empRes, bestRes] = await Promise.all([
        getLeaderboard(),
        getBestPerformers()
      ]);
      setEmployeeLeaderboard(empRes.data); // includes both Employees and TLs
      setBestPerformers(bestRes.data);

      if (isTL || isAdmin) {
        const tlRes = await getTLLeaderboard();
        setTLLeaderboard(tlRes.data);
      }
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
      <div className="p-6 flex justify-center items-center h-64">
        <div className="text-xl text-gray-500">Loading...</div>
      </div>
    );
  }

  const currentUserRank = employeeLeaderboard.findIndex(u => u._id === user?._id) + 1;
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">🏆 Leaderboard</h1>

      {/* Best Performers Banner */}
      {(bestPerformers.bestEmployee || bestPerformers.bestTL) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {bestPerformers.bestEmployee && (
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg p-5 flex items-center gap-4">
              <div className="text-4xl">🏅</div>
              <div>
                <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide">Best Employee of the Month</p>
                <p className="text-lg font-bold text-gray-800 mt-1">{bestPerformers.bestEmployee.name}</p>
                <p className="text-sm text-gray-600">{bestPerformers.bestEmployee.department} · {bestPerformers.bestEmployee.points} pts</p>
              </div>
            </div>
          )}
          {bestPerformers.bestTL && (
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-5 flex items-center gap-4">
              <div className="text-4xl">👑</div>
              <div>
                <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide">Best TL of the Month</p>
                <p className="text-lg font-bold text-gray-800 mt-1">{bestPerformers.bestTL.name}</p>
                <p className="text-sm text-gray-600">{bestPerformers.bestTL.department}</p>
              </div>
            </div>
          )}        </div>
      )}

      {/* Progress Card — only for employees */}
      {user?.role === 'Employee' && (
        <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Your Progress</h3>
              <p className="text-sm text-gray-600">
                Current Rank: {currentUserRank > 0 ? `#${currentUserRank}` : 'Unranked'} · Tier: {user?.tier}
              </p>
            </div>
            <TierBadge tier={user?.tier} />
          </div>

          {nextTierInfo.nextTier !== 'Max' ? (
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-600">Points to {nextTierInfo.nextTier}</span>
                <span className="font-semibold text-primary">{nextTierInfo.pointsNeeded} points needed</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-primary h-3 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(nextTierInfo.progress, 100)}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-amber-600">
              <Trophy size={20} />
              <span className="font-semibold">Maximum Tier Achieved! 🎉</span>
            </div>
          )}
        </div>
      )}

      {/* Tabs — only for TL/Admin */}
      {(isTL || isAdmin) && (
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('employees')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-colors ${
              activeTab === 'employees'
                ? 'bg-primary text-white'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Users size={16} /> Employee Ranking
          </button>
          <button
            onClick={() => setActiveTab('tls')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-colors ${
              activeTab === 'tls'
                ? 'bg-primary text-white'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Star size={16} /> TL Ranking
          </button>
        </div>
      )}

      {/* Employee Leaderboard */}
      {activeTab === 'employees' && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Rank</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Employee</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Role</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Department</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Tier</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Points</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {employeeLeaderboard.map((employee) => {
                  const isCurrentUser = employee._id === user?._id;
                  return (
                    <tr
                      key={employee._id}
                      onClick={() => setSelectedUserId(employee._id)}
                      className={`cursor-pointer ${isCurrentUser ? 'bg-blue-50' : 'hover:bg-gray-50'} ${employee.isBestEmployee ? 'border-l-4 border-amber-400' : ''}`}
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
                            <p className="font-medium text-gray-800 flex items-center gap-2">
                              {employee.name}
                              {isCurrentUser && (
                                <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">You</span>
                              )}
                              {employee.isBestEmployee && (
                                <span className="text-xs bg-amber-400 text-white px-2 py-0.5 rounded-full">🏅 Best</span>
                              )}
                            </p>
                            <p className="text-sm text-gray-500">{employee.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-700">{employee.department}</td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full
                          ${employee.role === 'TL' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                          {employee.role}
                        </span>
                      </td>                      <td className="px-6 py-4">
                        <TierBadge tier={employee.tier} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`text-lg font-bold ${employee.points < 0 ? 'text-red-500' : 'text-primary'}`}>
                          {employee.points}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-gray-300 text-lg">›</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TL Leaderboard */}
      {activeTab === 'tls' && (isTL || isAdmin) && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Rank</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Team Lead</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Department</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Team Size</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Team Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {tlLeaderboard.map((tl) => {
                  const isCurrentUser = tl._id === user?._id;
                  return (
                    <tr
                      key={tl._id}
                      onClick={() => setSelectedUserId(tl._id)}
                      className={`cursor-pointer ${isCurrentUser ? 'bg-blue-50' : 'hover:bg-gray-50'} ${tl.isBestTL ? 'border-l-4 border-purple-400' : ''}`}
                    >
                      <td className="px-6 py-4">
                        <span className={`text-xl font-bold ${getRankColor(tl.rank)}`}>
                          {getRankIcon(tl.rank)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={tl.name} size="sm" />
                          <div>
                            <p className="font-medium text-gray-800 flex items-center gap-2">
                              {tl.name}
                              {isCurrentUser && (
                                <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">You</span>
                              )}
                              {tl.isBestTL && (
                                <span className="text-xs bg-purple-500 text-white px-2 py-0.5 rounded-full">👑 Best TL</span>
                              )}
                            </p>
                            <p className="text-sm text-gray-500">{tl.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-700">{tl.department}</td>
                      <td className="px-6 py-4 text-center text-gray-700">{tl.teamSize} members</td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-lg font-bold text-primary">{tl.teamPoints}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-gray-300 text-lg">›</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Profile Drawer */}
      {selectedUserId && (
        <ProfileDrawer
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
        />
      )}
    </div>
  );
};

export default Leaderboard;
