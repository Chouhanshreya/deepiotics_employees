import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getUserById, changePassword } from '../../utils/api';
import { formatDate } from '../../utils/helpers';
import TierBadge from '../../components/TierBadge';
import { Mail, Calendar, Briefcase, Award, Trophy, Crown, KeyRound, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';

const Profile = () => {
  const { user: currentUser } = useAuth();
  const { id } = useParams();
  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Password change state
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwShow, setPwShow] = useState({ current: false, new: false, confirm: false });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwStatus, setPwStatus] = useState(null); // { type: 'success'|'error', message }

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

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwStatus(null);

    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwStatus({ type: 'error', message: 'New passwords do not match' });
      return;
    }
    if (pwForm.newPassword.length < 6) {
      setPwStatus({ type: 'error', message: 'New password must be at least 6 characters' });
      return;
    }

    setPwLoading(true);
    try {
      await changePassword({
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      setPwStatus({ type: 'success', message: 'Password updated successfully!' });
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPwStatus({ type: 'error', message: err.response?.data?.message || 'Failed to update password' });
    } finally {
      setPwLoading(false);
    }
  };

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

        {/* Change Password — only on own profile */}
        {isOwnProfile && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                <KeyRound size={20} className="text-indigo-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800">Change Password</h3>
                <p className="text-xs text-gray-400">Update your account password</p>
              </div>
            </div>

            <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
              {/* Current Password */}
              {[
                { key: 'currentPassword', label: 'Current Password', showKey: 'current' },
                { key: 'newPassword',     label: 'New Password',     showKey: 'new' },
                { key: 'confirmPassword', label: 'Confirm New Password', showKey: 'confirm' },
              ].map(({ key, label, showKey }) => (
                <div key={key}>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    {label}
                  </label>
                  <div className="relative">
                    <input
                      type={pwShow[showKey] ? 'text' : 'password'}
                      value={pwForm[key]}
                      onChange={e => setPwForm(f => ({ ...f, [key]: e.target.value }))}
                      required
                      placeholder="••••••••"
                      className="w-full px-4 py-2.5 pr-11 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 text-sm transition"
                    />
                    <button
                      type="button"
                      onClick={() => setPwShow(s => ({ ...s, [showKey]: !s[showKey] }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {pwShow[showKey] ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              ))}

              {/* Status message */}
              {pwStatus && (
                <div className={`flex items-center gap-2 text-sm px-4 py-3 rounded-xl font-medium
                  ${pwStatus.type === 'success'
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-600 border border-red-200'}`}>
                  {pwStatus.type === 'success'
                    ? <CheckCircle size={16} />
                    : <AlertCircle size={16} />}
                  {pwStatus.message}
                </div>
              )}

              <button
                type="submit"
                disabled={pwLoading}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
              >
                {pwLoading ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Updating...</>
                ) : (
                  <><KeyRound size={15} /> Update Password</>
                )}
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};

export default Profile;
