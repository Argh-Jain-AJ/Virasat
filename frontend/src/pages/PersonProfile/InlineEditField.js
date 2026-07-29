import React, { useState, useEffect, useRef } from 'react';

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

export default InlineEditField;
