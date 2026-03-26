import React, { useState, useEffect, useMemo } from 'react';

const AnimatedCounter = ({ value, duration = 1000 }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (typeof value !== 'number') {
      setCount(value);
      return;
    }
    let start = 0;
    const end = value;
    if (start === end) {
      setCount(end);
      return;
    }
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutExpo
      const easing = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(Math.floor(start + (end - start) * easing));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [value, duration]);

  return <>{count}</>;
};

const InsightCard = ({ icon, label, value, tooltip, highlight }) => (
  <div 
    className={`bg-black/40 backdrop-blur-xl border ${highlight ? 'border-rose-500/30 inset-shadow-sm' : 'border-white/10'} rounded-2xl p-4 relative group hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)] transition-all duration-300`}
    title={tooltip}
  >
    <div className="flex items-center gap-3 mb-2">
      <span className="text-2xl group-hover:scale-110 transition-transform duration-300">{icon}</span>
      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 group-hover:text-gray-400 transition-colors">{label}</span>
    </div>
    <div className={`text-2xl font-black ${highlight ? 'text-rose-400' : 'text-white'}`}>
      <AnimatedCounter value={value} />
    </div>
  </div>
);

const FamilyInsightsPanel = ({ nodes, edges }) => {
  const [showAutoFix, setShowAutoFix] = useState(false);

  const insights = useMemo(() => {
    if (!nodes.length) return null;

    const totalMembers = nodes.length;
    const totalRelationships = edges.length;

    const places = {};
    let topPlace = 'Unknown';
    let maxCount = 0;
    
    let missingDob = 0;
    let missingBio = 0;
    let missingParents = 0;

    const parentCounts = {};
    nodes.forEach(n => parentCounts[n.id] = 0);
    edges.forEach(e => {
       if (e.data?.relationship_type === 'parent' || e.data?.relationship_type === 'child') {
           parentCounts[e.target]++;
       }
    });

    nodes.forEach(n => {
      const p = n.data?.person || {};
      if (!p.birth_date) missingDob++;
      if (!p.bio || p.bio.length < 10) missingBio++;
      if (parentCounts[n.id] < 2) missingParents++;

      if (p.birth_place) {
        places[p.birth_place] = (places[p.birth_place] || 0) + 1;
        if (places[p.birth_place] > maxCount) {
          maxCount = places[p.birth_place];
          topPlace = p.birth_place;
        }
      }
    });

    return { totalMembers, totalRelationships, topPlace: maxCount > 0 ? topPlace : 'Not Recorded', missingDob, missingBio, missingParents };
  }, [nodes, edges]);

  // Prevent render before calculation
  if (!insights) return null;

  const totalIssues = insights.missingDob + insights.missingBio + insights.missingParents;
  const isHealthy = totalIssues === 0 && insights.totalMembers > 0;

  return (
    <div className="space-y-5 animate-in fade-in duration-700">
      
      {/* 1. Animated Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <InsightCard 
          icon="👥" label="Total Members" value={insights.totalMembers} tooltip="Total individuals in this tree" 
        />
        <InsightCard 
          icon="🔗" label="Relationships" value={insights.totalRelationships} tooltip="Total connections mapped" 
        />
        <InsightCard 
          icon="🌍" label="Deep Roots" value={insights.topPlace} tooltip="Most common origin city/place" 
        />
      </div>

      {/* 2. Actionable Growth Opportunities */}
      {totalIssues > 0 && (
        <div className="mt-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5 shadow-[0_4px_24px_rgba(245,158,11,0.05)] transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-amber-500 text-lg">💡</span>
              <span className="text-amber-400 text-xs font-bold uppercase tracking-widest">Growth Opportunities</span>
            </div>
            
            {/* Fix 5: Auto Fix WOW Feature */}
            <button 
              onClick={() => setShowAutoFix(!showAutoFix)}
              className="px-3 py-1.5 bg-amber-500 text-black text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-amber-400 hover:scale-105 hover:shadow-[0_0_15px_rgba(245,158,11,0.4)] transition-all active:scale-95"
            >
              {showAutoFix ? '✕ Close Panel' : '✨ Fix All Issues'}
            </button>
          </div>

          <div className="space-y-3">
            {insights.missingDob > 0 && (
              <div className="flex items-center justify-between text-xs bg-black/40 border border-white/5 rounded-xl px-4 py-3 group hover:border-white/10 transition-colors">
                <div>
                  <span className="text-gray-400 block group-hover:text-gray-300">Missing Birthdates</span>
                  <span className="text-white font-bold"><AnimatedCounter value={insights.missingDob} /> members</span>
                </div>
                <button className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-gray-300 hover:text-white hover:border-white/20 hover:bg-white/10 active:scale-95 transition-all text-[10px] font-bold uppercase tracking-wider">
                  Fix Now
                </button>
              </div>
            )}
            
            {insights.missingBio > 0 && (
              <div className="flex items-center justify-between text-xs bg-black/40 border border-white/5 rounded-xl px-4 py-3 group hover:border-white/10 transition-colors">
                <div>
                  <span className="text-gray-400 block group-hover:text-gray-300">Missing Biographies</span>
                  <span className="text-white font-bold"><AnimatedCounter value={insights.missingBio} /> members</span>
                </div>
                <button className="px-3 py-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500 hover:text-white hover:shadow-[0_0_15px_rgba(168,85,247,0.4)] active:scale-95 transition-all text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <span>✨</span> Generate
                </button>
              </div>
            )}
            
            {insights.missingParents > 0 && (
              <div className="flex items-center justify-between text-xs bg-black/40 border border-white/5 rounded-xl px-4 py-3 group hover:border-white/10 transition-colors">
                <div>
                  <span className="text-gray-400 block group-hover:text-gray-300">Incomplete Parent Links</span>
                  <span className="text-white font-bold"><AnimatedCounter value={insights.missingParents} /> members</span>
                </div>
                <button className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-gray-300 hover:text-white hover:border-white/20 hover:bg-white/10 active:scale-95 transition-all text-[10px] font-bold uppercase tracking-wider">
                  Resolve
                </button>
              </div>
            )}
          </div>
          
          {/* AUTO FIX EXPANDABLE PANEL */}
          {showAutoFix && (
            <div className="mt-4 pt-4 border-t border-amber-500/20 animate-in slide-in-from-top-4 fade-in duration-300">
              <h4 className="text-amber-400 text-xs font-bold mb-3 uppercase tracking-wider">Smart Resolution Center</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button className="p-3 bg-black/40 border border-amber-500/30 hover:bg-amber-500/10 rounded-xl text-left transition-all hover:-translate-y-0.5 group">
                  <div className="text-amber-400 text-sm font-bold mb-1 group-hover:text-amber-300">🪄 Magic Bio Generator</div>
                  <div className="text-xs text-gray-500 leading-relaxed">Runs AI on {insights.missingBio} profiles automatically using existing data.</div>
                </button>
                <button className="p-3 bg-black/40 border border-amber-500/30 hover:bg-amber-500/10 rounded-xl text-left transition-all hover:-translate-y-0.5 group">
                  <div className="text-amber-400 text-sm font-bold mb-1 group-hover:text-amber-300">📡 GEDCOM Sync</div>
                  <div className="text-xs text-gray-500 leading-relaxed">Scan your uploaded files to patch {insights.missingDob} missing dates seamlessly.</div>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Dynamics Messages */}
      <div className="px-2">
        <p className="text-gray-500 text-xs italic opacity-80 transition-opacity hover:opacity-100">
          {isHealthy 
            ? "🌟 Your tree is perfectly maintained and growing beautifully!" 
            : `📈 Your lineage spans ${insights.totalMembers} members. Consider fixing missing gaps to unlock deeper insights.`}
        </p>
      </div>

    </div>
  );
};

export default FamilyInsightsPanel;
