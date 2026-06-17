import { useState, useEffect } from 'react';
import { getUserById, getPointHistory } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';
import TierBadge from './TierBadge';
import { X, Briefcase, Calendar, Award, Clock, Mail } from 'lucide-react';
import { formatDate } from '../utils/helpers';

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

const ProfileDrawer = ({ userId, onClose }) => {
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) return;
    setProfile(null);
    setHistory([]);
    setError(null);
    setLoading(true);

    getUserById(userId)
      .then(res => {
        setProfile(res.data);
        // Only load point history if viewer is allowed
        if (!(currentUser?.role === 'Employee' && res.data.role !== 'Employee')) {
          setHistoryLoading(true);
          return getPointHistory(userId);
        }
        return { data: [] };
      })
      .then(res => setHistory(res.data || []))
      .catch(err => {
        setError(err.response?.data?.message || 'Failed to load profile');
      })
      .finally(() => {
        setLoading(false);
        setHistoryLoading(false);
      });
  }, [userId]);

  return (
    /* Full-screen backdrop */
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Modal — stop click propagation so clicking inside doesn't close */}
      <div
        className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <h2 className="font-bold text-gray-800 text-lg">Employee Profile</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-sm">Loading profile...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <span className="text-4xl mb-3">😕</span>
              <p className="text-sm font-medium text-gray-500">{error}</p>
            </div>
          ) : profile && currentUser?.role === 'Employee' && profile.role !== 'Employee' ? (            /* Employee cannot view TL/Admin full profile */
            <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-2xl font-black mb-4 shadow-lg">
                {profile.name?.substring(0, 2).toUpperCase()}
              </div>
              <h3 className="text-xl font-bold text-gray-800">{profile.name}</h3>
              <p className="text-sm text-gray-500 mt-1">{profile.department}</p>
              <span className="mt-3 text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-semibold">
                {profile.role}
              </span>
              <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl px-5 py-3 flex items-center gap-2">
                <span className="text-lg">🔒</span>
                <p className="text-xs text-amber-700 font-medium">
                  Full profile is only visible to Team Leads and Admins
                </p>
              </div>
            </div>
          ) : profile ? (
            <>
              {/* Profile hero */}
              <div className="bg-gradient-to-br from-primary to-secondary px-6 py-10 flex flex-col items-center text-center">
                <Avatar name={profile.name} size="xl" />
                <h3 className="text-3xl font-bold text-white mt-5">{profile.name}</h3>
                <p className="text-blue-100 text-sm mt-1">{profile.email}</p>
                <div className="flex items-center gap-2 mt-3 flex-wrap justify-center">
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-white/20 text-white">
                    {profile.role}
                  </span>
                  {profile.isBestEmployee && (
                    <span className="text-xs bg-amber-400 text-white px-3 py-1 rounded-full font-semibold">🏅 Best Employee</span>
                  )}
                  {profile.isBestTL && (
                    <span className="text-xs bg-purple-300 text-white px-3 py-1 rounded-full font-semibold">👑 Best TL</span>
                  )}
                </div>
                <div className="mt-4">
                  <TierBadge tier={profile.tier} />
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-2 divide-x divide-gray-100 border-b border-gray-100 bg-gray-50">
                <div className="p-5 text-center">
                  <p className={`text-3xl font-black ${profile.points < 0 ? 'text-red-500' : 'text-amber-600'}`}>
                    {profile.points}
                  </p>
                  {profile.points < 0 && (
                    <span className="inline-block mt-1 text-xs bg-red-100 text-red-600 font-bold px-2 py-0.5 rounded-full">In Debt</span>
                  )}
                  <p className="text-xs text-gray-500 mt-1 font-medium">Total Points</p>
                </div>
                <div className="p-5 text-center">
                  <p className="text-3xl font-black text-blue-600">{history.length}</p>
                  <p className="text-xs text-gray-500 mt-1 font-medium">Awards Received</p>
                </div>
              </div>

              {/* Info rows */}
              <div className="px-6 py-4 space-y-3 border-b border-gray-100">
                <div className="flex items-center gap-3 text-sm">
                  <Briefcase size={16} className="text-gray-400 shrink-0" />
                  <span className="text-gray-500 w-24 shrink-0">Department</span>
                  <span className="font-semibold text-gray-800">{profile.department}</span>
                </div>
                {profile.teamLead && (
                  <div className="flex items-center gap-3 text-sm">
                    <Award size={16} className="text-gray-400 shrink-0" />
                    <span className="text-gray-500 w-24 shrink-0">Team Lead</span>
                    <span className="font-semibold text-gray-800">{profile.teamLead.name}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-sm">
                  <Calendar size={16} className="text-gray-400 shrink-0" />
                  <span className="text-gray-500 w-24 shrink-0">Joined</span>
                  <span className="font-semibold text-gray-800">{formatDate(profile.joinDate)}</span>
                </div>
              </div>

              {/* Point history */}
              <div className="px-6 py-5">
                <div className="flex items-center gap-2 mb-5">
                  <Clock size={18} className="text-gray-400" />
                  <h4 className="font-bold text-gray-700 text-base">Point History</h4>
                  <span className="ml-auto text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full font-medium">
                    {history.length} entries · <span className={profile.points < 0 ? 'text-red-500 font-bold' : ''}>{profile.points} pts current</span>
                  </span>
                </div>

                {historyLoading ? (
                  <div className="text-center py-8 text-gray-400 text-sm">Loading history...</div>
                ) : history.length === 0 ? (
                  <div className="text-center py-10">
                    <Award size={40} className="mx-auto text-gray-200 mb-3" />
                    <p className="text-sm text-gray-400">No points assigned yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {history.map((entry) => (
                      <div
                        key={entry._id}
                        className="flex items-start gap-4 bg-gray-50 rounded-xl p-4 border border-gray-100"
                      >
                        <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-xl shrink-0">
                          {categoryIcon(entry.category)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`font-black text-xl ${entry.points < 0 ? 'text-red-500' : 'text-amber-600'}`}>
                                {entry.points > 0 ? '+' : ''}{entry.points} pts
                              </span>
                              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${entry.points < 0 ? 'bg-red-100 text-red-700' : categoryColor(entry.category)}`}>
                                {entry.category || 'General'}
                              </span>
                              {entry.points < 0 && (
                                <span className="text-xs bg-red-50 text-red-500 px-2 py-0.5 rounded-full font-medium border border-red-200">
                                  Deduction
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-gray-400 shrink-0">
                              {new Date(entry.createdAt).toLocaleDateString('en-IN', {
                                day: 'numeric', month: 'short', year: 'numeric'
                              })}
                            </span>
                          </div>
                          {entry.note ? (
                            <p className="text-sm text-gray-700 mt-2 font-medium bg-white rounded-lg px-3 py-2 border border-gray-100">
                              📝 "{entry.note}"
                            </p>
                          ) : (
                            <p className="text-xs text-gray-400 mt-1.5 italic">No reason specified</p>
                          )}
                          <p className="text-xs text-gray-400 mt-2">
                            Awarded by{' '}
                            <span className="font-semibold text-gray-600">
                              {entry.assignedBy?.name || 'Unknown'}
                            </span>
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default ProfileDrawer;
