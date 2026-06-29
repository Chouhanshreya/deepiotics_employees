import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllUsers, deleteUser } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useDepartment } from '../../context/DepartmentContext';
import Avatar from '../../components/Avatar';
import TierBadge from '../../components/TierBadge';
import ProfileDrawer from '../../components/ProfileDrawer';
import { Edit2, Trash2, Search, Eye } from 'lucide-react';

const Employees = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { activeDept, deptFilter } = useDepartment();
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState(null);

  useEffect(() => { fetchEmployees(); }, [deptFilter]);

  useEffect(() => {
    let filtered = employees;
    if (roleFilter !== 'All') filtered = filtered.filter(e => e.role === roleFilter);
    if (searchTerm) {
      filtered = filtered.filter(emp =>
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.department.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredEmployees(filtered);
  }, [searchTerm, roleFilter, employees]);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const response = await getAllUsers();
      // Apply dept filter client-side
      const data = deptFilter
        ? response.data.filter(u => u.department === deptFilter)
        : response.data;
      setEmployees(data);
      setFilteredEmployees(data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      try {
        await deleteUser(id);
        fetchEmployees();
      } catch (error) {
        alert('Failed to delete employee');
      }
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center h-64">
        <div className="text-xl text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">👥 Employees</h1>
          <p className="text-gray-500 text-sm mt-1">
            {filteredEmployees.length} user{filteredEmployees.length !== 1 ? 's' : ''} shown
            {deptFilter ? ` · ${activeDept}` : ''}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => navigate('/create-employee')}
            className="bg-primary text-white px-5 py-2.5 rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm self-start sm:self-auto"
          >
            + Add Employee
          </button>
        )}
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by name, email, or department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          />
        </div>
        {isAdmin && (
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white text-sm font-medium"
          >
            <option value="All">All Roles</option>
            <option value="Employee">Employee</option>
            <option value="TL">Team Lead</option>
            <option value="Admin">Admin</option>
          </select>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[540px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 sm:px-6 py-4 text-left text-sm font-semibold text-gray-700">Employee</th>
                <th className="px-4 sm:px-6 py-4 text-left text-sm font-semibold text-gray-700 hidden sm:table-cell">Role</th>
                <th className="px-4 sm:px-6 py-4 text-left text-sm font-semibold text-gray-700 hidden md:table-cell">Department</th>
                <th className="px-4 sm:px-6 py-4 text-left text-sm font-semibold text-gray-700 hidden lg:table-cell">Team Lead</th>
                <th className="px-4 sm:px-6 py-4 text-left text-sm font-semibold text-gray-700 hidden sm:table-cell">Tier</th>
                <th className="px-4 sm:px-6 py-4 text-right text-sm font-semibold text-gray-700">Points</th>
                <th className="px-4 sm:px-6 py-4 text-center text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredEmployees.map((employee) => (
                <tr key={employee._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    <div
                      className="flex items-center gap-3 cursor-pointer group"
                      onClick={() => setSelectedUserId(employee._id)}
                    >
                      <Avatar name={employee.name} size="sm" />
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-800 flex items-center gap-1 group-hover:text-primary transition-colors text-sm">
                          <span className="truncate">{employee.name}</span>
                          {employee.isBestEmployee && <span className="text-xs shrink-0">🏅</span>}
                          {employee.isBestTL && <span className="text-xs shrink-0">👑</span>}
                        </p>
                        <p className="text-xs text-gray-400 truncate">{employee.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 hidden sm:table-cell">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full
                      ${employee.role === 'Admin' ? 'bg-red-100 text-red-700' :
                        employee.role === 'TL' ? 'bg-purple-100 text-purple-700' :
                        'bg-blue-100 text-blue-700'}`}>
                      {employee.role}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-gray-600 text-sm hidden md:table-cell">{employee.department}</td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-gray-500 text-sm hidden lg:table-cell">
                    {employee.teamLead?.name || <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 hidden sm:table-cell">
                    <TierBadge tier={employee.tier} />
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-right">
                    <span className={`text-base font-black ${employee.points < 0 ? 'text-red-500' : 'text-primary'}`}>
                      {employee.points}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    <div className="flex items-center justify-center gap-1">
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => setSelectedUserId(employee._id)}
                            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                            title="View Profile"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => navigate(`/employees/${employee._id}/edit`)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(employee._id, employee.name)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredEmployees.length === 0 && (
            <div className="text-center py-12 text-gray-400">No users found</div>
          )}
        </div>
      </div>

      {/* Profile Popup */}
      {selectedUserId && (
        <ProfileDrawer
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
        />
      )}
    </div>
  );
};

export default Employees;
