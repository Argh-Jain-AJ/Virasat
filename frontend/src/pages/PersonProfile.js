import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../api/api';
import MemoryTimeline from '../components/MemoryTimeline';
import LegacySection from '../components/LegacySection';
import {
  deletePerson,
  updatePerson,
  deleteRelationship,
  updateRelationship,
} from '../services/familyService';

// ─────────────────────────────────────────────────────
// UTILITY
// ─────────────────────────────────────────────────────

const calcAge = (birthDate, deathDate) => {
  if (!birthDate) return null;
  const end = deathDate ? new Date(deathDate) : new Date();
  const start = new Date(birthDate);
  return Math.floor((end - start) / (365.25 * 24 * 3600 * 1000));
};

// ─────────────────────────────────────────────────────
// AVATAR
// ─────────────────────────────────────────────────────
const Avatar = ({ photoUrl, name, size = 'md', glow = false, onClick }) => {
  const sizes = {
    xs: 'w-8 h-8 text-xs rounded-xl',
    sm: 'w-10 h-10 text-sm rounded-xl',
    md: 'w-14 h-14 text-lg rounded-2xl',
    lg: 'w-36 h-36 text-5xl rounded-3xl',
  };
  return (
    <div
      onClick={onClick}
      className={`${sizes[size]} flex-shrink-0 flex items-center justify-center font-black select-none
        bg-white/5 border border-white/10 bg-cover bg-center transition-all duration-300
        ${glow ? 'shadow-[0_0_40px_rgba(225,29,72,0.3)]' : ''}
        ${onClick ? 'cursor-pointer hover:border-rose-500/50 hover:scale-105' : ''}`}
      style={{ backgroundImage: photoUrl ? `url(${photoUrl})` : 'none' }}
    >
      {!photoUrl && <span className="text-rose-400">{name?.[0]?.toUpperCase() || '?'}</span>}
    </div>
  );
};

// Uploadable version — shows camera overlay on hover
const UploadableAvatar = ({ photoUrl, name, size = 'lg', glow = false, personId, onUploaded, editable = false }) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview]     = useState(null);
  const fileRef = useRef();

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Local preview immediately
    const objUrl = URL.createObjectURL(file);
    setPreview(objUrl);
    setUploading(true);
    try {
      const token = localStorage.getItem('token');
      const fd = new FormData();
      fd.append('photo', file);
      const res = await fetch(`http://localhost:5001/api/persons/${personId}/photo`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (data.photo_url) onUploaded?.(data.photo_url);
      else throw new Error(data.error || 'Upload failed');
    } catch (err) {
      console.error('Upload error:', err);
      setPreview(null); // revert on error
    } finally {
      setUploading(false);
    }
  };

  const displayUrl = preview || photoUrl;
  const sizes = {
    md: 'w-14 h-14 text-lg rounded-2xl',
    lg: 'w-36 h-36 text-5xl rounded-3xl',
  };

  return (
    <div className={`relative flex-shrink-0 group ${editable ? 'cursor-pointer' : ''}`}
      onClick={() => editable && fileRef.current?.click()}>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      <div
        className={`${sizes[size] || sizes.lg} flex items-center justify-center font-black select-none
          bg-white/5 border border-white/10 bg-cover bg-center transition-all duration-300
          ${glow ? 'shadow-[0_0_40px_rgba(225,29,72,0.3)]' : ''}
          ${editable ? 'group-hover:border-rose-500/50' : ''}`}
        style={{ backgroundImage: displayUrl ? `url(${displayUrl})` : 'none' }}
      >
        {!displayUrl && <span className="text-rose-400">{name?.[0]?.toUpperCase() || '?'}</span>}
      </div>
      {/* Camera overlay */}
      {editable && (
        <div className={`absolute inset-0 ${sizes[size] || sizes.lg} flex flex-col items-center justify-center
          bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-200
          ${uploading ? 'opacity-100' : ''}`}>
          {uploading ? (
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <span className="text-2xl">📸</span>
              <span className="text-white text-[9px] font-bold mt-1 uppercase tracking-wider">Change Photo</span>
            </>
          )}
        </div>
      )}
    </div>
  );
};


