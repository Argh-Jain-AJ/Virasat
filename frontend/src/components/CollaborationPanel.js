import React, { useState } from 'react';
import api from '../api/api';

const ROLE_COLORS = {
  owner:  'bg-rose-500/10 border-rose-500/30 text-rose-400',
  editor: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
  viewer: 'bg-gray-500/10 border-gray-500/30 text-gray-400',
};

const initials = (email) => email?.[0]?.toUpperCase() || '?';

/**
 * CollaborationPanel
 * Props:
 *   familyId – string
 *   onActivity – callback(msg) to push to activity feed
 */
const CollaborationPanel = ({ familyId, onActivity }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('viewer');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [sending, setSending] = useState(false);

  // Local collaborator list (mock for UI — real data would come from API)
  const [collaborators, setCollaborators] = useState([
    { id: 'me', email: 'you@family.app', role: 'owner', isYou: true },
  ]);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!familyId) { setStatus({ type: 'error', message: 'No family context selected.' }); return; }
    setSending(true);
    setStatus({ type: '', message: '' });
    try {
      await api.post('/families/invite', { family_id: familyId, email, role });
      setStatus({ type: 'success', message: `Invite sent to ${email}!` });
      setCollaborators(prev => [...prev, { id: email, email, role, isYou: false }]);
      if (onActivity) onActivity(`Invited ${email} as ${role}`);
      setEmail('');
      setRole('viewer');
    } catch (err) {
      setStatus({ type: 'error', message: err.response?.data?.message || 'Failed to send invite.' });
    } finally { setSending(false); }
  };

  const handleRoleChange = (id, newRole) => {
    setCollaborators(prev => prev.map(c => c.id === id ? { ...c, role: newRole } : c));
  };

  const handleRemove = (id) => {
    setCollaborators(prev => prev.filter(c => c.id !== id));
  };

  const inputCls = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-rose-500 text-sm transition-all";

  return (
    <div className="space-y-5">
      {/* Collaborator list */}
      <div className="space-y-2">
        {collaborators.map(c => (
          <div key={c.id} className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 hover:border-white/15 rounded-xl transition-all group">
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 font-black text-sm flex-shrink-0">
              {initials(c.email)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">
                {c.email}
                {c.isYou && <span className="ml-1.5 text-[10px] text-gray-500 font-normal">(You)</span>}
              </p>
            </div>
            {c.isYou ? (
              <span className={`text-[10px] font-bold px-2 py-1 rounded-lg border uppercase tracking-widest ${ROLE_COLORS[c.role]}`}>
                {c.role}
              </span>
            ) : (
              <div className="flex items-center gap-2">
                <select
                  value={c.role}
                  onChange={e => handleRoleChange(c.id, e.target.value)}
                  className="bg-black/50 border border-white/10 rounded-lg px-2 py-1 text-gray-300 text-xs focus:outline-none focus:border-rose-500 cursor-pointer"
                >
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                  <option value="owner">Owner</option>
                </select>
                <button
                  onClick={() => handleRemove(c.id)}
                  className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-rose-400 transition-all text-xs"
                  title="Remove"
                >✕</button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-white/5" />
        <span className="text-gray-600 text-[10px] uppercase tracking-widest font-bold">Invite</span>
        <div className="flex-1 h-px bg-white/5" />
      </div>

      {/* Invite form */}
      <form onSubmit={handleInvite} className="space-y-3">
        <input
          type="email"
          placeholder="Collaborator's email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className={inputCls}
          required
        />
        <div className="flex gap-3">
          <select
            value={role}
            onChange={e => setRole(e.target.value)}
            className={`${inputCls} flex-1 cursor-pointer`}
          >
            <option value="viewer">👁️ Viewer</option>
            <option value="editor">✏️ Editor</option>
            <option value="owner">👑 Owner</option>
          </select>
          <button
            type="submit"
            disabled={sending || !email}
            className="px-5 py-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 font-bold text-sm rounded-xl hover:bg-rose-500 hover:text-white transition-all disabled:opacity-40 flex-shrink-0"
          >
            {sending ? '…' : 'Send'}
          </button>
        </div>
        {status.message && (
          <p className={`text-xs font-medium ${status.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
            {status.type === 'success' ? '✅' : '⚠️'} {status.message}
          </p>
        )}
      </form>
    </div>
  );
};

export default CollaborationPanel;
