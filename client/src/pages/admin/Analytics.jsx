import { useState, useEffect } from 'react';
import { getTopPerformers, getPointsTimeline } from '../../utils/api';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Avatar from '../../components/Avatar';
import TierBadge from '../../components/TierBadge';

const Analytics = () => {
  const [topPerformers, setTopPerformers] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [period, setPeriod] = useState('weekly');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [period]);

  const fetchData = async () => {
    try {
      const [performersRes, timelineRes] = await Promise.all([
        getTopPerformers(),
        getPointsTimeline(period)
      ]);
      setTopPerformers(performersRes.data);
      setTimeline(timelineRes.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
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

  const chartData = topPerformers.map(emp => ({
    name: emp.name.split(' ')[0],
    points: emp.points
  }));

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">📊 Analytics</h1>

      {/* Top Performers Bar Chart */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Top 10 Performers</h2>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="points" fill="#6366f1" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Points Timeline */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Points Distribution Over Time</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setPeriod('weekly')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                period === 'weekly'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setPeriod('monthly')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                period === 'monthly'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Monthly
            </button>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={timeline}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="period" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="points" stroke="#6366f1" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Top Performers List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Top Performers Details</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {topPerformers.map((employee, index) => (
            <div key={employee._id} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50">
              <div className="text-2xl font-bold text-gray-400 w-8">
                #{index + 1}
              </div>
              <Avatar name={employee.name} size="md" />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800">{employee.name}</h3>
                <p className="text-sm text-gray-600">{employee.department}</p>
              </div>
              <TierBadge tier={employee.tier} />
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">{employee.points}</p>
                <p className="text-sm text-gray-600">points</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
