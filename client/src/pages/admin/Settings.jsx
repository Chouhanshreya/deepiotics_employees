import { useAuth } from '../../context/AuthContext';
import { Settings as SettingsIcon, User, Shield } from 'lucide-react';

const Settings = () => {
  const { user } = useAuth();

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">⚙️ Settings</h1>

      {/* Profile Settings */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <User className="text-primary" size={24} />
          <h2 className="text-xl font-semibold text-gray-800">Profile Information</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
            <input
              type="text"
              value={user?.name}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={user?.email}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
            <input
              type="text"
              value={user?.role}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
            />
          </div>
        </div>
      </div>

      {/* System Settings */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="text-primary" size={24} />
          <h2 className="text-xl font-semibold text-gray-800">System Settings</h2>
        </div>
        <p className="text-gray-600">
          System configuration and advanced settings are managed by administrators.
        </p>
      </div>
    </div>
  );
};

export default Settings;
