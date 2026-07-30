import React, { useState } from 'react';

const PrivacyControls = ({ personId, personName }) => {
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
