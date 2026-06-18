import { NavLink } from 'react-router-dom';
import { 
  Home, User, Trophy, Users, BarChart3, 
  UserPlus, ListTodo, Settings, LogOut,
  FileText, UserCog, TrendingUp, Award, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { user, logout, isEmployee, isTL, isAdmin } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const employeeLinks = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/profile', icon: User, label: 'My Profile' },
    { to: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
    { to: '/team', icon: Users, label: 'My Teammates' },
    { to: '/stats', icon: BarChart3, label: 'My Stats' }
  ];

  const teamLeadLinks = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/profile', icon: User, label: 'My Profile' },
    { to: '/team', icon: Users, label: 'My Team' },
    { to: '/employees', icon: UserCog, label: 'All Employees' },
    { to: '/point-management', icon: Award, label: 'Point Management' },
    { to: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
    { to: '/analytics', icon: BarChart3, label: 'Analytics' },
    { to: '/monthly-history', icon: TrendingUp, label: 'Monthly History' },
    { to: '/stats', icon: TrendingUp, label: 'My Stats' }
  ];

  const adminLinks = [
    { to: '/', icon: FileText, label: 'Overview' },
    { to: '/employees', icon: UserCog, label: 'Employees' },
    { to: '/create-employee', icon: UserPlus, label: 'Create Employee' },
    { to: '/point-management', icon: Award, label: 'Point Management' },
    { to: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
    { to: '/analytics', icon: BarChart3, label: 'Analytics' },
    { to: '/monthly-history', icon: TrendingUp, label: 'Monthly History' },
    { to: '/settings', icon: Settings, label: 'Settings' }
  ];

  const links = isEmployee ? employeeLinks : isTL ? teamLeadLinks : adminLinks;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-30 h-screen w-64 bg-white border-r border-gray-200
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-primary">EMS</h1>
            <p className="text-sm text-gray-600 mt-1">{user?.role} Dashboard</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-2">
              {links.map(({ to, icon: Icon, label }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    className={({ isActive }) => `
                      flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                      ${isActive 
                        ? 'bg-primary text-white' 
                        : 'text-gray-700 hover:bg-gray-100'
                      }
                    `}
                    onClick={() => setIsOpen(false)}
                  >
                    <Icon size={20} />
                    <span>{label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          {/* User info and logout */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-semibold">
                {user?.name?.substring(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{user?.name}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="flex items-center gap-2 w-full px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Logout confirmation modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 relative">
            {/* Close */}
            <button
              onClick={() => setShowLogoutConfirm(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={18} />
            </button>

            {/* Icon */}
            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <LogOut size={26} className="text-red-500" />
            </div>

            <h3 className="text-lg font-bold text-gray-800 text-center">Logging out?</h3>
            <p className="text-sm text-gray-500 text-center mt-1 mb-6">
              Are you sure you want to log out of your account?
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => { setShowLogoutConfirm(false); logout(); }}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold text-sm transition-colors"
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
