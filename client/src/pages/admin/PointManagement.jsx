import { useState, useEffect } from 'react';
import { getAllUsers, getPointHistory, assignPoints } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useDepartment } from '../../context/DepartmentContext';
import Avatar from '../../components/Avatar';
import TierBadge from '../../components/TierBadge';
import AssignPointsModal from '../../components/AssignPointsModal';
import {
  Award, Search, Clock, Filter, TrendingUp, Users, Star, ChevronDown, ChevronUp
} from 'lucide-react';

const CATEGORIES = ['All', 'General', 'Performance', 'Teamwork', 'Innovation', 'Leadership', 'Punctuality', 'Extra Mile'];

const categoryIcon = (cat) => {
  const map = { General: '⭐', Performance: '🚀', Teamwork: '🤝', Innovation: '💡', Leadership: '👑', Punctuality: '⏰', 'Extra Mile': '🔥' };
  return map[cat] || '⭐';
};

const categoryColor = (cat) => {
  const map = {
    General: 'bg-gray-100 text-gray-700',
    Performance: 'bg-blue-100 text-blue-700',
    Teamwork: 'bg-green-100 text-green-700',
    Innovation: 'bg-yellow-100 text-yellow-700',
    Leadership: 'bg-purple-100 text-purple-700',
    Punctuality: 'bg-teal-100 text-teal-700',
    'Extra Mile': 'bg-orange-100 text-orange-700',
  };
  return map[cat] || 'bg-gray-100 text-gray-700';
};

