import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useDepartment } from '../../context/DepartmentContext';
import {
  getAllUsers,
  getBestPerformers,
  declareBestEmployee,
  declareBestTL,
  resetMonth,
  getArchives,
  closeMonthAndStartNew,
  cleanTestData,
  getLiveRankings
} from '../../utils/api';
import api from '../../utils/api';
import Avatar from '../../components/Avatar';
import { Trophy, Crown, RefreshCw, Archive, AlertTriangle, CheckCircle, Calendar, ArrowRight, Wrench, Zap, ToggleLeft } from 'lucide-react';

const DEPARTMENTS = ['R&D', 'Development'];

const Settings = () => {
  const { user } = useAuth();
  const { deptFilter } = useDepartment();
  const [employees, setEmployees] = useState([]);
  const [tls, setTLs] = useState([]);
  const [bestPerformers, setBestPerformers] = useState({ bestEmployee: null, bestTL: null });
  const [deptBest, setDeptBest] = useState({});
  const [archives, setArchives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [reconciling, setReconciling] = useState(false);
  const [reconcileResult, setReconcileResult] = useState(null);
  const [showCleanConfirm, setShowCleanConfirm] = useState(false);
  const [closing, setClosing] = useState(false);
  const [closeResult, setCloseResult] = useState(null);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [declaring, setDeclaring] = useState('');
  const [message, setMessage] = useState(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [selectedBestEmployee, setSelectedBestEmployee] = useState('');
  const [selectedBestTL, setSelectedBestTL] = useState('');
  const [deptSelections, setDeptSelections] = useState({ 'R&D': { emp: '', tl: '' }, 'Development': { emp: '', tl: '' } });

  useEffect(() => {
    fetchData();      // always load all users for the per-dept cards
    fetchAllDeptBest();
  }, []);             // only on mount — dept toggle doesn't affect Settings user lists

  // Re-fetch deptBest when dept toggle changes (live rankings per dept)
  useEffect(() => {
    fetchAllDeptBest();
  }, [deptFilter]);

  const fetchAllDeptBest = async () => {
    const results = {};
    await Promise.all(DEPARTMENTS.map(async (dept) => {
      try {
        const [liveRes, bestRes] = await Promise.all([
          getLiveRankings(dept),   // live top scorer preview
          getBestPerformers(dept)  // { autoEmployee, autoTL, manualEmployee, manualTL, bestEmployee, bestTL }
        ]);
        results[dept] = {
          live: liveRes.data,
          best: bestRes.data   // has both auto and manual
        };
      } catch (e) {
        console.error(`Failed to load dept best for ${dept}`, e);
      }
    }));
    setDeptBest(results);
  };

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
      // Don't pre-select dropdowns — admin must explicitly choose
      // to avoid accidental re-declarations
    } catch (error) {
      console.error('Error fetching settings data:', error);
    } finally {
      setLoading(false);
    }
  };

  const showMsg = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleDeclareBestEmployee = async () => {
    if (!selectedBestEmployee) {
      showMsg('error', 'Please select an employee first');
      return;
    }
    setDeclaring('employee');
    try {
      const res = await declareBestEmployee(selectedBestEmployee);
      setBestPerformers(prev => ({ ...prev, bestEmployee: res.data.user }));
      showMsg('success', res.data.message);
      fetchData();
      fetchAllDeptBest(); // refresh per-dept cards too
    } catch (error) {
      showMsg('error', error.response?.data?.message || 'Failed to declare best employee');
    } finally {
      setDeclaring('');
    }
  };

  const handleDeclareBestTL = async () => {
    if (!selectedBestTL) {
      showMsg('error', 'Please select a team lead first');
      return;
    }
    setDeclaring('tl');
    try {
      const res = await declareBestTL(selectedBestTL);
      setBestPerformers(prev => ({ ...prev, bestTL: res.data.user }));
      showMsg('success', res.data.message);
      fetchData();
      fetchAllDeptBest(); // refresh per-dept cards too
    } catch (error) {
      showMsg('error', error.response?.data?.message || 'Failed to declare best TL');
    } finally {
      setDeclaring('');
    }
  };

  const handleDeclareDeptBestEmployee = async (dept) => {
    const userId = deptSelections[dept]?.emp;
    if (!userId) {
      showMsg('error', `Please select an employee for ${dept} first`);
      return;
    }
    setDeclaring(`emp-${dept}`);
    try {
      const res = await declareBestEmployee(userId, dept);
      showMsg('success', `${dept}: ${res.data.message}`);
      fetchAllDeptBest();
      fetchData();
    } catch (error) {
      showMsg('error', error.response?.data?.message || 'Failed to declare');
    } finally {
      setDeclaring('');
    }
  };

  const handleDeclareDeptBestTL = async (dept) => {
    const userId = deptSelections[dept]?.tl;
    if (!userId) {
      showMsg('error', `Please select a TL for ${dept} first`);
      return;
    }
    setDeclaring(`tl-${dept}`);
    try {
      const res = await declareBestTL(userId, dept);
      showMsg('success', `${dept}: ${res.data.message}`);
      fetchAllDeptBest();
      fetchData();
    } catch (error) {
      showMsg('error', error.response?.data?.message || 'Failed to declare');
    } finally {
      setDeclaring('');
    }
  };

  const handleAutoCalculateDept = async (dept) => {
    setDeclaring(`auto-${dept}`);
    try {
      // Call the rankings calculate endpoint — it clears manual overrides and
      // writes the true top scorer (by MonthlyPoints) as type:'auto' for this dept
      await api.post('/rankings/calculate');
      showMsg('success', `${dept}: Best performers auto-declared!`);
      fetchAllDeptBest();
      fetchData();
    } catch (error) {
      showMsg('error', error.response?.data?.message || 'Auto-calculate failed');
    } finally {
      setDeclaring('');
    }
  };

  const handleCleanTestData = async () => {
    setCleaning(true);
    setShowCleanConfirm(false);
    try {
      const res = await cleanTestData();
      showMsg('success', res.data.message);
      fetchData();
    } catch (error) {
      showMsg('error', error.response?.data?.message || 'Failed to clean test data');
    } finally {
      setCleaning(false);
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

  const handleReconcilePoints = async () => {
    setReconciling(true);
    setReconcileResult(null);
    try {
      const res = await api.post('/admin/reconcile-points');
      setReconcileResult(res.data);
      showMsg('success', res.data.message);
      fetchData();
    } catch (error) {
      showMsg('error', error.response?.data?.message || 'Failed to reconcile points');
    } finally {
      setReconciling(false);
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
    <div className="p-4 sm:p-6 max-w-4xl mx-auto w-full">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 sm:mb-8">⚙️ Admin Settings</h1>

      {/* Fixed toast notification — always visible */}
      {message && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl text-sm font-semibold max-w-sm
          ${message.type === 'success'
            ? 'bg-green-600 text-white'
            : 'bg-red-600 text-white'}`}>
          {message.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="ml-2 opacity-70 hover:opacity-100 text-lg leading-none">×</button>
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

      {/* ── Per-Department Best Performers ── */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <ToggleLeft className="text-indigo-500" size={22} />
          <h2 className="text-xl font-semibold text-gray-800">Per-Department Best Performers</h2>
        </div>
        <p className="text-sm text-gray-500 mb-5">
          Declare best employee and TL <strong>separately per department</strong>.
          Hit <strong>Auto-Calculate</strong> to pick this month's top scorer automatically, or choose manually.
        </p>
        <div className="space-y-6">
          {DEPARTMENTS.map(dept => {
            const deptEmps = employees.filter(e => e.department === dept).sort((a,b) => b.points - a.points);
            const deptTLs  = tls.filter(t => t.department === dept);
            const liveData = deptBest[dept]?.live;
            return (
              <div key={dept} className={`bg-white rounded-2xl border-2 ${dept === 'R&D' ? 'border-indigo-200' : 'border-emerald-200'} p-5`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-lg font-bold ${dept === 'R&D' ? 'text-indigo-700' : 'text-emerald-700'}`}>
                    {dept === 'R&D' ? '🔬' : '💻'} {dept} Department
                  </h3>
                  <button
                    onClick={() => handleAutoCalculateDept(dept)}
                    disabled={declaring === `auto-${dept}` || !liveData?.starPerformer}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-colors disabled:opacity-50
                      ${dept === 'R&D' ? 'bg-indigo-500 hover:bg-indigo-600 text-white' : 'bg-emerald-500 hover:bg-emerald-600 text-white'}`}
                  >
                    <Zap size={14} />
                    {declaring === `auto-${dept}` ? 'Calculating...' : 'Auto-Calculate'}
                  </button>
                </div>
                {liveData && (liveData.starPerformer || liveData.bestTL) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    {liveData.starPerformer && (
                      <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex items-center gap-2">
                        <span>🏅</span>
                        <div>
                          <p className="text-xs text-amber-600 font-semibold">This Month's Top Employee</p>
                          <p className="text-sm font-bold text-gray-700">{liveData.starPerformer.name}</p>
                          <p className="text-xs text-gray-400">{liveData.starPerformer.monthPoints} pts this month</p>
                        </div>
                      </div>
                    )}
                    {liveData.bestTL && (
                      <div className="bg-purple-50 border border-purple-100 rounded-xl p-3 flex items-center gap-2">
                        <span>👑</span>
                        <div>
                          <p className="text-xs text-purple-600 font-semibold">This Month's Top TL</p>
                          <p className="text-sm font-bold text-gray-700">{liveData.bestTL.name}</p>
                          <p className="text-xs text-gray-400">{liveData.bestTL.monthPoints} pts this month</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {/* Auto-calculated declared winners */}
                {(deptBest[dept]?.best?.autoEmployee || deptBest[dept]?.best?.autoTL) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                    {deptBest[dept].best.autoEmployee && (
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center gap-2">
                        <span>🤖</span>
                        <div>
                          <p className="text-xs text-blue-600 font-semibold">Auto Best Employee</p>
                          <p className="text-sm font-bold text-gray-800">{deptBest[dept].best.autoEmployee.name}</p>
                          <p className="text-xs text-gray-400">{deptBest[dept].best.autoEmployee.department}</p>
                        </div>
                      </div>
                    )}
                    {deptBest[dept].best.autoTL && (
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center gap-2">
                        <span>🤖</span>
                        <div>
                          <p className="text-xs text-blue-600 font-semibold">Auto Best TL</p>
                          <p className="text-sm font-bold text-gray-800">{deptBest[dept].best.autoTL.name}</p>
                          <p className="text-xs text-gray-400">{deptBest[dept].best.autoTL.department}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {/* Manually declared winners */}
                {(deptBest[dept]?.best?.manualEmployee || deptBest[dept]?.best?.manualTL) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    {deptBest[dept].best.manualEmployee && (
                      <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2">
                        <span>✅</span>
                        <div>
                          <p className="text-xs text-green-700 font-semibold">Manually Declared Best Employee</p>
                          <p className="text-sm font-bold text-gray-800">{deptBest[dept].best.manualEmployee.name}</p>
                          <p className="text-xs text-gray-400">{deptBest[dept].best.manualEmployee.department}</p>
                        </div>
                      </div>
                    )}
                    {deptBest[dept].best.manualTL && (
                      <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2">
                        <span>✅</span>
                        <div>
                          <p className="text-xs text-green-700 font-semibold">Manually Declared Best TL</p>
                          <p className="text-sm font-bold text-gray-800">{deptBest[dept].best.manualTL.name}</p>
                          <p className="text-xs text-gray-400">{deptBest[dept].best.manualTL.department}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Manual: Best Employee</label>
                    <div className="flex gap-2">
                      <select
                        value={deptSelections[dept]?.emp || ''}
                        onChange={e => setDeptSelections(prev => ({ ...prev, [dept]: { ...prev[dept], emp: e.target.value } }))}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                      >
                        <option value="">-- Choose --</option>
                        {deptEmps.map(emp => <option key={emp._id} value={emp._id}>{emp.name} — {emp.points} pts</option>)}
                      </select>
                      <button
                        onClick={() => handleDeclareDeptBestEmployee(dept)}
                        disabled={!deptSelections[dept]?.emp || declaring === `emp-${dept}`}
                        className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded-lg transition-colors disabled:opacity-50"
                      >
                        {declaring === `emp-${dept}` ? '…' : '🏅'}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Manual: Best TL</label>
                    <div className="flex gap-2">
                      <select
                        value={deptSelections[dept]?.tl || ''}
                        onChange={e => setDeptSelections(prev => ({ ...prev, [dept]: { ...prev[dept], tl: e.target.value } }))}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                      >
                        <option value="">-- Choose --</option>
                        {deptTLs.map(tl => <option key={tl._id} value={tl._id}>{tl.name}</option>)}
                      </select>
                      <button
                        onClick={() => handleDeclareDeptBestTL(dept)}
                        disabled={!deptSelections[dept]?.tl || declaring === `tl-${dept}`}
                        className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold rounded-lg transition-colors disabled:opacity-50"
                      >
                        {declaring === `tl-${dept}` ? '…' : '👑'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Declare Best Employee (Global) */}
      <div className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200 mb-6">
        <div className="flex items-center gap-3 mb-5">
          <Trophy className="text-amber-500" size={24} />
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Declare Best Employee of the Month</h2>
            <p className="text-xs text-gray-400 mt-0.5">Global — shown across all departments</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Employee</label>
            <select
              value={selectedBestEmployee}
              onChange={(e) => setSelectedBestEmployee(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white text-sm"
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
            className="px-6 py-2.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
          >
            {declaring === 'employee' ? 'Declaring...' : 'Declare 🏅'}
          </button>
        </div>
      </div>

      {/* Declare Best TL */}
      <div className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200 mb-6">
        <div className="flex items-center gap-3 mb-5">
          <Crown className="text-purple-500" size={24} />
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Declare Best TL of the Month</h2>
            <p className="text-xs text-gray-400 mt-0.5">Global — shown across all departments</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Team Lead</label>
            <select
              value={selectedBestTL}
              onChange={(e) => setSelectedBestTL(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white text-sm"
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
            className="px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
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

      {/* ── Clean Test Data ── */}
      <div className="bg-white p-6 rounded-2xl border-2 border-orange-200 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <RefreshCw className="text-orange-500" size={24} />
          <h2 className="text-xl font-semibold text-gray-800">Reset to Current Month (Remove Test Data)</h2>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Deletes all MonthlyPoints rows from other months, clears all point history, resets all
          rankings, and sets every employee/TL back to <strong>0 points</strong> — keeping only the current
          month. Use this once before going live to wipe testing data.
        </p>
        {!showCleanConfirm ? (
          <button
            onClick={() => setShowCleanConfirm(true)}
            disabled={cleaning}
            className="flex items-center gap-2 px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold transition-colors disabled:opacity-50"
          >
            <RefreshCw size={18} /> Clear Test Data & Reset to Current Month
          </button>
        ) : (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
            <p className="font-semibold text-orange-800 mb-1 flex items-center gap-2">
              <AlertTriangle size={18} /> Are you sure?
            </p>
            <p className="text-sm text-orange-600 mb-3">
              This will permanently delete all test months, all point history, all rankings, and reset
              every user's points to 0. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleCleanTestData}
                disabled={cleaning}
                className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
              >
                {cleaning ? 'Cleaning…' : 'Yes, Wipe Test Data'}
              </button>
              <button
                onClick={() => setShowCleanConfirm(false)}
                className="px-5 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Fix Doubled Points (Reconcile) ── */}
      <div className="bg-white p-6 rounded-2xl border-2 border-blue-200 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Wrench className="text-blue-500" size={24} />
          <h2 className="text-xl font-semibold text-gray-800">Fix Points (Reconcile)</h2>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Recalculates every employee's point total from the actual point history records.
          Use this if points look doubled or incorrect — it sets the correct value without
          deleting any data.
        </p>

        {reconcileResult && (
          <div className="mb-4 bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm">
            <p className="font-bold text-blue-700 mb-2">{reconcileResult.message}</p>
            {reconcileResult.corrected?.length > 0 ? (
              <ul className="space-y-1">
                {reconcileResult.corrected.map((r, i) => (
                  <li key={i} className="text-blue-600">
                    {r.name}: <span className="line-through text-red-400">{r.was} pts</span> → <span className="font-bold text-green-600">{r.now} pts</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-blue-600">All points were already correct.</p>
            )}
          </div>
        )}

        <button
          onClick={handleReconcilePoints}
          disabled={reconciling}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition-colors disabled:opacity-50"
        >
          <Wrench size={18} />
          {reconciling ? 'Fixing…' : 'Fix All Points Now'}
        </button>
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
