import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const result = await login(formData);
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex overflow-hidden">

      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-primary via-indigo-600 to-secondary flex-col items-center justify-center p-12 overflow-hidden">
        {/* Animated blobs */}
        <div className="absolute w-96 h-96 bg-white/10 rounded-full -top-20 -left-20 animate-pulse" />
        <div className="absolute w-64 h-64 bg-white/10 rounded-full bottom-10 -right-10 animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute w-48 h-48 bg-white/5 rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-ping" style={{ animationDuration: '4s' }} />

        {/* Content */}
        <div className="relative z-10 text-center">
          {/* Logo */}
          <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-2xl border border-white/30">
            <span className="text-4xl font-black text-white">D</span>
          </div>

          <h1 className="text-4xl font-black text-white mb-4 leading-tight">
            Deepiotics<br />Employee Portal
          </h1>
          <p className="text-white/70 text-lg leading-relaxed max-w-sm">
            Track performance, recognize achievements, and celebrate your team's success.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-3 justify-center mt-10">
            {['🏆 Leaderboard', '📊 Analytics', '🎯 Points System', '👑 Recognition'].map(f => (
              <span key={f} className="bg-white/15 backdrop-blur-sm text-white text-xs font-semibold px-4 py-2 rounded-full border border-white/20">
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Floating cards */}
        <div className="absolute bottom-24 left-8 bg-white/15 backdrop-blur-sm border border-white/20 rounded-2xl p-4 animate-bounce" style={{ animationDuration: '3s' }}>
          <p className="text-white text-xs font-semibold">🥇 Top Performer</p>
          <p className="text-white/70 text-xs mt-1">Bob Wilson · 145 pts</p>
        </div>
        <div className="absolute top-24 right-8 bg-white/15 backdrop-blur-sm border border-white/20 rounded-2xl p-4 animate-bounce" style={{ animationDuration: '3.5s', animationDelay: '0.5s' }}>
          <p className="text-white text-xs font-semibold">📈 This Month</p>
          <p className="text-white/70 text-xs mt-1">+1,200 points awarded</p>
        </div>
      </div>

      {/* Right login panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
              <span className="text-2xl font-black text-white">D</span>
            </div>
            <p className="text-gray-500 text-sm">Deepiotics Employee Portal</p>
          </div>

          {/* Card */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">

            <div className="mb-8">
              <h2 className="text-3xl font-black text-gray-900">Welcome back 👋</h2>
              <p className="text-gray-400 text-sm mt-2">Sign in to your account to continue</p>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-6 text-sm flex items-center gap-2">
                <span className="text-base">⚠️</span> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="you@deepiotics.com"
                    className="w-full pl-11 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary transition-colors text-sm"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    placeholder="Enter your password"
                    className="w-full pl-11 pr-12 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary transition-colors text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-primary to-secondary text-white py-3.5 rounded-xl font-bold text-base hover:opacity-90 transition-all shadow-lg shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <p className="text-center text-xs text-gray-400 mt-8">
              © 2026 Deepiotics Pvt. Ltd. · Employee Management System
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
