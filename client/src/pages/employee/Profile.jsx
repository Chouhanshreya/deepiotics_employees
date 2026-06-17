import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getUserById } from '../../utils/api';
import { formatDate } from '../../utils/helpers';
import TierBadge from '../../components/TierBadge';
import { Mail, Calendar, Briefcase, Award, Trophy, Crown } from 'lucide-react';

const Profile = () => {
  const { user: currentUser } = useAuth();
  const { id } = useParams();
  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const isOwnProfile = !id || id === currentUser?._id;

  useEffect(() => {
    const fetchId = id || currentUser?._id;
    setLoading(true);
    getUserById(fetchId)
      .then(r => setProfileUser(r.data))
      .catch(() => setProfileUser(currentUser))
      .finally(() => setLoading(false));
  }, [id, currentUser?._id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        Profile not found
      </div>
    );
  }

  const cards = [
    {
      icon: Mail,
      label: 'Email',
      value: profileUser.email,
      bg: 'bg-blue-50',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-500',
      valueColor: 'text-blue-800',
    },
    {
      icon: Briefcase,
      label: 'Department',
      value: profileUser.department,
      bg: 'bg-indigo-50',
      iconBg: 'bg-indigo-100',
      iconColor: 'text-indigo-500',
      valueColor: 'text-indigo-800',
    },
    {
      icon: Crown,
      label: 'Team Lead',
      value: profileUser.teamLead?.name || 'Not assigned',
      bg: 'bg-purple-50',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-500',
      valueColor: 'text-purple-800',
    },
    {
      icon: Calendar,
      label: 'Member Since',
      value: formatDate(profileUser.joinDate),
      bg: 'bg-teal-50',
      iconBg: 'bg-teal-100',
      iconColor: 'text-teal-500',
      valueColor: 'text-teal-800',
    },
    {
      icon: Award,
      label: 'Total Points',
      value: profileUser.points ?? 0,
      bg: (profileUser.points ?? 0) < 0 ? 'bg-red-50' : 'bg-amber-50',
      iconBg: (profileUser.points ?? 0) < 0 ? 'bg-red-100' : 'bg-amber-100',
      iconColor: (profileUser.points ?? 0) < 0 ? 'text-red-500' : 'text-amber-500',
      valueColor: (profileUser.points ?? 0) < 0 ? 'text-red-600' : 'text-amber-700',
      large: true,
    },
    {
      icon: Trophy,
      label: 'Tier',
      value: profileUser.tier,
      bg: 'bg-orange-50',
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-500',
      valueColor: 'text-orange-700',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 p-6">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Hero Card */}
        <div className="relative bg-gradient-to-br from-primary via-indigo-500 to-secondary rounded-3xl overflow-hidden shadow-2xl">
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/3 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/3 -translate-x-1/3" />
          <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2" />

          {/* Best Employee badge */}
          {profileUser.isBestEmployee && (
            <div className="absolute top-5 right-5 bg-amber-400 text-white text-xs font-black px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1">
              🏅 Best Employee
            </div>
          )}
          {profileUser.isBestTL && (
            <div className="absolute top-5 right-5 bg-purple-400 text-white text-xs font-black px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1">
              👑 Best TL
            </div>
          )}

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center py-12 px-6 text-center">
            {/* Avatar */}
            <div className="w-28 h-28 rounded-2xl bg-white/20 backdrop-blur-sm border-4 border-white/40 flex items-center justify-center text-white text-4xl font-black shadow-2xl mb-5">
              {profileUser.name?.substring(0, 2).toUpperCase()}
            </div>

            {/* Name */}
            <h1 className="text-3xl font-black text-white tracking-tight">{profileUser.name}</h1>

            {/* Role pill */}
            <span className={`mt-3 text-xs font-bold px-4 py-1.5 rounded-full backdrop-blur-sm border
              ${profileUser.role === 'TL'
                ? 'bg-purple-300/20 text-purple-100 border-purple-300/30'
                : 'bg-white/15 text-white border-white/25'}`}>
              {profileUser.role}
              {isOwnProfile && ' · You'}
            </span>

            {/* Tier badge */}
            <div className="mt-4">
              <TierBadge tier={profileUser.tier} />
            </div>
          </div>
        </div>

        {/* Info Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map(({ icon: Icon, label, value, bg, iconBg, iconColor, valueColor, large }) => (
            <div
              key={label}
              className={`${bg} rounded-2xl p-5 flex items-center gap-4 shadow-sm border border-white hover:shadow-md transition-shadow`}
            >
              <div className={`${iconBg} w-12 h-12 rounded-xl flex items-center justify-center shrink-0`}>
                <Icon size={22} className={iconColor} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">{label}</p>
                <p className={`font-black truncate ${large ? 'text-3xl' : 'text-base'} ${valueColor}`}>
                  {value}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default Profile;