// ─────────────────────────────────────────────────────
// CHIP
// ─────────────────────────────────────────────────────
const Chip = ({ label, value, icon, color }) => {
  if (!value) return null;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium uppercase tracking-wider
      ${color || 'bg-white/5 border border-white/10 text-gray-300'}`}>
      {icon && <span>{icon}</span>}
      {label && <span className="text-gray-500 mr-0.5">{label}:</span>}
      {value}
    </span>
  );
};

// ─────────────────────────────────────────────────────
// FEATURE 8: BREADCRUMB NAV
// ─────────────────────────────────────────────────────
const BreadcrumbNav = ({ personName }) => {
  const navigate = useNavigate();
  const crumbs = [
    { label: '🏠 Home', action: () => navigate('/dashboard') },
    { label: 'Family Tree', action: () => navigate('/family-tree') },
    { label: personName || 'Profile' },
  ];
  return (
    <nav className="flex items-center gap-2 text-xs text-gray-500 font-medium">
      {crumbs.map((c, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span className="text-gray-700">›</span>}
          {c.action ? (
            <button onClick={c.action} className="hover:text-white transition-colors">{c.label}</button>
          ) : (
            <span className="text-gray-300">{c.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

// ─────────────────────────────────────────────────────
// FEATURE 9: INLINE EDITABLE FIELD
// ─────────────────────────────────────────────────────
const InlineEditField = ({ value, onSave, placeholder = 'Click to edit…', multiline = false, className = '' }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || '');
  const ref = useRef();

  const commit = () => {
    setEditing(false);
    if (draft !== value) onSave(draft);
  };

  useEffect(() => {
    if (editing && ref.current) ref.current.focus();
  }, [editing]);

  const baseInput = "bg-transparent border-0 border-b border-rose-500 outline-none text-white w-full resize-none py-0.5";

  return (
    <span className={`group relative cursor-text ${className}`} onClick={() => !editing && setEditing(true)}>
      {editing ? (
        multiline ? (
          <textarea
            ref={ref}
            value={draft}
            rows={4}
            onChange={e => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={e => e.key === 'Escape' && setEditing(false)}
            className={`${baseInput} block w-full text-sm leading-relaxed`}
          />
        ) : (
          <input
            ref={ref}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
            className={`${baseInput} inline`}
          />
        )
      ) : (
        <span className={`border-b border-transparent group-hover:border-white/30 transition-colors ${!value ? 'text-gray-600 italic text-sm' : ''}`}>
          {value || placeholder}
          <span className="ml-1.5 text-[10px] text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">✏️</span>
        </span>
      )}
    </span>
  );
};

// ─────────────────────────────────────────────────────
// COUNT-UP HOOK
// ─────────────────────────────────────────────────────
const useCountUp = (target, duration = 1000) => {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (typeof target !== 'number') return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setVal(target); clearInterval(timer); }
      else setVal(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return val;
};

// ─────────────────────────────────────────────────────
// INSIGHTS PANEL (count-up + tooltips)
// ─────────────────────────────────────────────────────
const StatCard = ({ icon, label, numericVal, displayVal, color, tooltip }) => {
  const counted = useCountUp(numericVal);
  return (
    <div className="relative group bg-white/5 hover:bg-white/[0.08] border border-white/10 hover:border-rose-500/20 rounded-2xl p-4 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)] cursor-default">
      <div className="text-2xl mb-1 group-hover:scale-110 transition-transform duration-300">{icon}</div>
      <div className={`text-2xl font-black ${color}`}>
        {numericVal !== null ? (typeof numericVal === 'number' ? counted : displayVal) : displayVal}
      </div>
      <div className="text-xs text-gray-500 uppercase tracking-widest mt-0.5">{label}</div>
      {tooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-36 px-2 py-1.5 bg-black border border-white/10 text-gray-300 text-[10px] rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-20 text-center">
          {tooltip}
        </div>
      )}
    </div>
  );
};

const InsightsPanel = ({ memories, relationships, person }) => {
  const age = calcAge(person?.birth_date, person?.death_date);
  const stats = [
    { icon: '📖', label: 'Memories', numericVal: memories.length, displayVal: memories.length, color: 'text-blue-400', tooltip: 'Total recorded life memories' },
    { icon: '🔗', label: 'Connections', numericVal: relationships.length, displayVal: relationships.length, color: 'text-rose-400', tooltip: 'Linked family members' },
    { icon: '⏳', label: person?.death_date ? 'Lived' : 'Age', numericVal: age, displayVal: age !== null ? `${age} yrs` : '—', color: 'text-amber-400', tooltip: 'Calculated from date of birth' },
    { icon: '📅', label: 'Decade', numericVal: null, displayVal: person?.birth_date ? `${Math.floor(new Date(person.birth_date).getFullYear() / 10) * 10}s` : '—', color: 'text-emerald-400', tooltip: 'Birth era / decade' },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {stats.map(s => <StatCard key={s.label} {...s} />)}
    </div>
  );
};

// ─────────────────────────────────────────────────────
// PROFILE STRENGTH BAR
// ─────────────────────────────────────────────────────
const ProfileStrengthBar = ({ person, memories, relationships }) => {
  const checks = [
    { label: 'Photo', done: !!person?.photo_url },
    { label: 'Bio', done: !!person?.bio },
    { label: 'Birth date', done: !!person?.birth_date },
    { label: 'Origin', done: !!person?.birth_place },
    { label: 'Occupation', done: !!person?.occupation },
    { label: '1 Memory', done: memories.length > 0 },
    { label: '3+ Memories', done: memories.length >= 3 },
    { label: 'Family linked', done: relationships.length > 0 },
  ];
  const pct = Math.round((checks.filter(c => c.done).length / checks.length) * 100);
  const missing = checks.filter(c => !c.done).map(c => c.label);
  const barColor = pct < 40 ? '#f43f5e' : pct < 70 ? '#f59e0b' : '#10b981';
  return (
    <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-5 shadow-xl">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">📊 Profile Strength</h3>
        <span className="text-lg font-black" style={{ color: barColor }}>{pct}%</span>
      </div>
      <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden mb-3">
        <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%`, backgroundColor: barColor }} />
      </div>
      {missing.length > 0 && (
        <p className="text-gray-600 text-xs">💡 Add {missing.slice(0, 2).join(', ')} to strengthen this profile</p>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────
// STORY MODE MODAL
// ─────────────────────────────────────────────────────
const StoryModeModal = ({ person, memories, relationships, relPersons, onClose }) => {
  const [story, setStory] = useState('');
  const [loading, setLoading] = useState(false);

  const buildStory = async () => {
    setLoading(true);
    try {
      const res = await api.post('/ai/generate-biography', { person_id: person.id });
      setStory(res.data.biography || res.data.bio || '');
    } catch {
      const name = `${person.first_name} ${person.last_name || ''}`.trim();
      const origin = person.birth_place ? ` in ${person.birth_place}` : '';
      const born = person.birth_date ? ` on ${new Date(person.birth_date).toLocaleDateString('en-IN', { year:'numeric', month:'long', day:'numeric' })}` : '';
      const relDesc = Object.values(relPersons).slice(0, 2).map(p => `${p.first_name} ${p.last_name || ''}`.trim()).join(' and ');
      const memDesc = memories.length > 0 ? ` Their story holds ${memories.length} recorded chapter${memories.length > 1 ? 's' : ''} of life.` : '';
      setStory(`${name} was born${born}${origin}. ${relDesc ? `Connected to ${relDesc}, they are a cherished member of the family.` : 'They are a cherished member of the family.'}${memDesc} ${person.occupation ? `${name} dedicated their life to ${person.occupation}.` : ''}`);
    } finally { setLoading(false); }
  };

  useEffect(() => { buildStory(); }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ animation: 'fadeInUp 0.3s ease' }}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-[#0f0f0f] border border-white/10 rounded-3xl p-8 max-w-xl w-full shadow-2xl z-10">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-rose-500/60 to-transparent rounded-t-3xl" />
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-black text-white">📖 Life Story</h2>
            <p className="text-gray-500 text-xs mt-1">{person.first_name}'s narrative, auto-generated</p>
          </div>
          <button onClick={onClose} className="text-gray-600 hover:text-white transition-colors text-lg">✕</button>
        </div>
        {loading ? (
          <div className="space-y-3">
            {[90, 75, 85, 60, 80].map((w, i) => (
              <div key={i} className="h-3.5 bg-white/5 rounded animate-pulse" style={{ width: `${w}%` }} />
            ))}
          </div>
        ) : (
          <p className="text-gray-300 text-base leading-8 whitespace-pre-wrap">{story}</p>
        )}
        <div className="flex gap-3 mt-6">
          <button onClick={buildStory} disabled={loading} className="flex-1 py-2.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all disabled:opacity-40">
            🔄 Regenerate
          </button>
          <button onClick={onClose} className="py-2.5 px-5 bg-white/5 border border-white/10 text-gray-400 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-white/10 transition-all">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────
// FEATURE 7: MINI TREE PREVIEW (SVG-based, no lib needed)
// ─────────────────────────────────────────────────────
const MiniTreePreview = ({ person, relationships, relPersons, onNodeClick }) => {
  const id = person?.id;
  if (!id) return null;

  const parents = relationships
    .filter(r => {
      const t = r.relationship_type;
      return (t === 'parent' && r.person2_id === id) || (t === 'child' && r.person1_id === id);
    })
    .map(r => {
      const pid = r.person1_id === id ? r.person2_id : r.person1_id;
      return { id: pid, ...relPersons[pid] };
    }).slice(0, 3);

  const children = relationships
    .filter(r => {
      const t = r.relationship_type;
      return (t === 'child' && r.person2_id === id) || (t === 'parent' && r.person1_id === id);
    })
    .map(r => {
      const cid = r.person1_id === id ? r.person2_id : r.person1_id;
      return { id: cid, ...relPersons[cid] };
    }).slice(0, 3);

  const spouses = relationships
    .filter(r => r.relationship_type === 'spouse')
    .map(r => {
      const sid = r.person1_id === id ? r.person2_id : r.person1_id;
      return { id: sid, ...relPersons[sid] };
    }).slice(0, 2);

  const NodeCircle = ({ p, x, y, isCenter = false }) => {
    const name = p ? `${p.first_name || ''} ${p.last_name || ''}`.trim() : '?';
    const initial = name[0]?.toUpperCase() || '?';
    return (
      <g
        onClick={() => p?.id && p.id !== id && onNodeClick(p.id)}
        style={{ cursor: p?.id && p.id !== id ? 'pointer' : 'default' }}
      >
        <circle cx={x} cy={y} r={isCenter ? 28 : 22}
          fill={isCenter ? 'rgba(225,29,72,0.2)' : 'rgba(255,255,255,0.05)'}
          stroke={isCenter ? '#f43f5e' : 'rgba(255,255,255,0.15)'}
          strokeWidth={isCenter ? 2.5 : 1.5}
        />
        {isCenter && (
          <circle cx={x} cy={y} r={34} fill="none" stroke="rgba(225,29,72,0.15)" strokeWidth={1} strokeDasharray="4 3" />
        )}
        <text x={x} y={y + 5} textAnchor="middle" fontSize={isCenter ? 14 : 11}
          fill={isCenter ? '#f43f5e' : '#9ca3af'} fontWeight="bold" fontFamily="sans-serif">
          {initial}
        </text>
        {name.length > 1 && (
          <text x={x} y={y + (isCenter ? 50 : 40)} textAnchor="middle" fontSize="9"
            fill="#6b7280" fontFamily="sans-serif">
            {name.length > 12 ? name.substring(0, 12) + '…' : name}
          </text>
        )}
      </g>
    );
  };

  const W = 460, H = 260;
  const cx = W / 2, cy = H / 2;
  const parentY = 45, childY = 215;

  // Positions for up to 3 parents and 3 children
  const spread = (count, y) => Array.from({ length: count }, (_, i) => ({
    x: cx + (i - (count - 1) / 2) * 130,
    y,
  }));

  const parentPos = spread(parents.length, parentY);
  const childPos = spread(children.length, childY);
  const spousePos = [{ x: cx + 140, y: cy }, { x: cx - 140, y: cy }];

  return (
    <div className="w-full overflow-x-auto">
      <svg
        width="100%" viewBox={`0 0 ${W} ${H}`}
        className="rounded-2xl bg-black/30 border border-white/10"
        style={{ minWidth: 300 }}
      >
        {/* Lines to parents */}
        {parentPos.map((p, i) => (
          <line key={`pl-${i}`} x1={cx} y1={cy - 28} x2={p.x} y2={p.y + 22}
            stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeDasharray="4 3" />
        ))}
        {/* Lines to children */}
        {childPos.map((c, i) => (
          <line key={`cl-${i}`} x1={cx} y1={cy + 28} x2={c.x} y2={c.y - 22}
            stroke="#6b7280" strokeWidth="1.5" />
        ))}
        {/* Lines to spouses */}
        {spouses.map((_, i) => (
          <line key={`sl-${i}`} x1={cx + (i === 0 ? 28 : -28)} y1={cy} x2={spousePos[i].x + (i === 0 ? -22 : 22)} y2={spousePos[i].y}
            stroke="#f43f5e" strokeWidth="1" strokeDasharray="5 3" />
        ))}

        {/* Parent nodes */}
        {parents.map((p, i) => (
          <NodeCircle key={`p-${i}`} p={p} x={parentPos[i].x} y={parentPos[i].y} />
        ))}
        {/* Children nodes */}
        {children.map((c, i) => (
          <NodeCircle key={`c-${i}`} p={c} x={childPos[i].x} y={childPos[i].y} />
        ))}
        {/* Spouse nodes */}
        {spouses.map((s, i) => (
          <NodeCircle key={`s-${i}`} p={s} x={spousePos[i].x} y={spousePos[i].y} />
        ))}

        {/* Center (current person) */}
        <NodeCircle p={person} x={cx} y={cy} isCenter />

        {/* Labels */}
        {parents.length > 0 && (
          <text x={10} y={18} fontSize="8" fill="rgba(255,255,255,0.2)" fontFamily="sans-serif" fontWeight="bold" textDecoration="uppercase">PARENTS</text>
        )}
        {children.length > 0 && (
          <text x={10} y={H - 6} fontSize="8" fill="rgba(255,255,255,0.2)" fontFamily="sans-serif" fontWeight="bold">CHILDREN</text>
        )}
      </svg>
    </div>
  );
};

// ─────────────────────────────────────────────────────
// FEATURE 10: PRIVACY & SHARING CONTROLS
// ─────────────────────────────────────────────────────
const PrivacyControls = ({ personId, personName }) => {
  const [isPublic, setIsPublic] = useState(true);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = () => {
    const style = document.createElement('style');
    style.innerHTML = `@media print { header, nav, button, form, .no-print { display: none !important; } body { background: white !important; color: black !important; } }`;
    document.head.appendChild(style);
    window.print();
    setTimeout(() => document.head.removeChild(style), 1000);
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Privacy toggle */}
      <button
        onClick={() => setIsPublic(p => !p)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all ${
          isPublic
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
            : 'bg-gray-500/10 border-gray-500/30 text-gray-400 hover:bg-gray-500/20'
        }`}
      >
        {isPublic ? '🌐 Public' : '🔒 Private'}
      </button>
      {/* Copy link */}
      <button
        onClick={handleCopy}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 text-gray-400 hover:text-white hover:border-white/20 text-xs font-bold uppercase tracking-wider transition-all"
      >
        {copied ? '✅ Copied!' : '🔗 Copy Link'}
      </button>
      {/* Export */}
      <button
        onClick={handleExport}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 text-gray-400 hover:text-white hover:border-white/20 text-xs font-bold uppercase tracking-wider transition-all"
      >
        📄 Export PDF
      </button>
    </div>
  );
};

// ─────────────────────────────────────────────────────
// RELATIONSHIP CARDS (structured by role groups)
// ─────────────────────────────────────────────────────
const resolveRole = (type, isPerson1) => {
  if (type === 'spouse') return 'Spouse';
  if (type === 'sibling') return 'Sibling';
  if (type === 'parent') return isPerson1 ? 'Child' : 'Parent';
  if (type === 'child') return isPerson1 ? 'Parent' : 'Child';
  return type;
};

const ROLE_META = {
  Parent: { icon: '👴', color: 'border-blue-500/20 bg-blue-500/5 hover:border-blue-500/40' },
  Child:  { icon: '👶', color: 'border-emerald-500/20 bg-emerald-500/5 hover:border-emerald-500/40' },
  Spouse: { icon: '💍', color: 'border-rose-500/20 bg-rose-500/5 hover:border-rose-500/40' },
  Sibling:{ icon: '🤝', color: 'border-amber-500/20 bg-amber-500/5 hover:border-amber-500/40' },
};

const FamilyMemberCard = ({ person: other, role, onNavigate, onEdit, onDelete, relId, relType }) => {
  const meta = ROLE_META[role] || { icon: '🔗', color: 'border-white/10 bg-white/5' };
  return (
    <div
      onClick={() => onNavigate(other.id)}
      className={`group relative flex flex-col items-center gap-2 p-4 border rounded-2xl cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.4)] ${meta.color}`}
    >
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
        <button onClick={e => { e.stopPropagation(); onEdit(relId, relType); }} className="p-1 rounded-md bg-black/70 text-gray-400 hover:text-white text-[10px]">✏️</button>
        <button onClick={e => { e.stopPropagation(); onDelete(relId); }} className="p-1 rounded-md bg-black/70 text-gray-400 hover:text-rose-500 text-[10px]">🗑️</button>
      </div>
      <div className="text-2xl">{meta.icon}</div>
      <Avatar name={other?.first_name || '?'} photoUrl={other?.photo_url} size="sm" />
      <div className="text-center">
        <p className="text-white font-semibold text-xs truncate max-w-[90px]">{other ? `${other.first_name} ${other.last_name || ''}`.trim() : '…'}</p>
        <p className="text-gray-500 text-[10px] uppercase tracking-widest mt-0.5">{role}</p>
      </div>
    </div>
  );
};

const FamilySection = ({ relationships, currentId, relPersons, onNavigate, onEdit, onDelete, personName }) => {
  const groups = { Parent: [], Child: [], Spouse: [], Sibling: [] };
  relationships.forEach(rel => {
    const isPerson1 = rel.person1_id === currentId;
    const otherId = isPerson1 ? rel.person2_id : rel.person1_id;
    const other = relPersons[otherId];
    const role = resolveRole(rel.relationship_type, isPerson1);
    if (groups[role] && other) groups[role].push({ other, rel });
  });
  const hasAny = Object.values(groups).some(g => g.length > 0);
  if (!hasAny) return (
    <div className="text-center py-8">
      <p className="text-5xl mb-3">👨‍👩‍👧‍👦</p>
      <p className="text-gray-500 text-sm">No family members linked yet.</p>
      <p className="text-gray-600 text-xs mt-1">Go to the workspace to add relationships.</p>
    </div>
  );
  return (
    <div className="space-y-5">
      {Object.entries(groups).filter(([, arr]) => arr.length > 0).map(([role, arr]) => (
        <div key={role}>
          <p className="text-[10px] uppercase tracking-widest font-bold text-gray-600 mb-2">{role}s</p>
          <div className="flex flex-wrap gap-3">
            {arr.map(({ other, rel }) => (
              <FamilyMemberCard key={rel.id} person={other} role={role}
                relId={rel.id} relType={rel.relationship_type}
                onNavigate={onNavigate} onEdit={onEdit} onDelete={onDelete} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────────────
// MEMORY FORM
// ─────────────────────────────────────────────────────
const TAGS = ['Childhood', 'Career', 'Family', 'Education'];
const EMOTIONS = ['😊', '😢', '🎉', '😔'];

const MemoryForm = ({ onSubmit, loading }) => {
  const blank = { title: '', description: '', event_date: '', media_url: '', tags: [], emotion: '', people_involved: '' };
  const [form, setForm] = useState(blank);
  const toggleTag = tag => setForm(f => ({ ...f, tags: f.tags.includes(tag) ? f.tags.filter(t => t !== tag) : [...f.tags, tag] }));
  const handleSubmit = e => { e.preventDefault(); onSubmit(form); setForm(blank); };
  const cls = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-rose-500 focus:bg-white/8 transition-all text-sm";
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input required placeholder="Memory title *" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className={cls} />
      <textarea rows={3} placeholder="Describe this memory…" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className={cls} />
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Tags</p>
        <div className="flex flex-wrap gap-2">
          {TAGS.map(tag => (
            <button key={tag} type="button" onClick={() => toggleTag(tag)}
              className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${form.tags.includes(tag) ? 'bg-rose-500 border-rose-500 text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:border-rose-500/40'}`}>{tag}</button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Mood</p>
        <div className="flex gap-3">
          {EMOTIONS.map(em => (
            <button key={em} type="button" onClick={() => setForm({ ...form, emotion: form.emotion === em ? '' : em })}
              className={`text-2xl w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${form.emotion === em ? 'bg-rose-500/20 border-rose-500 scale-110 shadow-[0_0_12px_rgba(225,29,72,0.4)]' : 'bg-white/5 border-white/10'}`}>{em}</button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <input type="date" value={form.event_date} onChange={e => setForm({ ...form, event_date: e.target.value })} className={cls} />
        <input placeholder="People involved" value={form.people_involved} onChange={e => setForm({ ...form, people_involved: e.target.value })} className={cls} />
      </div>
      <input type="url" placeholder="Image URL (optional)" value={form.media_url} onChange={e => setForm({ ...form, media_url: e.target.value })} className={cls} />
      <button type="submit" disabled={loading}
        className="w-full py-3.5 bg-white text-black font-bold uppercase tracking-widest text-sm rounded-xl hover:bg-rose-500 hover:text-white transition-all duration-300 disabled:opacity-50">
        {loading ? 'Saving…' : '+ Add Memory'}
      </button>
    </form>
  );
};

// ─────────────────────────────────────────────────────
// FEATURE 5: BIOGRAPHY SECTION (enhanced)
// ─────────────────────────────────────────────────────
const BiographySection = ({ person, relationships, memories, relPersons, onBioUpdate }) => {
  const [generating, setGenerating] = useState(false);
  const [editing, setEditing] = useState(false);

  const hasEnoughData = person?.birth_date || relationships.length > 0 || memories.length > 0;

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await api.post('/ai/generate-biography', { person_id: person.id });
      onBioUpdate(res.data.biography || res.data.bio || '');
    } catch {
      // Build a local heuristic bio if AI fails
      const rels = relationships.slice(0, 3).map(r => {
        const oid = r.person1_id === person.id ? r.person2_id : r.person1_id;
        const op = relPersons[oid];
        return op ? `${r.relationship_type} of ${op.first_name}` : null;
      }).filter(Boolean).join(', ');

      const bio = [
        `${person.first_name} ${person.last_name || ''} was born${person.birth_date ? ` on ${new Date(person.birth_date).toLocaleDateString('en-IN', { year:'numeric', month:'long', day:'numeric' })}` : ''}${person.birth_place ? ` in ${person.birth_place}` : ''}.`,
        rels ? `Known relationships include: ${rels}.` : '',
        memories.length > 0 ? `${person.first_name}'s life story includes ${memories.length} recorded ${memories.length === 1 ? 'memory' : 'memories'}.` : '',
        person.occupation ? `${person.first_name} worked as ${person.occupation}.` : '',
      ].filter(Boolean).join(' ');

      onBioUpdate(bio || 'No biography available yet.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <section className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl">
      <div className="flex justify-between items-center mb-4 pb-4 border-b border-white/10">
        <h2 className="font-bold text-white flex items-center gap-2">📝 Biography</h2>
        <button onClick={handleGenerate} disabled={generating}
          className="text-[10px] px-3 py-1.5 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg font-bold uppercase tracking-wider hover:bg-rose-500 hover:text-white transition-all disabled:opacity-40 flex items-center gap-1.5">
          {generating ? (
            <><span className="w-3 h-3 border border-rose-400 border-t-transparent rounded-full animate-spin" /> Generating…</>
          ) : '✨ AI Generate'}
        </button>
      </div>
      {generating ? (
        <div className="space-y-2">
          {[80, 95, 65, 85].map((w, i) => (
            <div key={i} className="h-3 bg-white/5 rounded animate-pulse" style={{ width: `${w}%` }} />
          ))}
        </div>
      ) : (
        <div>
          {!hasEnoughData && !person?.bio && (
            <p className="text-amber-400/70 text-xs italic mb-3 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2">
              💡 Add more life events or relationships to generate a richer biography
            </p>
          )}
          <InlineEditField
            value={person?.bio}
            placeholder="No biography yet — click AI Generate or click here to write one."
            multiline
            onSave={onBioUpdate}
            className="text-gray-300 text-sm leading-relaxed block w-full"
          />
        </div>
      )}
    </section>
  );
};

// add api import availability check
const _api = api;

// ─────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────
const PersonProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [person, setPerson] = useState(null);
  const [memories, setMemories] = useState([]);
  const [legacyMessages, setLegacyMessages] = useState([]);
  const [relationships, setRelationships] = useState([]);
  const [relPersons, setRelPersons] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingMemory, setSavingMemory] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [showStory, setShowStory] = useState(false);
  const memoryFormRef = useRef();

  const [editForm, setEditForm] = useState({});

  const fetchProfileData = useCallback(async () => {
    try {
      setLoading(true);

      const MOCK_DEMO_DATA = {
        n1: {
          person: { id: 'n1', first_name: 'Arthur', last_name: 'Pendragon', gender: 'Male', birth_place: 'Camelot', bio: 'The legendary king of Britain, wielder of Excalibur.' },
          memories: [{ id: 'm1', title: 'Drawing the Sword', description: 'Pulled Excalibur from the stone, fulfilling the ancient prophecy.', event_date: '0500-01-01', tags: ['Career'] }],
          relationships: [
            { id: 'r1', person1_id: 'n1', person2_id: 'n2', relationship_type: 'spouse' },
            { id: 'r2', person1_id: 'n1', person2_id: 'n3', relationship_type: 'parent' }
          ]
        },
        n2: {
          person: { id: 'n2', first_name: 'Guinevere', last_name: 'Leodegrance', gender: 'Female', bio: 'The noble Queen of Camelot.' },
          memories: [],
          relationships: [
            { id: 'r1', person1_id: 'n1', person2_id: 'n2', relationship_type: 'spouse' },
            { id: 'r3', person1_id: 'n2', person2_id: 'n3', relationship_type: 'parent' },
            { id: 'r4', person1_id: 'n4', person2_id: 'n2', relationship_type: 'sibling' }
          ]
        },
        n3: {
          person: { id: 'n3', first_name: 'Gawain', last_name: 'Pendragon', gender: 'Male', bio: 'A brave and loyal knight of the Round Table.' },
          memories: [],
          relationships: [
            { id: 'r2', person1_id: 'n1', person2_id: 'n3', relationship_type: 'parent' },
            { id: 'r3', person1_id: 'n2', person2_id: 'n3', relationship_type: 'parent' }
          ]
        },
        n4: {
          person: { id: 'n4', first_name: 'Lancelot', last_name: 'du Lac', gender: 'Male', bio: 'The greatest swordsman of Camelot.' },
          memories: [],
          relationships: [
            { id: 'r4', person1_id: 'n4', person2_id: 'n2', relationship_type: 'sibling' }
          ]
        }
      };

      if (MOCK_DEMO_DATA[id]) {
        const data = MOCK_DEMO_DATA[id];
        setPerson(data.person);
        setEditForm(data.person);
        setMemories(data.memories);
        setLegacyMessages([]);
        setRelationships(data.relationships);
        
        const otherIds = [...new Set(data.relationships.map(r => r.person1_id === id ? r.person2_id : r.person1_id))];
        const pm = {};
        otherIds.forEach(oid => {
           if (MOCK_DEMO_DATA[oid]) pm[oid] = MOCK_DEMO_DATA[oid].person;
        });
        setRelPersons(pm);
        setLoading(false);
        return;
      }

      const [personRes, memoriesRes, relsRes, legacyRes] = await Promise.all([
        api.get(`/persons/${id}`),
        api.get(`/memories/person/${id}`),
        api.get(`/relationships/${id}`),
        api.get(`/legacy/${id}`).catch(() => ({ data: [] }))
      ]);
      setPerson(personRes.data);
      setEditForm(personRes.data);
      setMemories(memoriesRes.data || []);
      setLegacyMessages(legacyRes.data || []);
      const rels = relsRes.data || [];
      setRelationships(rels);

      const otherIds = [...new Set(rels.map(r => r.person1_id === id ? r.person2_id : r.person1_id))];
      const personResults = await Promise.allSettled(
        otherIds.map(pid => api.get(`/persons/${pid}`).then(r => ({ id: pid, data: r.data })))
      );
      const pm = {};
      personResults.forEach(res => { if (res.status === 'fulfilled') pm[res.value.id] = res.value.data; });
      setRelPersons(pm);
    } catch (err) {
      setError('Failed to load profile.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchProfileData(); }, [fetchProfileData]);

  const handleAddMemory = async (formData) => {
    if (!person) return;
    setSavingMemory(true);
    try {
      const res = await api.post('/memories', { ...formData, person_id: id, family_id: person.family_id });
      setMemories(prev => [...prev, res.data]);
    } catch { setError('Failed to add memory.'); setTimeout(() => setError(''), 3000); }
    finally { setSavingMemory(false); }
  };

  const handleLegacyAdded = (msg) => {
    setLegacyMessages(prev => [msg, ...prev]);
  };

  const handleInlineSave = async (field, value) => {
    try {
      const updated = { ...person, [field]: value };
      await updatePerson(id, { [field]: value });
      setPerson(updated);
    } catch { setError('Save failed.'); }
  };

  const handleSaveEditForm = async () => {
    try {
      await updatePerson(id, editForm);
      setPerson({ ...person, ...editForm });
      setEditing(false);
    } catch { setError('Update failed.'); }
  };

  const handleDeletePerson = async () => {
    if (!window.confirm('Permanently remove this person from the lineage?')) return;
    try { await deletePerson(id); navigate('/family-tree'); }
    catch { setError('Delete failed.'); }
  };

  const handleDeleteRelationship = async (relId) => {
    if (!window.confirm('Remove this relationship?')) return;
    try { await deleteRelationship(relId); fetchProfileData(); }
    catch { setError('Failed to remove.'); }
  };

  const handleEditRelationship = async (relId, current) => {
    const newType = window.prompt('New type (parent/child/spouse/sibling):', current);
    if (!newType) return;
    try { await updateRelationship(relId, { relationship_type: newType.trim().toLowerCase() }); fetchProfileData(); }
    catch { setError('Update failed.'); }
  };

  // Quick nav helpers
  const parentIds = relationships
    .filter(r => (r.relationship_type === 'parent' && r.person2_id === id) || (r.relationship_type === 'child' && r.person1_id === id))
    .map(r => r.person1_id === id ? r.person2_id : r.person1_id);
  const childIds = relationships
    .filter(r => (r.relationship_type === 'child' && r.person2_id === id) || (r.relationship_type === 'parent' && r.person1_id === id))
    .map(r => r.person1_id === id ? r.person2_id : r.person1_id);

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 text-sm uppercase tracking-widest animate-pulse">Loading profile…</p>
      </div>
    </div>
  );

  if (!person) return (
    <div className="min-h-screen bg-black flex items-center justify-center text-rose-400 text-xl font-bold">
      {error || 'Profile not found'}
    </div>
  );

  const fullName = `${person.first_name} ${person.last_name || ''}`.trim();

  return (
    <div className="min-h-screen bg-[#080808] text-white font-sans selection:bg-rose-500/30">
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[900px] h-[400px] bg-rose-900/8 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative max-w-5xl mx-auto px-5 md:px-10 py-8 space-y-7">

        {/* ── TOP BAR ── */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <BreadcrumbNav personName={fullName} />

          <div className="flex flex-wrap items-center gap-2">
            <PrivacyControls personId={id} personName={fullName} />
            <button onClick={() => setEditing(e => !e)}
              className="px-3 py-1.5 border border-white/15 bg-white/5 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-white hover:text-black transition-all">
              {editing ? '✕ Cancel' : '✏️ Edit'}
            </button>
            <button onClick={handleDeletePerson}
              className="px-3 py-1.5 border border-rose-500/40 bg-rose-500/10 text-rose-400 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-rose-600 hover:text-white transition-all">
              🗑️ Delete
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="p-3 bg-red-900/40 border border-red-500/40 rounded-xl text-red-300 text-sm font-medium">⚠️ {error}</div>
        )}

        {/* ── QUICK NAV ── */}
        {(parentIds.length > 0 || childIds.length > 0) && (
          <div className="flex flex-wrap gap-2">
            {parentIds.slice(0, 2).map(pid => (
              <button key={pid} onClick={() => navigate(`/person/${pid}`)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-gray-400 hover:text-white hover:border-white/20 transition-all">
                ↑ {relPersons[pid]?.first_name || 'Parent'}
              </button>
            ))}
            <button onClick={() => navigate('/family-tree')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-500 hover:text-white transition-all">
              🌳 Full Tree
            </button>
            {childIds.slice(0, 2).map(cid => (
              <button key={cid} onClick={() => navigate(`/person/${cid}`)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-gray-400 hover:text-white hover:border-white/20 transition-all">
                ↓ {relPersons[cid]?.first_name || 'Child'}
              </button>
            ))}
          </div>
        )}

        {/* ── PROFILE HEADER ── */}
        <div className="bg-black/50 backdrop-blur-xl border border-white/10 rounded-3xl p-7 flex flex-col sm:flex-row gap-7 items-center sm:items-start relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-rose-500/40 to-transparent" />

          <UploadableAvatar
            photoUrl={person.photo_url}
            name={person.first_name}
            size="lg"
            glow
            editable
            personId={person.id}
            onUploaded={(url) => setPerson(prev => ({ ...prev, photo_url: url }))}
          />

          {editing ? (
            <div className="flex-1 space-y-4 w-full">
              <div className="grid grid-cols-2 gap-3">
                {[['first_name','First Name'],['last_name','Last Name'],['gender','Gender'],['birth_place','Birth Place'],['occupation','Occupation']].map(([k,l]) => (
                  <div key={k} className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">{l}</label>
                    <input value={editForm[k] || ''} onChange={e => setEditForm({...editForm,[k]:e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-rose-500 transition-all" />
                  </div>
                ))}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Date of Birth</label>
                  <input type="date" value={editForm.birth_date ? editForm.birth_date.split('T')[0] : ''}
                    onChange={e => setEditForm({...editForm, birth_date: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-rose-500 transition-all" />
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={handleSaveEditForm} className="flex-1 py-2.5 bg-white text-black font-bold uppercase tracking-widest text-xs rounded-xl hover:bg-rose-500 hover:text-white transition-all">Save Changes</button>
                <button onClick={() => setEditing(false)} className="flex-1 py-2.5 bg-white/5 border border-white/10 text-gray-400 font-bold uppercase tracking-widest text-xs rounded-xl hover:bg-white/10 transition-all">Cancel</button>
              </div>
            </div>
          ) : (
            <div className="flex-1 text-center sm:text-left space-y-4">
              <div>
                <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
                  <InlineEditField value={person.first_name} onSave={v => handleInlineSave('first_name', v)} className="mr-2" />
                  <span className="text-gray-400">
                    <InlineEditField value={person.last_name} placeholder="Last name" onSave={v => handleInlineSave('last_name', v)} />
                  </span>
                </h1>
                <p className="text-rose-400 font-medium mt-1 text-sm">
                  <InlineEditField value={person.occupation} placeholder="Occupation…" onSave={v => handleInlineSave('occupation', v)} />
                </p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                <Chip icon="🚻" label="Gender" value={person.gender} />
                <Chip icon="📍" label="Origin" value={person.birth_place} />
                <Chip icon="🎂" label="Born"
                  value={person.birth_date ? new Date(person.birth_date).toLocaleDateString('en-IN', { year:'numeric', month:'long', day:'numeric' }) : 'Unknown'} />
                {person.death_date && <Chip icon="🕊️" label="Passed" value={new Date(person.death_date).toLocaleDateString('en-IN', { year:'numeric', month:'long', day:'numeric' })} />}
                {calcAge(person.birth_date, person.death_date) !== null && (
                  <Chip icon="⏳" value={`${calcAge(person.birth_date, person.death_date)} yrs`} color="bg-amber-500/10 border border-amber-500/20 text-amber-300" />
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── PERSONAL GREETING ── */}
        <div className="flex items-center justify-between">
          <p className="text-gray-500 text-sm italic">✨ This is <span className="text-white font-semibold">{person.first_name}</span>'s story — build their legacy together.</p>
          <button
            onClick={() => setShowStory(true)}
            className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all duration-300 hover:shadow-[0_0_20px_rgba(225,29,72,0.3)] flex-shrink-0">
            📖 Generate Life Story
          </button>
        </div>

        {/* ── INSIGHTS PANEL ── */}
        <InsightsPanel memories={memories} relationships={relationships} person={person} />

        {/* ── PROFILE STRENGTH ── */}
        <ProfileStrengthBar person={person} memories={memories} relationships={relationships} />

        {/* ── MAIN GRID ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-7">

          {/* LEFT COL */}
          <div className="space-y-6">

            {/* Biography */}
            <BiographySection
              person={person}
              relationships={relationships}
              memories={memories}
              relPersons={relPersons}
              onBioUpdate={v => handleInlineSave('bio', v)}
            />

            {/* Mini Tree */}
            <section className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl">
              <h2 className="font-bold text-white flex items-center gap-2 mb-4 pb-4 border-b border-white/10">
                🌳 Position in Tree
              </h2>
              <MiniTreePreview
                person={person}
                relationships={relationships}
                relPersons={relPersons}
                onNodeClick={pid => navigate(`/person/${pid}`)}
              />
            </section>

            {/* Family Members — grouped by role */}
            <section className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl">
              <h2 className="font-bold text-white flex items-center gap-2 mb-4 pb-4 border-b border-white/10">
                👨‍👩‍👧‍👦 Family Members
              </h2>
              <FamilySection
                relationships={relationships}
                currentId={id}
                relPersons={relPersons}
                personName={person.first_name}
                onNavigate={pid => navigate(`/person/${pid}`)}
                onEdit={handleEditRelationship}
                onDelete={handleDeleteRelationship}
              />
            </section>
          </div>

          {/* RIGHT COL */}
          <div className="lg:col-span-2 space-y-7">

            {/* Legacy Mode Section */}
            <LegacySection 
              personId={id} 
              messages={legacyMessages} 
              onMessageAdded={handleLegacyAdded} 
            />

            {/* Life Story / Timeline */}
            <section className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-xl">
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/10">
                <h2 className="font-bold text-white text-xl flex items-center gap-2">📅 Life Story</h2>
                <span className="text-xs text-gray-600">{memories.length} event{memories.length !== 1 ? 's' : ''}</span>
              </div>
              <MemoryTimeline
                memories={memories}
                personName={person.first_name}
                onAddClick={() => memoryFormRef.current?.scrollIntoView({ behavior: 'smooth' })}
              />
            </section>

            {/* Add Memory */}
            <section ref={memoryFormRef} className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-rose-500/40 to-transparent" />
              <h2 className="font-bold text-white text-xl flex items-center gap-2 mb-6 pb-4 border-b border-white/10">
                ✍️ Add Memory
              </h2>
              <MemoryForm onSubmit={handleAddMemory} loading={savingMemory} />
            </section>
          </div>
        </div>
      </div>

      {/* Story Mode Modal */}
      {showStory && (
        <StoryModeModal
          person={person}
          memories={memories}
          relationships={relationships}
          relPersons={relPersons}
          onClose={() => setShowStory(false)}
        />
      )}
    </div>
  );
};

export default PersonProfile;
