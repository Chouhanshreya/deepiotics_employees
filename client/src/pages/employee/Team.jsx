import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTeamMembers } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../../components/Avatar';
import TierBadge from '../../components/TierBadge';
import AssignPointsModal from '../../components/AssignPointsModal';
import { Award, Users, Crown } from 'lucide-react';

const Team = () => {
  const navigate = useNavigate();
  const { user, isTL } = useAuth();
  const [teammates, setTeammates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  useEffect(() => {
    fetchTeammates();
  }, []);

  const fetchTeammates = async () => {
    try {
      const response = await getTeamMembers();
      setTeammates(response.data);
    } catch (error) {
      console.error('Error fetching teammates:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center h-64">
        <div className="text-xl text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          👥 {isTL ? 'My Team Members' : 'My Teammates'}
        </h1>
        {isTL && (
          <p className="text-gray-500 mt-1 text-sm">
            {teammates.length} member{teammates.length !== 1 ? 's' : ''} · Click the award icon to assign points
          </p>
        )}
      </div>

      {/* Team Lead Card — only visible to Employees */}
      {!isTL && user?.teamLead && (
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-5 mb-8 flex items-center gap-5">
          <div className="relative">
            <Avatar name={user.teamLead.name} size="lg" />
            <div className="absolute -top-1 -right-1 bg-purple-500 rounded-full p-1">
              <Crown size={12} className="text-white" />
            </div>
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold text-purple-600 uppercase tracking-wide mb-1">Your Team Lead</p>
            <p className="text-xl font-bold text-gray-800">{user.teamLead.name}</p>
            <p className="text-sm text-gray-500">{user.teamLead.email}</p>
          </div>
          <span className="text-3xl">👑</span>
        </div>
      )}

      {/* No TL assigned message for employees */}
      {!isTL && !user?.teamLead && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-8 flex items-center gap-3 text-sm text-yellow-700">
          <span className="text-xl">⚠️</span>
          No Team Lead assigned to you yet. Ask Admin to assign one.
        </div>
      )}

      {teammates.length === 0 ? (
        <div className="bg-white p-12 rounded-lg border border-gray-200 text-center">
          <Users size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg mb-2">
            {isTL ? 'No team members assigned yet' : 'No teammates found'}
          </p>
          {isTL && (
            <div className="mt-4 text-sm text-gray-600 bg-blue-50 p-4 rounded-lg max-w-sm mx-auto text-left">
              <p className="font-semibold mb-2">To add team members:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Ask Admin to assign employees to you</li>
                <li>Or create new employees — they auto-assign to your team</li>
              </ol>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teammates.map((teammate, index) => (
            <div
              key={teammate._id}
              className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow"
            >
              {/* Rank badge */}
              <div className="flex items-start justify-between mb-4">
                <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                  #{index + 1}
                </span>
                {teammate.isBestEmployee && (
                  <span className="text-xs bg-amber-400 text-white px-2 py-1 rounded-full font-semibold">🏅 Best</span>
                )}
              </div>

              <div className="flex flex-col items-center text-center">
                <Avatar name={teammate.name} size="lg" />
                <h3 className="text-lg font-bold mt-3 text-gray-800">{teammate.name}</h3>
                <p className="text-sm text-gray-400">{teammate.email}</p>
                <p className="text-xs text-gray-500 mt-1">{teammate.department}</p>

                <div className="mt-3">
                  <TierBadge tier={teammate.tier} />
                </div>

                {/* Points display */}
                <div className="mt-4 bg-amber-50 rounded-xl px-6 py-3 w-full">
                  <p className="text-3xl font-black text-amber-600">{teammate.points}</p>
                  <p className="text-xs text-amber-500 font-medium">total points</p>
                </div>

                {/* Actions */}
                <div className="mt-4 flex gap-2 w-full">
                  <button
                    onClick={() => navigate(`/profile/${teammate._id}`)}
                    className="flex-1 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                  >
                    View Profile
                  </button>
                  {isTL && (
                    <button
                      onClick={() => setSelectedEmployee(teammate)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition-colors text-sm font-medium"
                      title="Assign Points"
                    >
                      <Award size={16} /> Points
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Advanced Assign Points Modal */}
      {selectedEmployee && (
        <AssignPointsModal
          employee={selectedEmployee}
          onClose={() => setSelectedEmployee(null)}
          onSuccess={() => {
            fetchTeammates();
            setSelectedEmployee(null);
          }}
        />
      )}
    </div>
  );
};

export default Team;
