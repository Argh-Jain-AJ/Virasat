import React, { useState } from 'react';

// FEATURE 10: PRIVACY & SHARING CONTROLS
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

export default PrivacyControls;
