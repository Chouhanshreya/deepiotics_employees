import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  getAllUsers,
  getBestPerformers,
  declareBestEmployee,
  declareBestTL,
  resetMonth,
  getArchives,
  closeMonthAndStartNew
} from '../../utils/api';
import Avatar from '../../components/Avatar';
import { Trophy, Crown, RefreshCw, Archive, AlertTriangle, CheckCircle, Calendar, ArrowRight } from 'lucide-react';

const Settings = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [tls, setTLs] = useState([]);
  const [bestPerformers, setBestPerformers] = useState({ bestEmployee: null, bestTL: null });
  const [archives, setArchives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [closing, setClosing] = useState(false);
  const [closeResult, setCloseResult] = useState(null);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [declaring, setDeclaring] = useState('');
  const [message, setMessage] = useState(null); // { type: 'success'|'error', text }
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [selectedBestEmployee, setSelectedBestEmployee] = useState('');
  const [selectedBestTL, setSelectedBestTL] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes, bestRes, archivesRes] = await Promise.all([
        getAllUsers(),
        getBestPerformers(),
        getArchives()
      ]);
      const allUsers = usersRes.data;
      setEmployees(allUsers.filter(u => u.role === 'Employee'));
      setTLs(allUsers.filter(u => u.role === 'TL'));
      setBestPerformers(bestRes.data);
      setArchives(archivesRes.data);
      if (bestRes.data.bestEmployee) setSelectedBestEmployee(bestRes.data.bestEmployee._id);
      if (bestRes.data.bestTL) setSelectedBestTL(bestRes.data.bestTL._id);
    } catch (error) {
      console.error('Error fetching settings data:', error);
    } finally {
      setLoading(false);
    }
  };

  const showMsg = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleDeclareBestEmployee = async () => {
    if (!selectedBestEmployee) return;
    setDeclaring('employee');
    try {
      const res = await declareBestEmployee(selectedBestEmployee);
      setBestPerformers(prev => ({ ...prev, bestEmployee: res.data.user }));
      showMsg('success', res.data.message);
    } catch (error) {
      showMsg('error', error.response?.data?.message || 'Failed to declare best employee');
    } finally {
      setDeclaring('');
    }
  };

  const handleDeclareBestTL = async () => {
    if (!selectedBestTL) return;
    setDeclaring('tl');
    try {
      const res = await declareBestTL(selectedBestTL);
      setBestPerformers(prev => ({ ...prev, bestTL: res.data.user }));
      showMsg('success', res.data.message);
    } catch (error) {
      showMsg('error', error.response?.data?.message || 'Failed to declare best TL');
    } finally {
      setDeclaring('');
    }
  };

  const handleResetMonth = async () => {
    setResetting(true);
    setShowResetConfirm(false);
    try {
      const res = await resetMonth();
      showMsg('success', res.data.message);
      fetchData();
    } catch (error) {
      showMsg('error', error.response?.data?.message || 'Failed to reset month');
    } finally {
      setResetting(false);
    }
  };

  const handleCloseMonth = async () => {
    setClosing(true);
    setShowCloseConfirm(false);
    setCloseResult(null);
    try {
      const res = await closeMonthAndStartNew();
      setCloseResult(res.data);
      showMsg('success', res.data.message);
      fetchData();
    } catch (error) {
      showMsg('error', error.response?.data?.message || 'Failed to close month');
    } finally {
      setClosing(false);
    }
  };

  const monthName = (num) => {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return months[num - 1] || num;
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center h-64">
        <div className="text-xl text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">⚙️ Admin Settings</h1>

      {/* Notification */}
      {message && (
        <div className={`mb-6 flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium
          ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
          {message.text}
        </div>
      )}

      {/* Current Best Performers */}
      {(bestPerformers.bestEmployee || bestPerformers.bestTL) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {bestPerformers.bestEmployee && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-3">
              <span className="text-3xl">🏅</span>
              <div>
                <p className="text-xs font-semibold text-amber-600 uppercase">Current Best Employee</p>
                <p className="font-bold text-gray-800">{bestPerformers.bestEmployee.name}</p>
                <p className="text-sm text-gray-600">{bestPerformers.bestEmployee.points} pts</p>
              </div>
            </div>
          )}
          {bestPerformers.bestTL && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 flex items-center gap-3">
              <span className="text-3xl">👑</span>
              <div>
                <p className="text-xs font-semibold text-purple-600 uppercase">Current Best TL</p>
                <p className="font-bold text-gray-800">{bestPerformers.bestTL.name}</p>
                <p className="text-sm text-gray-600">{bestPerformers.bestTL.department}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Declare Best Employee */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
        <div className="flex items-center gap-3 mb-5">
          <Trophy className="text-amber-500" size={24} />
          <h2 className="text-xl font-semibold text-gray-800">Declare Best Employee of the Month</h2>
        </div>
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Employee</label>
            <select
              value={selectedBestEmployee}
              onChange={(e) => setSelectedBestEmployee(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
            >
              <option value="">-- Choose an employee --</option>
              {employees
                .sort((a, b) => b.points - a.points)
                .map(emp => (
                  <option key={emp._id} value={emp._id}>
                    {emp.name} — {emp.points} pts ({emp.department})
                  </option>
                ))}
            </select>
          </div>
          <button
            onClick={handleDeclareBestEmployee}
            disabled={!selectedBestEmployee || declaring === 'employee'}
            className="px-6 py-2.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {declaring === 'employee' ? 'Declaring...' : 'Declare 🏅'}
          </button>
        </div>
      </div>

      {/* Declare Best TL */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
        <div className="flex items-center gap-3 mb-5">
          <Crown className="text-purple-500" size={24} />
          <h2 className="text-xl font-semibold text-gray-800">Declare Best TL of the Month</h2>
        </div>
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Team Lead</label>
            <select
              value={selectedBestTL}
              onChange={(e) => setSelectedBestTL(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
            >
              <option value="">-- Choose a TL --</option>
              {tls.map(tl => (
                <option key={tl._id} value={tl._id}>
                  {tl.name} — {tl.department}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleDeclareBestTL}
            disabled={!selectedBestTL || declaring === 'tl'}
            className="px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {declaring === 'tl' ? 'Declaring...' : 'Declare 👑'}
          </button>
        </div>
      </div>

      {/* ── Close Month & Start New Month ── */}
      <div className="bg-white p-6 rounded-2xl border-2 border-indigo-200 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Calendar className="text-indigo-500" size={24} />
          <h2 className="text-xl font-semibold text-gray-800">Close Month & Start New Month</h2>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Closes the current month: calculates Star Performer + Best TL, resets all points to 0,
          and creates fresh rows for the next month. This is what the cron job does automatically
          on the 1st — use this to trigger it manually anytime.
        </p>

        {/* Result banner after successful close */}
        {closeResult && (
          <div className="mb-4 bg-indigo-50 border border-indigo-200 rounded-xl p-4 text-sm">
            <p className="font-bold text-indigo-700 mb-2">✅ {closeResult.message}</p>
            <div className="flex flex-wrap gap-4">
              {closeResult.starPerformer && (
                <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full font-semibold">
                  ⭐ Star Performer: {closeResult.starPerformer.name}
                </span>
              )}
              {closeResult.bestTL && (
                <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full font-semibold">
                  👑 Best TL: {closeResult.bestTL.name}
                </span>
              )}
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full font-semibold">
                {closeResult.rowsCreated} new rows created for next month
              </span>
            </div>
          </div>
        )}

        {!showCloseConfirm ? (
          <button
            onClick={() => setShowCloseConfirm(true)}
            disabled={closing}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-semibold transition-colors disabled:opacity-50"
          >
            <Calendar size={18} />
            Close Current Month & Start Next
            <ArrowRight size={16} />
          </button>
        ) : (
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
            <p className="font-semibold text-indigo-800 mb-1 flex items-center gap-2">
              <AlertTriangle size={18} /> Are you sure?
            </p>
            <p className="text-sm text-indigo-600 mb-3">
              This will lock the current month's rankings, reset all points to 0, and start the next month.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleCloseMonth}
                disabled={closing}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
              >
                {closing ? 'Processing…' : 'Yes, Close & Start New Month'}
              </button>
              <button
                onClick={() => setShowCloseConfirm(false)}
                className="px-5 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Reset Month */}
      <div className="bg-white p-6 rounded-lg border border-red-200 mb-6">
        <div className="flex items-center gap-3 mb-3">
          <RefreshCw className="text-red-500" size={24} />
          <h2 className="text-xl font-semibold text-gray-800">Reset Monthly Points</h2>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          This will archive the current month's rankings and reset all employee and TL points to zero.
          The data is never deleted — it's saved in the archive. This action cannot be undone for the current month.
        </p>
        {!showResetConfirm ? (
          <button
            onClick={() => setShowResetConfirm(true)}
            className="flex items-center gap-2 px-6 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
          >
            <RefreshCw size={18} /> Reset This Month
          </button>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-700 font-semibold mb-3">
              <AlertTriangle size={20} />
              Are you sure? This cannot be undone for the current month.
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleResetMonth}
                disabled={resetting}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
              >
                {resetting ? 'Resetting...' : 'Yes, Reset Now'}
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Archive History */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex items-center gap-3 mb-5">
          <Archive className="text-gray-500" size={24} />
          <h2 className="text-xl font-semibold text-gray-800">Monthly Archive History</h2>
        </div>
        {archives.length === 0 ? (
          <p className="text-gray-500 text-sm">No archives yet. Archives are created when you reset the month.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {archives.map((archive) => (
              <div key={archive._id} className="py-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-800">
                    {monthName(archive.month)} {archive.year}
                  </p>
                  <p className="text-sm text-gray-500">
                    {archive.bestEmployee ? `🏅 Best Employee: ${archive.bestEmployee.name}` : 'No best employee declared'}
                    {archive.bestTL ? ` · 👑 Best TL: ${archive.bestTL.name}` : ''}
                  </p>
                </div>
                <span className="text-xs text-gray-400">
                  Reset {new Date(archive.resetAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Profile Info */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 mt-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Your Profile</h2>
        <div className="flex items-center gap-4">
          <Avatar name={user?.name} size="lg" />
          <div>
            <p className="font-semibold text-gray-800">{user?.name}</p>
            <p className="text-sm text-gray-600">{user?.email}</p>
            <p className="text-xs text-gray-500 mt-1">{user?.role} · {user?.department}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
