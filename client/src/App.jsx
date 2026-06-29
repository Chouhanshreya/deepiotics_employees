import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DepartmentProvider, useDepartment, DEPARTMENTS } from './context/DepartmentContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

// Employee Pages
import EmployeeHome from './pages/employee/Home';
import Profile from './pages/employee/Profile';
import Leaderboard from './pages/employee/Leaderboard';
import Team from './pages/employee/Team';
import Stats from './pages/employee/Stats';

// Admin/TL Pages
import Overview from './pages/admin/Overview';
import Employees from './pages/admin/Employees';
import CreateEmployee from './pages/admin/CreateEmployee';
import EditEmployee from './pages/admin/EditEmployee';
import Analytics from './pages/admin/Analytics';
import Settings from './pages/admin/Settings';
import PointManagement from './pages/admin/PointManagement';
import MonthlyHistory from './pages/admin/MonthlyHistory';

import SessionTest from './pages/SessionTest';

// Department toggle pill — only shown to Admin
function DeptToggle() {
  const { isAdmin } = useAuth();
  const { activeDept, setActiveDept } = useDepartment();

  if (!isAdmin) return null;

  const colors = {
    'All':         { active: 'bg-gray-800 text-white border-gray-800',         base: 'text-gray-500 border-gray-200' },
    'R&D':         { active: 'bg-indigo-600 text-white border-indigo-600',      base: 'text-indigo-500 border-indigo-200' },
    'Development': { active: 'bg-emerald-600 text-white border-emerald-600',    base: 'text-emerald-600 border-emerald-200' },
  };

  const labels = { 'All': '🌐 All', 'R&D': '🔬 R&D', 'Development': '💻 Dev' };

  return (
    <div className="flex items-center gap-1.5">
      {DEPARTMENTS.map(dept => (
        <button
          key={dept}
          onClick={() => setActiveDept(dept)}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all
            ${activeDept === dept ? colors[dept].active : `bg-white ${colors[dept].base} hover:border-gray-400`}`}
        >
          {labels[dept]}
        </button>
      ))}
    </div>
  );
}

function AppLayout({ children }) {
  const { isAuthenticated } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!isAuthenticated) {
    return children;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      
      <div className="flex-1 flex flex-col lg:ml-64">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between gap-3">
          <h1 className="text-xl font-bold text-primary shrink-0">EMS</h1>
          {/* Department toggle in mobile header */}
          <DeptToggle />
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg shrink-0"
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </header>

        {/* Desktop Header bar — shows dept toggle when admin */}
        <header className="hidden lg:flex bg-white border-b border-gray-200 px-6 py-3 items-center justify-between">
          <DeptToggle />
          <span /> {/* spacer */}
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <DepartmentProvider>
        <Router>
          <AppLayout>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/session-test" element={<SessionTest />} />

            {/* Employee & TL Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <RouteByRole />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute allowedRoles={['Employee', 'TL']}>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile/:id"
              element={
                <ProtectedRoute allowedRoles={['Employee', 'TL', 'Admin']}>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/leaderboard"
              element={
                <ProtectedRoute allowedRoles={['Employee', 'TL', 'Admin']}>
                  <Leaderboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/team"
              element={
                <ProtectedRoute allowedRoles={['Employee', 'TL']}>
                  <Team />
                </ProtectedRoute>
              }
            />
            <Route
              path="/stats"
              element={
                <ProtectedRoute allowedRoles={['Employee', 'TL']}>
                  <Stats />
                </ProtectedRoute>
              }
            />

            {/* Admin/TL Routes */}
            <Route
              path="/employees"
              element={
                <ProtectedRoute allowedRoles={['Admin', 'TL']}>
                  <Employees />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employees/:id/edit"
              element={
                <ProtectedRoute allowedRoles={['Admin']}>
                  <EditEmployee />
                </ProtectedRoute>
              }
            />
            <Route
              path="/create-employee"
              element={
                <ProtectedRoute allowedRoles={['Admin', 'TL']}>
                  <CreateEmployee />
                </ProtectedRoute>
              }
            />
            <Route
              path="/point-management"
              element={
                <ProtectedRoute allowedRoles={['Admin', 'TL']}>
                  <PointManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <ProtectedRoute allowedRoles={['Admin', 'TL']}>
                  <Analytics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/monthly-history"
              element={
                <ProtectedRoute allowedRoles={['Admin', 'TL']}>
                  <MonthlyHistory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute allowedRoles={['Admin', 'TL']}>
                  <Settings />
                </ProtectedRoute>
              }
            />

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppLayout>
      </Router>
      </DepartmentProvider>
    </AuthProvider>
  );
}

function RouteByRole() {
  const { user } = useAuth();
  
  // Employees and Team Leads see employee home page
  if (user?.role === 'Employee' || user?.role === 'TL') {
    return <EmployeeHome />;
  }
  
  // Admin sees overview
  return <Overview />;
}

export default App;