const PointManagement = () => {
  const { user, isAdmin, isTL } = useAuth();
  const { activeDept, deptFilter } = useDepartment();

  // Employees list
  const [allEmployees, setAllEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [search, setSearch] = useState('');
  const [teamFilter, setTeamFilter] = useState('All');
  const [roleFilter, setRoleFilter] = useState('All'); // 'All' | 'TL' | 'Employee'
  const [loadingEmployees, setLoadingEmployees] = useState(true);

  // Selected employee for modal
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // Global point history log
  const [globalHistory, setGlobalHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [showHistory, setShowHistory] = useState(false);

  // TL options for filter
  const [tls, setTLs] = useState([]);

  useEffect(() => {
    fetchEmployees();
  }, [deptFilter]); // re-fetch when dept toggle changes

  useEffect(() => {
    let filtered = allEmployees;

    // Role filter: TLs only or Employees only
    if (roleFilter === 'TL') {
      filtered = filtered.filter(e => e.role === 'TL');
    } else if (roleFilter === 'Employee') {
      filtered = filtered.filter(e => e.role === 'Employee');
      // Apply team filter only when showing employees
      if (teamFilter !== 'All') {
        filtered = filtered.filter(e =>
          e.teamLead?._id === teamFilter || e.teamLead?.toString() === teamFilter
        );
      }
    } else {
      // 'All' role — still allow team filter
      if (teamFilter !== 'All') {
        filtered = filtered.filter(e =>
          e.teamLead?._id === teamFilter || e.teamLead?.toString() === teamFilter
        );
      }
    }

    if (search) {
      filtered = filtered.filter(e =>
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        e.department.toLowerCase().includes(search.toLowerCase())
      );
    }
    setFilteredEmployees(filtered);
  }, [search, teamFilter, roleFilter, allEmployees]);

  const fetchEmployees = async () => {
    try {
      const res = await getAllUsers();
      const allUsers = res.data;
      const tlList = allUsers.filter(u => u.role === 'TL');

      let visibleUsers;
      if (isAdmin) {
        // Admin sees all Employees + TLs, filtered by dept toggle
        visibleUsers = allUsers.filter(u =>
          (u.role === 'Employee' || u.role === 'TL') &&
          (!deptFilter || u.department === deptFilter)
        );
      } else if (isTL) {
        // TL only sees their own team employees
        visibleUsers = allUsers.filter(u =>
          u.role === 'Employee' && (
            u.teamLead?._id?.toString() === user._id?.toString() ||
            u.teamLead?.toString() === user._id?.toString()
          )
        );
      } else {
        visibleUsers = [];
      }

      setAllEmployees(visibleUsers);
      setFilteredEmployees(visibleUsers);
      setTLs(tlList.filter(t => !deptFilter || t.department === deptFilter));
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingEmployees(false);
    }
  };

  const loadGlobalHistory = async () => {
    setHistoryLoading(true);
    try {
      // Fetch history for all employees and flatten
      const res = await getAllUsers();
      const employees = res.data.filter(u => u.role === 'Employee');
      const histories = await Promise.all(
        employees.map(emp => getPointHistory(emp._id).then(r => r.data).catch(() => []))
      );
      const flat = histories.flat().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setGlobalHistory(flat);
    } catch {
      setGlobalHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const toggleHistory = () => {
    if (!showHistory && globalHistory.length === 0) loadGlobalHistory();
    setShowHistory(p => !p);
  };

  // Stats
  const totalPoints = allEmployees.reduce((s, e) => s + e.points, 0);
  const topEmployee = [...allEmployees].sort((a, b) => b.points - a.points)[0];
  const avgPoints = allEmployees.length ? Math.round(totalPoints / allEmployees.length) : 0;

  const filteredHistory = globalHistory.filter(h => {
    const matchCat = categoryFilter === 'All' || h.category === categoryFilter;
    const matchSearch = !historySearch ||
      h.note?.toLowerCase().includes(historySearch.toLowerCase()) ||
      h.assignedBy?.name?.toLowerCase().includes(historySearch.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto w-full">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">🏆 Point Management</h1>
        <p className="text-gray-500 text-sm mt-1">
          {isAdmin
            ? deptFilter
              ? `Assigning and tracking points for ${activeDept} department`
              : 'Assign and track points for all employees'
            : 'Assign and track points for your team'}
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
            <Award className="text-amber-600" size={24} />
          </div>
          <div>
            <p className="text-2xl font-black text-gray-800">{totalPoints.toLocaleString()}</p>
            <p className="text-sm text-gray-500">Total Points Distributed</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
            <Users className="text-blue-600" size={24} />
          </div>
          <div>
            <p className="text-2xl font-black text-gray-800">{allEmployees.length}</p>
            <p className="text-sm text-gray-500">{isTL ? 'Your Team Members' : 'Employees & TLs'}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
            <TrendingUp className="text-green-600" size={24} />
          </div>
          <div>
            <p className="text-2xl font-black text-gray-800">{avgPoints}</p>
            <p className="text-sm text-gray-500">Average Points / Employee</p>
          </div>
        </div>
      </div>

      {/* Top Performer Mini Banner */}
      {topEmployee && (
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-center gap-4">
          <span className="text-3xl">🥇</span>
          <div className="flex-1">
            <p className="text-xs font-bold text-amber-600 uppercase tracking-wide">Top Performer</p>
            <p className="font-bold text-gray-800">{topEmployee.name} — {topEmployee.department}</p>
          </div>
          <span className="text-2xl font-black text-amber-600">{topEmployee.points} pts</span>
        </div>
      )}

      {/* Employee Grid */}
      <div className="bg-white rounded-xl border border-gray-200 mb-6">
        <div className="p-5 border-b border-gray-100 flex flex-col gap-3">
          {/* Row 1: Search + Team dropdown */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search employee or department..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
            {isAdmin && tls.length > 0 && roleFilter !== 'TL' && (
              <select
                value={teamFilter}
                onChange={e => setTeamFilter(e.target.value)}
                className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 min-w-[160px]"
              >
                <option value="All">All Teams</option>
                {tls.map(tl => (
                  <option key={tl._id} value={tl._id}>{tl.name}'s Team</option>
                ))}
              </select>
            )}
          </div>

          {/* Row 2: Role filter pills (Admin only) */}
          {isAdmin && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide mr-1">
                <Filter size={12} className="inline mr-1" />Show:
              </span>
              {[
                { value: 'All',      label: '👥 All',       active: 'bg-gray-700 text-white border-gray-700' },
                { value: 'TL',       label: '👑 TLs Only',  active: 'bg-purple-600 text-white border-purple-600' },
                { value: 'Employee', label: '🧑‍💼 Employees Only', active: 'bg-blue-500 text-white border-blue-500' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setRoleFilter(opt.value);
                    // Reset team filter when switching to TL-only view
                    if (opt.value === 'TL') setTeamFilter('All');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all
                    ${roleFilter === opt.value
                      ? opt.active
                      : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'}`}
                >
                  {opt.label}
                </button>
              ))}

              {/* Active filter summary badge */}
              {(roleFilter !== 'All' || teamFilter !== 'All') && (
                <button
                  onClick={() => { setRoleFilter('All'); setTeamFilter('All'); setSearch(''); }}
                  className="ml-auto text-xs text-gray-400 hover:text-red-500 font-medium transition-colors flex items-center gap-1"
                >
                  ✕ Clear filters
                </button>
              )}
            </div>
          )}
        </div>

        {loadingEmployees ? (
          <div className="p-12 text-center text-gray-400">Loading employees...</div>
        ) : filteredEmployees.length === 0 ? (
          <div className="p-12 text-center text-gray-400">No employees found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px]">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Employee</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Department</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Team Lead</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Tier</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Points</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredEmployees
                  .sort((a, b) => b.points - a.points)
                  .map((emp, idx) => (
                    <tr key={emp._id} className="hover:bg-amber-50/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-300 w-5 shrink-0">#{idx + 1}</span>
                          <Avatar name={emp.name} size="sm" />
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-800 text-sm flex items-center gap-1">
                              <span className="truncate">{emp.name}</span>
                              {emp.role === 'TL' && (
                                <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full font-medium shrink-0">TL</span>
                              )}
                            </p>
                            <p className="text-xs text-gray-400 truncate">{emp.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 hidden sm:table-cell">{emp.department}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 hidden md:table-cell">{emp.teamLead?.name || '—'}</td>
                      <td className="px-4 py-3 hidden sm:table-cell"><TierBadge tier={emp.tier} /></td>
                      <td className="px-4 py-3 text-right">
                        <span className={`text-base font-black ${emp.points < 0 ? 'text-red-500' : 'text-amber-600'}`}>
                          {emp.points}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => setSelectedEmployee(emp)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg transition-colors"
                        >
                          <Award size={13} /> Assign
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Point History Log */}
      <div className="bg-white rounded-xl border border-gray-200">
        <button
          onClick={toggleHistory}
          className="w-full flex items-center gap-3 p-5 text-left hover:bg-gray-50 transition-colors rounded-xl"
        >
          <Clock className="text-gray-500" size={20} />
          <span className="font-semibold text-gray-700">Full Point History Log</span>
          <span className="text-xs text-gray-400 ml-1">({globalHistory.length} entries)</span>
          <span className="ml-auto">{showHistory ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}</span>
        </button>

        {showHistory && (
          <div className="border-t border-gray-100">
            {/* History filters */}
            <div className="p-4 flex flex-col md:flex-row gap-3 border-b border-gray-50">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search by note or assigner..."
                  value={historySearch}
                  onChange={e => setHistorySearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all
                      ${categoryFilter === cat
                        ? 'bg-amber-500 text-white border-amber-500'
                        : 'bg-white text-gray-500 border-gray-200 hover:border-amber-400'}`}
                  >
                    {cat === 'All' ? 'All' : `${categoryIcon(cat)} ${cat}`}
                  </button>
                ))}
              </div>
            </div>

            {/* History entries */}
            <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
              {historyLoading ? (
                <div className="p-8 text-center text-gray-400">Loading history...</div>
              ) : filteredHistory.length === 0 ? (
                <div className="p-8 text-center text-gray-400">No entries found</div>
              ) : (
                filteredHistory.map(entry => (
                  <div key={entry._id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50">
                    <span className="text-xl">{categoryIcon(entry.category)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-bold ${entry.points < 0 ? 'text-red-500' : 'text-amber-600'}`}>
                          {entry.points > 0 ? '+' : ''}{entry.points} pts
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${categoryColor(entry.category)}`}>
                          {entry.category || 'General'}
                        </span>
                        {entry.note && (
                          <span className="text-xs text-gray-500 truncate max-w-xs">"{entry.note}"</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Assigned by <span className="font-medium text-gray-600">{entry.assignedBy?.name || 'Unknown'}</span>
                        {' · '}{new Date(entry.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {new Date(entry.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Assign Points Modal */}
      {selectedEmployee && (
        <AssignPointsModal
          employee={selectedEmployee}
          onClose={() => setSelectedEmployee(null)}
          onSuccess={() => {
            fetchEmployees();
            setSelectedEmployee(null);
            if (showHistory) loadGlobalHistory();
          }}
        />
      )}
    </div>
  );
};

export default PointManagement;
