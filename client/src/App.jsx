import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
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
        <header className="lg:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-primary">EMS</h1>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
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
