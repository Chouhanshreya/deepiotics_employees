import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getUserStats } from '../../utils/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import StatCard from '../../components/StatCard';
import { Award, CheckCircle, Flame, TrendingUp } from 'lucide-react';

const Stats = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await getUserStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
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

  // Format monthly points data for chart
  const chartData = stats.monthlyPoints.map(item => ({
    month: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
    points: item.total
  }));

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">📊 My Stats</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={Award}
          label="Total Points"
          value={stats.user.points}
          color="amber"
        />
        <StatCard
          icon={CheckCircle}
          label="Total Tasks"
          value={stats.totalTasks}
          color="teal"
        />
        <StatCard
          icon={TrendingUp}
          label="This Month"
          value={stats.tasksThisMonth}
          color="blue"
        />
        <StatCard
          icon={Flame}
          label="Current Streak"
          value={`${stats.streak} days`}
          color="amber"
        />
      </div>

      {/* Monthly Points Chart */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Monthly Points (Last 6 Months)</h2>
        
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="points" fill="#6366f1" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-500">
            No data available
          </div>
        )}
      </div>
    </div>
  );
};

export default Stats;
