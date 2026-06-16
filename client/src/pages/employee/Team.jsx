import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTeamMembers, assignPoints } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../../components/Avatar';
import TierBadge from '../../components/TierBadge';
import { Award, Users } from 'lucide-react';

const Team = () => {
  const navigate = useNavigate();
  const { user, isTL } = useAuth();
  const [teammates, setTeammates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPointsModal, setShowPointsModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [pointsData, setPointsData] = useState({ points: '', note: '' });
  const canAssignPoints = isTL; // Team Leads can assign points to their team

  useEffect(() => {
    fetchTeammates();
  }, []);

  const fetchTeammates = async () => {
    try {
      if (isTL) {
        // For Team Leads: fetch all employees under their leadership
        const response = await getTeamMembers();
        setTeammates(response.data);
      } else {
        // For Employees: fetch teammates (same team lead)
        const response = await getTeamMembers();
        setTeammates(response.data);
      }
    } catch (error) {
      console.error('Error fetching teammates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignPoints = async (e) => {
    e.preventDefault();
    try {
      const pointsToAssign = {
        points: parseInt(pointsData.points, 10),
        note: pointsData.note
      };
      
      await assignPoints(selectedEmployee._id, pointsToAssign);
      setShowPointsModal(false);
      setPointsData({ points: '', note: '' });
      fetchTeammates();
      alert('Points assigned successfully!');
    } catch (error) {
      console.error('Error assigning points:', error);
      alert(error.response?.data?.message || 'Failed to assign points');
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">👥 {isTL ? 'My Team Members' : 'My Team'}</h1>
        {isTL && (
          <p className="text-gray-600 mt-2">View and manage your team members. Assign points to recognize their work.</p>
        )}
      </div>

      {teammates.length === 0 ? (
        <div className="bg-white p-12 rounded-lg border border-gray-200 text-center">
          <Users size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 text-lg mb-2">
            {isTL ? 'No team members assigned yet' : 'No teammates found'}
          </p>
          {isTL && (
            <div className="mt-4 text-sm text-gray-600 bg-blue-50 p-4 rounded-lg max-w-2xl mx-auto">
              <p className="font-semibold mb-2">To add team members:</p>
              <ol className="text-left list-decimal list-inside space-y-1">
                <li>Ask an Admin to edit employees and assign them to you</li>
                <li>Or create new employees (they'll be automatically assigned to your team)</li>
              </ol>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teammates.map((teammate) => (
            <div 
              key={teammate._id}
              className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow"
            >
              <div className="flex flex-col items-center text-center">
                <Avatar name={teammate.name} size="lg" />
                <h3 className="text-lg font-semibold mt-4">{teammate.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{teammate.email}</p>
                <p className="text-sm text-gray-600 mt-1">{teammate.department}</p>
                
                <div className="mt-4">
                  <TierBadge tier={teammate.tier} />
                </div>

                <div className="flex items-center gap-2 mt-4 text-amber-600">
                  <Award size={20} />
                  <span className="font-bold text-lg">{teammate.points}</span>
                  <span className="text-sm text-gray-500">points</span>
                </div>

                <div className="mt-4 flex gap-2 w-full">
                  <button
                    onClick={() => navigate(`/profile/${teammate._id}`)}
                    className="flex-1 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm"
                  >
                    View Profile
                  </button>
                  {canAssignPoints && (
                    <button
                      onClick={() => {
                        setSelectedEmployee(teammate);
                        setShowPointsModal(true);
                      }}
                      className="px-4 py-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition-colors"
                      title="Assign Points"
                    >
                      <Award size={18} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Assign Points Modal */}
      {showPointsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Assign Points</h2>
            <p className="text-gray-600 mb-4">Employee: {selectedEmployee?.name}</p>
            
            <form onSubmit={handleAssignPoints}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Points
                </label>
                <input
                  type="number"
                  value={pointsData.points}
                  onChange={(e) => setPointsData({ ...pointsData, points: e.target.value })}
                  required
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Note (optional)
                </label>
                <textarea
                  value={pointsData.note}
                  onChange={(e) => setPointsData({ ...pointsData, note: e.target.value })}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowPointsModal(false);
                    setPointsData({ points: '', note: '' });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                >
                  Assign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Team;
