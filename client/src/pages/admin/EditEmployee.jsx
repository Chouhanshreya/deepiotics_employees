import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getUserById, updateUser, getAllUsers } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const EditEmployee = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [allTeamLeads, setAllTeamLeads] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'Employee',
    department: '',
    teamLead: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Filter TLs to only those in the selected department
  const filteredTeamLeads = formData.department
    ? allTeamLeads.filter(tl => tl.department === formData.department)
    : allTeamLeads;

  useEffect(() => {
    fetchEmployee();
    if (isAdmin) {
      fetchTeamLeads();
    }
  }, [id, isAdmin]);

  const fetchEmployee = async () => {
    try {
      const response = await getUserById(id);
      const user = response.data;
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        teamLead: user.teamLead?._id || ''
      });
    } catch (error) {
      console.error('Error fetching employee:', error);
      setError('Failed to load employee data');
    } finally {
      setLoading(false);
    }
  };

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
    // When department changes, reset teamLead
    if (name === 'department') {
      setFormData(prev => ({ ...prev, department: value, teamLead: '' }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await updateUser(id, formData);
      navigate('/employees');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update employee');
      setSubmitting(false);
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
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 sm:mb-8">✏️ Edit Employee</h1>

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

          {isAdmin && (
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
                <option value="Admin">Admin</option>
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

          {isAdmin && formData.role === 'Employee' && (
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
                  ⚠️ No Team Leads found in {formData.department}.
                </p>
              )}
            </div>
          )}

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-700">
              <strong>Note:</strong> Password cannot be changed here. User must use password reset functionality.
            </p>
          </div>

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
              disabled={submitting}
              className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {submitting ? 'Updating...' : 'Update Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditEmployee;
