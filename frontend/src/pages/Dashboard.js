import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getFamilies, createFamily, deleteFamily, updateFamily } from "../services/familyService";
import bgImage from "../assets/hero-bg.png";

const Dashboard = () => {
  const navigate = useNavigate();

  const [families, setFamilies] = useState([]);
  const [error, setError] = useState("");
  const [newFamilyName, setNewFamilyName] = useState("");
  const [loading, setLoading] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    fetchFamilies();
    
    const handleMouseMove = (e) => {
      setMousePos({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const fetchFamilies = async () => {
    try {
      const response = await getFamilies();
      const familyList = response?.data || response || [];
      familyList.sort((a,b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0));
      setFamilies(familyList);
    } catch (err) {
      console.error("Fetch families error:", err);
      setError("Failed to fetch lineages.");
    }
  };

  const handleFamilySelect = (familyId) => {
    if (familyId) {
      localStorage.setItem("selectedFamily", familyId);
      navigate("/family-tree");
    }
  };

  const handleDeleteFamily = async (e, familyId) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to permanently obliterate this lineage? This action cannot be undone.")) {
      try {
        await deleteFamily(familyId);
        if (localStorage.getItem("selectedFamily") === familyId) {
          localStorage.removeItem("selectedFamily");
        }
        fetchFamilies();
      } catch (err) {
        setError("Failed to delete lineage.");
      }
    }
  };

  const handleUpdateFamily = async (e, familyId, currentName) => {
    e.stopPropagation();
    const newName = window.prompt("Enter new lineage name:", currentName);
    if (newName && newName.trim() !== currentName) {
      try {
        await updateFamily(familyId, { family_name: newName.trim() });
        fetchFamilies();
      } catch (err) {
        setError("Failed to rename lineage.");
      }
    }
  };

  const handleCreateFamily = async (e) => {
    e.preventDefault();
    if (!newFamilyName.trim()) {
      setError("Lineage name cannot be empty.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await createFamily({
        family_name: newFamilyName.trim(),
      });

      const createdFamily = response?.data || response;
      if (!createdFamily?.id) throw new Error("Invalid family response");

      localStorage.setItem("selectedFamily", createdFamily.id);
      navigate("/family-tree");
    } catch (err) {
      console.error("Create family error:", err);
      setError("Failed to forge new lineage.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Recently";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  // Identify exactly one ID for the "Last Opened" badge
  const lastOpenedId = useMemo(() => {
    const selected = localStorage.getItem("selectedFamily");
    if (selected && families.some(f => f.id === selected)) {
      return selected;
    }
    return families.length > 0 ? families[0].id : null;
  }, [families]);

  return (
    <>
      <style>
        {`
          @keyframes statusPulse {
            0%, 100% { transform: scale(1); opacity: 0.8; box-shadow: 0 0 5px rgba(52,211,153,0.4); }
            50% { transform: scale(1.1); opacity: 1; box-shadow: 0 0 12px rgba(52,211,153,0.8); }
          }
          .animate-status-dot {
            animation: statusPulse 3s ease-in-out infinite;
          }
        `}
      </style>
      <div className="min-h-screen bg-black text-white relative overflow-hidden selection:bg-rose-500/30 font-sans flex flex-col items-center">
        
        {/* Dynamic Global Spotlight Effect */}
        <div 
          className="pointer-events-none fixed inset-0 z-0 opacity-30 transition-opacity duration-500 animate-pulse"
          style={{ background: `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, rgba(225, 29, 72, 0.2), transparent 45%)` }}
        />

        {/* Background Image Overlay */}
        <div 
          className="fixed inset-0 z-[-1] bg-cover bg-center opacity-40 brightness-50"
          style={{ backgroundImage: `url(${bgImage})` }}
        />
        <div className="fixed inset-0 z-[-1] bg-gradient-to-b from-black/80 via-black/50 to-black/90" />

        {/* Main Content Container */}
        <div className="z-10 w-full max-w-7xl p-6 md:p-12 mb-20">
          
          {/* Header Section */}
          <header className="mb-14 border-b border-white/10 pb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 animate-in fade-in slide-in-from-top-4 duration-700 fill-mode-both">
            <div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-300 to-gray-500 drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                COMMAND CENTER.
              </h1>
              <p className="text-sm md:text-base font-medium text-rose-500 tracking-[0.3em] uppercase mt-3">
                Select Your Lineage Context
              </p>
              <p className="text-xs md:text-sm text-gray-400 mt-2 italic tracking-wide">
                Choose where your legacy continues.
              </p>
            </div>

            <div className="flex flex-col md:flex-row items-end gap-6">
              {/* Quick Analytics */}
              <div className="flex gap-4 md:gap-8 bg-black/40 backdrop-blur-xl border border-white/5 px-6 py-4 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                <div className="flex flex-col">
                  <span className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1 drop-shadow-sm">Active Lineages</span>
                  <span className="text-2xl font-black text-white drop-shadow-md">{families.length}</span>
                </div>
                <div className="w-px bg-white/10"></div>
                <div className="flex flex-col">
                  <span className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1 drop-shadow-sm">System Status</span>
                  <span className="text-sm font-bold text-emerald-400 flex items-center gap-2 mt-1 drop-shadow-md tracking-wide">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-status-dot relative">
                      <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-20"></span>
                    </span> Optimized
                  </span>
                </div>
              </div>
            </div>
          </header>

          {error && (
            <div className="mb-8 p-4 bg-red-900/40 border border-red-500/50 rounded-xl text-red-100 text-sm font-medium flex items-center gap-3 backdrop-blur-md animate-in fade-in zoom-in-95 duration-300">
              <span className="text-xl">⚠️</span> {error}
            </div>
          )}

          {/* Dashboard Grid Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            
            {/* Left Column: Lineage Cards */}
            <section className="lg:col-span-2 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150 fill-mode-both">
              <h3 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3 drop-shadow-md">
                Your Ancestral Horizons
                <span className="h-px bg-gradient-to-r from-rose-500 to-transparent flex-1 ml-4 opacity-30"></span>
              </h3>

              {families.length === 0 ? (
                <div className="bg-black/40 border border-white/5 p-10 rounded-2xl flex flex-col items-center justify-center text-center backdrop-blur-2xl shadow-xl">
                  <div className="text-5xl mb-4 opacity-40">🧭</div>
                  <h4 className="text-xl font-bold text-gray-200 mb-2">No Lineages Found</h4>
                  <p className="text-gray-400 text-sm max-w-sm">You haven't established any family trees yet. Forge your first lineage on the right to begin tracking.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {families.map((fam) => {
                      const isLastOpened = fam.id === lastOpenedId;
                      return (
                        <div 
                          key={fam.id} 
                          onClick={() => handleFamilySelect(fam.id)}
                          className={`group cursor-pointer p-6 rounded-2xl bg-gradient-to-br from-black/60 to-black/40 border transition-all duration-400 shadow-[0_10px_20px_rgba(0,0,0,0.5)] flex flex-col h-56 backdrop-blur-2xl relative overflow-hidden active:scale-[0.97] hover:-translate-y-1.5 hover:shadow-[0_20px_40px_rgba(225,29,72,0.15)] focus:outline-none ${isLastOpened ? "border-rose-500/40 shadow-[0_0_20px_rgba(225,29,72,0.1)]" : "border-white/5 hover:border-rose-500/30"}`}
                        >
                          {/* Hover Gradient Wash */}
                          <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                          
                          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                            <span className="text-8xl font-black text-rose-500 mix-blend-screen">{fam.family_name[0].toUpperCase()}</span>
                          </div>

                          <div className="z-20 flex justify-between items-start w-full gap-2">
                            <div className="flex-1">
                              {isLastOpened && (
                                <span className="inline-block px-2 py-0.5 bg-rose-500/10 border border-rose-500/30 rounded-md text-[10px] font-black tracking-widest text-rose-400 uppercase mb-3 shadow-sm drop-shadow-sm">
                                  Last Opened
                                </span>
                              )}
                              <h4 className="text-2xl font-bold text-gray-100 mb-1 tracking-tight truncate pr-2 group-hover:text-white transition-colors">{fam.family_name}</h4>
                              <p className="text-xs text-gray-400 font-medium tracking-wide drop-shadow-sm">
                                {fam.member_count != null ? `${fam.member_count} members` : "No members yet"} • Updated {formatDate(fam.updated_at)}
                              </p>
                            </div>

                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 p-1.5 rounded-lg border border-white/5 backdrop-blur-md shadow-lg shrink-0">
                              <button onClick={(e) => handleUpdateFamily(e, fam.id, fam.family_name)} className="text-gray-400 hover:text-white transition-colors p-1" title="Rename Lineage">✏️</button>
                              <button onClick={(e) => handleDeleteFamily(e, fam.id)} className="text-gray-400 hover:text-rose-500 transition-colors p-1" title="Erase Lineage">🗑️</button>
                            </div>
                          </div>

                          <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest z-10 mb-auto mt-4 mix-blend-screen">ID: {fam.id.substring(0,8)}</p>
                          
                          <div className="z-10 flex items-center justify-between w-full mt-4 pt-4 border-t border-white/5">
                            <span className="text-sm font-bold text-gray-400 group-hover:text-rose-300 transition-all drop-shadow-sm underline decoration-transparent group-hover:decoration-rose-500/30 underline-offset-4 group-hover:brightness-110">Access Workspace</span>
                            <span className="w-8 h-8 rounded-full bg-white/5 border border-white/5 flex items-center justify-center group-hover:bg-rose-500 group-hover:border-rose-400 transition-all text-white font-black group-hover:translate-x-1.5 duration-400 shadow-inner group-hover:shadow-[0_0_15px_rgba(225,29,72,0.6)]">→</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Visual Balance Placeholder */}
                  {families.length > 0 && (
                    <div className="mt-8 p-6 bg-black/20 border border-white/5 rounded-2xl text-center backdrop-blur-md shadow-inner">
                      <p className="text-sm text-gray-500 font-medium tracking-wide">No recent system activity — ready for new directives.</p>
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* Right Column: Forge Lineage */}
            <section id="establish-origin" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 fill-mode-both">
              <h3 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3 drop-shadow-md">
                Establish Origin
                <span className="h-px bg-gradient-to-r from-rose-500 to-transparent flex-1 ml-4 opacity-30"></span>
              </h3>

              <div className="bg-black/40 border border-white/5 hover:border-white/10 p-8 rounded-2xl backdrop-blur-2xl shadow-[-15px_0_40px_rgba(0,0,0,0.6)] relative overflow-hidden group transition-all duration-400 hover:shadow-[-15px_0_50px_rgba(225,29,72,0.05)]">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-600 via-rose-500 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
                
                <div className="mb-8">
                  <p className="text-sm text-gray-300 leading-relaxed font-medium">
                    Initialize a brand new family tree. <br className="hidden lg:block"/>This acts as the anchor point for your generations, media, and chronologies.
                  </p>
                  <p className="text-[10px] text-rose-500/80 font-black uppercase tracking-widest mt-4 drop-shadow-sm">Start a new family journey</p>
                </div>

                <form onSubmit={handleCreateFamily} className="space-y-6 relative z-10">
                  <div className="space-y-1.5 group/input">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest group-focus-within/input:text-rose-400 transition-colors duration-300 drop-shadow-sm">Lineage Name</label>
                    <input
                      placeholder="e.g. The Targaryen Ancestry"
                      value={newFamilyName}
                      onChange={(e) => setNewFamilyName(e.target.value)}
                      required
                      className="w-full bg-white/5 border border-white/10 hover:border-white/20 px-4 py-3.5 text-white placeholder-gray-600 focus:outline-none focus:border-rose-500/80 focus:bg-white/10 transition-all duration-300 rounded-xl focus:shadow-[inset_0_2px_10px_rgba(225,29,72,0.05),0_0_15px_rgba(225,29,72,0.25)]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 mt-2 bg-gradient-to-r from-rose-600 to-rose-500 border border-rose-400/30 text-white font-black tracking-[0.2em] uppercase text-xs rounded-xl shadow-[0_5px_15px_rgba(225,29,72,0.3)] hover:shadow-[0_15px_30px_rgba(225,29,72,0.5)] hover:from-rose-500 hover:to-rose-400 active:scale-[0.97] transition-all duration-300 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-3 relative overflow-hidden group/btn"
                  >
                    {loading ? (
                      <span className="animate-pulse">Forging...</span>
                    ) : (
                      <>
                        <div className="absolute inset-0 bg-white/20 blur-md opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
                        <span className="relative z-10 flex items-center gap-2">Forge Lineage <span className="text-xl leading-none -mt-1">+</span></span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </section>

          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;