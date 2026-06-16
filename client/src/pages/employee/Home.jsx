import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getGreeting, getCurrentDate } from '../../utils/helpers';
import { getQuoteOfTheDay } from '../../utils/quotes';
import { Trophy, CheckCircle, Flame, Award } from 'lucide-react';
import StatCard from '../../components/StatCard';
import { getLeaderboard } from '../../utils/api';

const Home = () => {
  const { user } = useAuth();
  const [rank, setRank] = useState(null);

  useEffect(() => {
    const fetchRank = async () => {
      try {
        const response = await getLeaderboard();
        const currentUserRank = response.data.findIndex(u => u._id === user._id) + 1;
        setRank(currentUserRank);
      } catch (error) {
        console.error('Error fetching rank:', error);
      }
    };

    fetchRank();
  }, [user._id]);

  const quote = getQuoteOfTheDay();
  const greeting = getGreeting();
  const currentDate = getCurrentDate();

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          {greeting}, {user?.name?.split(' ')[0]}! 👋
        </h1>
        <p className="text-gray-600 mt-1">{currentDate}</p>
      </div>

      {/* Thought of the day */}
      <div className="bg-gradient-to-r from-primary to-secondary text-white p-6 rounded-lg mb-8 shadow-lg">
        <h2 className="text-lg font-semibold mb-2">💭 Thought of the Day</h2>
        <p className="text-lg italic">"{quote}"</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Award}
          label="Total Points"
          value={user?.points || 0}
          color="amber"
        />
        <StatCard
          icon={Trophy}
          label="Current Rank"
          value={rank ? `#${rank}` : '—'}
          color="purple"
        />
        <StatCard
          icon={CheckCircle}
          label="Tasks Done"
          value={user?.tasksCompleted || 0}
          color="teal"
        />
        <StatCard
          icon={Flame}
          label="Active Streak"
          value={`${user?.activeStreak || 0} days`}
          color="amber"
        />
      </div>
    </div>
  );
};

export default Home;
