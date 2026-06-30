import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUser, getAllUsers } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff } from 'lucide-react';

const CreateEmployee = () => {
  const navigate = useNavigate();
  const { isTL } = useAuth();
  const [allTeamLeads, setAllTeamLeads] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Employee',
    department: '',
    teamLead: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Filter TLs to only those in the selected department
  const filteredTeamLeads = formData.department
    ? allTeamLeads.filter(tl => tl.department === formData.department)
    : allTeamLeads;

  useEffect(() => {
    if (!isTL) {
      fetchTeamLeads();
    }
  }, [isTL]);

  const fetchTeamLeads = async () => {
    try {
      const response = await getAllUsers();
      setAllTeamLeads(response.data.filter(u => u.role === 'TL'));
    } catch (error) {
      console.error('Error fetching team leads:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    // When department changes, reset teamLead selection
    if (name === 'department') {
      setFormData(prev => ({ ...prev, department: value, teamLead: '' }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await createUser(formData);
      navigate('/employees');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create employee');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 sm:mb-8">➕ Create Employee</h1>

      <div className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200">
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password *
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength="6"
                placeholder="Min. 6 characters"
                className="w-full px-4 py-2 pr-11 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="button"
                onClick={() => setShowPassword(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {!isTL && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role *
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="Employee">Employee</option>
                <option value="TL">Team Lead</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Department *
            </label>
            <select
              name="department"
              value={formData.department}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">-- Select Department --</option>
              <option value="R&D">R&amp;D</option>
              <option value="Development">Development</option>
            </select>
          </div>

          {!isTL && formData.role === 'Employee' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Team Lead
              </label>
              <select
                name="teamLead"
                value={formData.teamLead}
                onChange={handleChange}
                disabled={!formData.department}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-50 disabled:text-gray-400"
              >
                <option value="">
                  {!formData.department
                    ? 'Select a department first'
                    : filteredTeamLeads.length === 0
                    ? `No TLs in ${formData.department} yet`
                    : 'No Team Lead'}
                </option>
                {filteredTeamLeads.map(tl => (
                  <option key={tl._id} value={tl._id}>
                    {tl.name} ({tl.department})
                  </option>
                ))}
              </select>
              {formData.department && filteredTeamLeads.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">
                  ⚠️ No Team Leads found in {formData.department}. Create a TL for this department first.
                </p>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => navigate('/employees')}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEmployee;
