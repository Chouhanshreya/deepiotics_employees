import { useState } from 'react';
import { assignPoints, getPointHistory } from '../utils/api';
import { Award, X, Clock, CheckCircle, AlertCircle, ChevronDown, ChevronUp, TrendingUp, TrendingDown } from 'lucide-react';
import Avatar from './Avatar';

const POSITIVE_CATEGORIES = [
  { label: 'Quality of Work',          icon: '⭐', desc: 'High quality output and attention to detail' },
  { label: 'Timely Delivery',          icon: '⏰', desc: 'Delivered work on time or ahead of schedule' },
  { label: 'Client Feedback',          icon: '💬', desc: 'Positive feedback received from client' },
  { label: 'Communication & Reporting',icon: '📊', desc: 'Clear, proactive communication and reporting' },
  { label: 'Complaint History',        icon: '✅', desc: 'Clean record with no complaints' },
  { label: 'Problem Solving',          icon: '🧠', desc: 'Identified and resolved a complex issue independently' },
  { label: 'Initiative & Ownership',   icon: '🙋', desc: 'Took ownership beyond assigned responsibilities' },
  { label: 'Knowledge Sharing',        icon: '📚', desc: 'Helped teammates or shared useful knowledge' },
  { label: 'Process Improvement',      icon: '🔧', desc: 'Suggested or implemented a workflow improvement' },
  { label: 'Consistency & Reliability',icon: '🔒', desc: 'Consistently dependable across tasks and deadlines' },
  { label: 'Positive Attitude',        icon: '😊', desc: 'Maintained a constructive and motivating attitude' },
  { label: 'Extra Effort',             icon: '🔥', desc: 'Went above and beyond on a task or project' },
  { label: 'Mentorship',               icon: '🎓', desc: 'Supported or mentored a junior team member' },
  { label: 'General',                  icon: '🏅', desc: 'General recognition' },
];

const TL_POSITIVE_CATEGORIES = [
  { label: 'Team Delivery Performance',   icon: '🚀', desc: 'Team consistently delivers on time' },
  { label: 'Team Quality Performance',    icon: '⭐', desc: 'Team maintains high quality output' },
  { label: 'Client Satisfaction',         icon: '💬', desc: 'Clients are satisfied with team results' },
  { label: 'Team Management & Reporting', icon: '📊', desc: 'Effective team management and reporting' },
  { label: 'Low Team Complaint Rate',     icon: '✅', desc: 'Team has minimal client complaints' },
  { label: 'Team Morale & Culture',       icon: '🤝', desc: 'Fostered a positive and collaborative team environment' },
  { label: 'Proactive Risk Management',   icon: '🛡️', desc: 'Identified and mitigated risks before escalation' },
  { label: 'Process Improvement',         icon: '🔧', desc: 'Introduced improvements to team workflow or processes' },
  { label: 'Cross-Team Collaboration',    icon: '🔗', desc: 'Successfully collaborated with other teams or departments' },
  { label: 'Team Skill Development',      icon: '🎓', desc: 'Actively coached or upskilled team members' },
  { label: 'Stakeholder Communication',   icon: '📣', desc: 'Clear and timely communication with stakeholders' },
  { label: 'Consistent Team Output',      icon: '🔒', desc: 'Team maintained steady performance over the period' },
  { label: 'Innovation & Initiative',     icon: '💡', desc: 'Drove innovative ideas or new initiatives within the team' },
  { label: 'General',                     icon: '🏅', desc: 'General recognition' },
];

const NEGATIVE_CATEGORIES = [
  { label: 'Client Complaint',         icon: '⚠️', desc: 'Client raised a complaint regarding quality' },
  { label: 'Delayed Delivery',         icon: '🕐', desc: 'Delivery delayed without prior approval' },
  { label: 'Poor Communication',       icon: '📵', desc: 'Poor communication with client or PM' },
  { label: 'No Updates Provided',      icon: '🔕', desc: 'Failed to provide updates when requested' },
  { label: 'Incomplete Work',          icon: '📋', desc: 'Submitted incomplete work' },
  { label: 'Repeated Mistakes',        icon: '🔁', desc: 'Repeated mistakes in formatting/documentation' },
  { label: 'Client Comments Ignored',  icon: '🚫', desc: 'Failed to address client comments properly' },
  { label: 'Client Escalation',        icon: '🔺', desc: 'Issue escalated to higher management' },
];

