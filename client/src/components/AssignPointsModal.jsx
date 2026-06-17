import { useState } from 'react';
import { assignPoints, getPointHistory } from '../utils/api';
import { Award, X, Clock, CheckCircle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import Avatar from './Avatar';

const CATEGORIES = [
  { label: 'General', icon: '⭐', color: 'bg-gray-100 text-gray-700 border-gray-300' },
  { label: 'Performance', icon: '🚀', color: 'bg-blue-50 text-blue-700 border-blue-300' },
  { label: 'Teamwork', icon: '🤝', color: 'bg-green-50 text-green-700 border-green-300' },
  { label: 'Innovation', icon: '💡', color: 'bg-yellow-50 text-yellow-700 border-yellow-300' },
  { label: 'Leadership', icon: '👑', color: 'bg-purple-50 text-purple-700 border-purple-300' },
  { label: 'Punctuality', icon: '⏰', color: 'bg-teal-50 text-teal-700 border-teal-300' },
  { label: 'Extra Mile', icon: '🔥', color: 'bg-orange-50 text-orange-700 border-orange-300' },
];

const QUICK_POINTS = [10, 25, 50, 100, 200];

const categoryColor = (cat) => {
  const found = CATEGORIES.find(c => c.label === cat);
  return found ? found.color : 'bg-gray-100 text-gray-700 border-gray-300';
};

const categoryIcon = (cat) => {
  const found = CATEGORIES.find(c => c.label === cat);
  return found ? found.icon : '⭐';
};

const AssignPointsModal = ({ employee, onClose, onSuccess, assigner }) => {
  const [points, setPoints] = useState('');
  const [category, setCategory] = useState('General');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState(null);
  const [history, setHistory] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const handleQuickPoints = (val) => setPoints(String(val));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const pts = parseInt(points, 10);
    if (!pts || pts <= 0) return;

    setSubmitting(true);
    setStatus(null);
    try {
      await assignPoints(employee._id, { points: pts, category, note });
      setStatus({ type: 'success', text: `✅ ${pts} pts awarded to ${employee.name}!` });
      setPoints('');
      setNote('');
      setCategory('General');
      if (onSuccess) onSuccess();
      // Refresh history if visible
      if (showHistory) loadHistory();
    } catch (err) {
      setStatus({ type: 'error', text: err.response?.data?.message || 'Failed to assign points' });
    } finally {
      setSubmitting(false);
    }
  };

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await getPointHistory(employee._id);
      setHistory(res.data);
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const toggleHistory = () => {
    if (!showHistory && !history) loadHistory();
    setShowHistory(!showHistory);
  };

  const pts = parseInt(points, 10);
  const isValid = pts > 0 && pts <= 1000;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-400 p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar name={employee.name} size="sm" />
            <div>
              <p className="text-white font-bold text-lg leading-tight">{employee.name}</p>
              <p className="text-amber-100 text-sm">{employee.department} · {employee.points} pts total</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
            <X size={22} />
          </button>
        </div>

        <div className="p-5">
          {/* Status message */}
          {status && (
            <div className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium mb-4
              ${status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {status.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
              {status.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Quick point buttons */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Quick Select</label>
              <div className="flex gap-2 flex-wrap">
                {QUICK_POINTS.map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleQuickPoints(val)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-all
                      ${parseInt(points) === val
                        ? 'bg-amber-500 text-white border-amber-500'
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-amber-400 hover:text-amber-600'
                      }`}
                  >
                    +{val}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom points input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Points <span className="text-gray-400 font-normal">(1 – 1000)</span>
              </label>
              <div className="relative">
                <Award className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-400" size={18} />
                <input
                  type="number"
                  value={points}
                  onChange={(e) => setPoints(e.target.value)}
                  min="1"
                  max="1000"
                  required
                  placeholder="Enter points..."
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 text-lg font-bold
                    ${pts > 1000 ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                />
              </div>
              {pts > 1000 && <p className="text-red-500 text-xs mt-1">Max 1000 points per assignment</p>}
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
              <div className="grid grid-cols-4 gap-2">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.label}
                    type="button"
                    onClick={() => setCategory(cat.label)}
                    className={`flex flex-col items-center gap-1 px-2 py-2 rounded-lg border text-xs font-medium transition-all
                      ${category === cat.label ? cat.color + ' ring-2 ring-offset-1 ring-current' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}
                  >
                    <span className="text-lg">{cat.icon}</span>
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Note */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Reason <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows="2"
                placeholder="e.g. Excellent work on the Q3 report..."
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm resize-none"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={!isValid || submitting}
              className="w-full py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all text-base flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Assigning...
                </>
              ) : (
                <>
                  <Award size={18} />
                  Assign {pts > 0 && pts <= 1000 ? pts : ''} Points
                </>
              )}
            </button>
          </form>

          {/* Point History Toggle */}
          <div className="mt-5 border-t border-gray-100 pt-4">
            <button
              onClick={toggleHistory}
              className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-800 transition-colors w-full"
            >
              <Clock size={16} />
              Point History
              {showHistory ? <ChevronUp size={16} className="ml-auto" /> : <ChevronDown size={16} className="ml-auto" />}
            </button>

            {showHistory && (
              <div className="mt-3 max-h-52 overflow-y-auto space-y-2">
                {historyLoading ? (
                  <p className="text-sm text-gray-400 text-center py-4">Loading...</p>
                ) : history?.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">No history yet</p>
                ) : (
                  history?.map((entry) => (
                    <div key={entry._id} className="flex items-start gap-3 bg-gray-50 rounded-lg px-3 py-2">
                      <span className="text-base mt-0.5">{categoryIcon(entry.category)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-amber-600">+{entry.points} pts</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${categoryColor(entry.category)}`}>
                            {entry.category}
                          </span>
                        </div>
                        {entry.note && <p className="text-xs text-gray-500 mt-0.5 truncate">{entry.note}</p>}
                        <p className="text-xs text-gray-400 mt-0.5">
                          by {entry.assignedBy?.name} · {new Date(entry.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignPointsModal;
