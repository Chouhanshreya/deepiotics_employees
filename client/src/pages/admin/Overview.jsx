import { useState, useEffect } from 'react';
import { getOverview } from '../../utils/api';
import StatCard from '../../components/StatCard';
import Avatar from '../../components/Avatar';
import TierBadge from '../../components/TierBadge';
import { Users, Award, Trophy, Flame } from 'lucide-react';

const Overview = () => {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOverview();
  }, []);

  const fetchOverview = async () => {
    try {
      const response = await getOverview();
      setOverview(response.data);
    } catch (error) {
      console.error('Error fetching overview:', error);
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

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">📈 Overview</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={Users}
          label="Total Employees"
          value={overview.totalEmployees}
          color="blue"
        />
        <StatCard
          icon={Award}
          label="Points Distributed"
          value={overview.totalPoints}
          color="amber"
        />
        <StatCard
          icon={Trophy}
          label="Top Performer"
          value={overview.topPerformer?.name || 'N/A'}
          color="purple"
        />
        <StatCard
          icon={Flame}
          label="Active Streaks"
          value={overview.activeStreaks}
          color="amber"
        />
      </div>

      {/* Top Performer Card */}
      {overview.topPerformer && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">🏆 Top Performer</h2>
          <div className="flex items-center gap-4">
            <Avatar name={overview.topPerformer.name} size="lg" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold">{overview.topPerformer.name}</h3>
              <p className="text-sm text-gray-600">{overview.topPerformer.department}</p>
              <div className="mt-2">
                <TierBadge tier={overview.topPerformer.tier} />
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-primary">{overview.topPerformer.points}</p>
              <p className="text-sm text-gray-600">Points</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Overview;