const TL_NEGATIVE_CATEGORIES = [
  { label: 'Team Client Complaint',        icon: '⚠️', desc: 'Client complaint regarding quality from team' },
  { label: 'Team Delayed Delivery',        icon: '🕐', desc: 'Team delayed delivery without prior approval' },
  { label: 'Team Poor Communication',      icon: '📵', desc: 'Poor communication with client or PM by team' },
  { label: 'Team No Updates Provided',     icon: '🔕', desc: 'Team failed to provide updates when requested' },
  { label: 'Team Incomplete Work',         icon: '📋', desc: 'Team submitted incomplete work' },
  { label: 'Team Repeated Mistakes',       icon: '🔁', desc: 'Repeated mistakes in formatting/documentation' },
  { label: 'Team Client Comments Ignored', icon: '🚫', desc: 'Team failed to address client comments properly' },
  { label: 'Team Client Escalation',       icon: '🔺', desc: 'Client escalation to higher management' },
];



const AssignPointsModal = ({ employee, onClose, onSuccess }) => {
  const [type, setType] = useState('positive'); // 'positive' | 'negative'
  const [points, setPoints] = useState('');
  const [category, setCategory] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState(null);
  const [history, setHistory] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const isTLRecipient = employee.role === 'TL';
  const categories = type === 'positive'
    ? (isTLRecipient ? TL_POSITIVE_CATEGORIES : POSITIVE_CATEGORIES)
    : NEGATIVE_CATEGORIES;

  const handleTypeSwitch = (newType) => {
    setType(newType);
    setPoints('');
    setCategory('');
  };

const handleSubmit = async (e) => {
    e.preventDefault();
    const absPoints = parseInt(points, 10);
    if (!absPoints || absPoints <= 0) return;

    const finalPoints = type === 'negative' ? -absPoints : absPoints;

    setSubmitting(true);
    setStatus(null);
    try {
      await assignPoints(employee._id, { points: finalPoints, category: category || 'General', note });
      setStatus({
        type: 'success',
        text: `${type === 'positive' ? '✅' : '⚠️'} ${Math.abs(finalPoints)} pts ${type === 'positive' ? 'awarded to' : 'deducted from'} ${employee.name}`
      });
      setPoints('');
      setNote('');
      setCategory('');
      if (onSuccess) onSuccess();
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
  const isValid = pts > 0 && pts <= 1000 && category !== '';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className={`p-5 flex items-center justify-between ${type === 'positive' ? 'bg-gradient-to-r from-amber-500 to-orange-400' : 'bg-gradient-to-r from-red-500 to-rose-500'}`}>
          <div className="flex items-center gap-3">
            <Avatar name={employee.name} size="sm" />
            <div>
              <p className="text-white font-bold text-lg leading-tight">{employee.name}</p>
              <p className="text-white/70 text-sm">{employee.department} · {employee.points} pts current
                {isTLRecipient && <span className="ml-2 bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold">TL</span>}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
            <X size={22} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1">

          {/* Status */}
          {status && (
            <div className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium mb-4
              ${status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {status.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
              {status.text}
            </div>
          )}

          {/* Positive / Negative Toggle */}
          <div className="flex gap-2 mb-5">
            <button
              type="button"
              onClick={() => handleTypeSwitch('positive')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all border-2
                ${type === 'positive' ? 'bg-amber-500 text-white border-amber-500 shadow-md' : 'bg-white text-gray-500 border-gray-200 hover:border-amber-300'}`}
            >
              <TrendingUp size={16} /> Positive Points
            </button>
            <button
              type="button"
              onClick={() => handleTypeSwitch('negative')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all border-2
                ${type === 'negative' ? 'bg-red-500 text-white border-red-500 shadow-md' : 'bg-white text-gray-500 border-gray-200 hover:border-red-300'}`}
            >
              <TrendingDown size={16} /> Deduct Points
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Category selection */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                {type === 'positive'
                  ? (isTLRecipient ? '✅ TL Performance Factor' : '✅ Positive Factor')
                  : '⚠️ Negative Factor'}
                <span className="text-red-400 ml-1">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                {categories.map(cat => (
                  <button
                    key={cat.label}
                    type="button"
                    title={cat.desc}
                    onClick={() => setCategory(cat.label)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-left transition-all text-sm
                      ${category === cat.label
                        ? type === 'positive'
                          ? 'bg-amber-50 border-amber-400 text-amber-800 ring-2 ring-amber-200'
                          : 'bg-red-50 border-red-400 text-red-800 ring-2 ring-red-200'
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-gray-300'
                      }`}
                  >
                    <span className="text-base shrink-0">{cat.icon}</span>
                    <p className="font-semibold leading-tight">{cat.label}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Points input */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Points (1–1000)<span className="text-red-400 ml-1">*</span>
              </label>
              <div className="relative">
                <span className={`absolute left-3 top-1/2 -translate-y-1/2 font-black text-lg ${type === 'negative' ? 'text-red-400' : 'text-amber-400'}`}>
                  {type === 'negative' ? '−' : '+'}
                </span>
                <input
                  type="number"
                  value={points}
                  onChange={e => setPoints(e.target.value)}
                  min="1"
                  max="1000"
                  required
                  placeholder="Enter points..."
                  className={`w-full pl-8 pr-4 py-2.5 border-2 rounded-xl focus:outline-none text-lg font-bold
                    ${pts > 1000 ? 'border-red-400 bg-red-50' : type === 'negative' ? 'border-red-200 focus:border-red-400' : 'border-amber-200 focus:border-amber-400'}`}
                />
              </div>
              {pts > 1000 && <p className="text-red-500 text-xs mt-1">Max 1000 points</p>}
            </div>

            {/* Note */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Note / Reason <span className="text-gray-400 font-normal">(optional)</span></label>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                rows="2"
                placeholder="Add specific details..."
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm resize-none"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={!isValid || submitting}
              className={`w-full py-3 disabled:bg-gray-200 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all text-base flex items-center justify-center gap-2
                ${type === 'positive' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-red-500 hover:bg-red-600'}`}
            >
              {submitting ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Processing...</>
              ) : (
                <>{type === 'positive' ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                  {type === 'positive' ? `Award +${pts > 0 ? pts : '?'} Points` : `Deduct -${pts > 0 ? pts : '?'} Points`}
                </>
              )}
            </button>
          </form>

          {/* History */}
          <div className="mt-5 border-t border-gray-100 pt-4">
            <button
              onClick={toggleHistory}
              className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-800 transition-colors w-full"
            >
              <Clock size={16} /> Point History
              {showHistory ? <ChevronUp size={16} className="ml-auto" /> : <ChevronDown size={16} className="ml-auto" />}
            </button>

            {showHistory && (
              <div className="mt-3 max-h-52 overflow-y-auto space-y-2">
                {historyLoading ? (
                  <p className="text-sm text-gray-400 text-center py-4">Loading...</p>
                ) : history?.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">No history yet</p>
                ) : (
                  history?.map(entry => (
                    <div key={entry._id} className={`flex items-start gap-3 rounded-lg px-3 py-2 ${entry.points < 0 ? 'bg-red-50' : 'bg-gray-50'}`}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold text-sm ${entry.points < 0 ? 'text-red-600' : 'text-amber-600'}`}>
                            {entry.points > 0 ? '+' : ''}{entry.points} pts
                          </span>
                          <span className="text-xs bg-white border border-gray-200 px-2 py-0.5 rounded-full text-gray-600">
                            {entry.category}
                          </span>
                        </div>
                        {entry.note && <p className="text-xs text-gray-500 mt-0.5 truncate">"{entry.note}"</p>}
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
