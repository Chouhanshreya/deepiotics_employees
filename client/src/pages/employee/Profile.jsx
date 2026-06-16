import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getUserById } from '../../utils/api';
import { formatDate } from '../../utils/helpers';
import Avatar from '../../components/Avatar';
import TierBadge from '../../components/TierBadge';
import { Mail, Calendar, Briefcase, Award, Trophy } from 'lucide-react';

const Profile = () => {
  const { user: currentUser } = useAuth();
  const { id } = useParams();
  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      // Viewing another user's profile
      fetchUserProfile(id);
    } else {
      // Viewing own profile
      setProfileUser(currentUser);
      setLoading(false);
    }
  }, [id, currentUser]);

  const fetchUserProfile = async (userId) => {
    try {
      const response = await getUserById(userId);
      setProfileUser(response.data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      alert(error.response?.data?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="p-6 flex justify-center">
        <div className="text-xl text-gray-500">Profile not found</div>
      </div>
    );
  }

  const isOwnProfile = !id || profileUser._id === currentUser?._id;

  const InfoRow = ({ icon: Icon, label, value }) => (
    <div className="flex items-center gap-3 py-3 border-b border-gray-200 last:border-0">
      <Icon size={20} className="text-gray-400" />
      <div className="flex-1">
        <p className="text-sm text-gray-600">{label}</p>
        <p className="font-medium text-gray-800">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">
        {isOwnProfile ? 'My Profile' : `${profileUser.name}'s Profile`}
      </h1>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-secondary p-8 text-white">
          <div className="flex flex-col items-center text-center">
            <Avatar name={profileUser?.name} size="xl" />
            <h2 className="text-2xl font-bold mt-4">{profileUser?.name}</h2>
            <p className="text-blue-100 mt-1">{profileUser?.role}</p>
            <div className="mt-4">
              <TierBadge tier={profileUser?.tier} />
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-8">
          <div className="space-y-1">
            <InfoRow 
              icon={Mail} 
              label="Email" 
              value={profileUser?.email} 
            />
            <InfoRow 
              icon={Briefcase} 
              label="Department" 
              value={profileUser?.department} 
            />
            <InfoRow 
              icon={Calendar} 
              label="Join Date" 
              value={formatDate(profileUser?.joinDate)} 
            />
            <InfoRow 
              icon={Award} 
              label="Total Points" 
              value={profileUser?.points} 
            />
            <InfoRow 
              icon={Trophy} 
              label="Tier" 
              value={profileUser?.tier} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
