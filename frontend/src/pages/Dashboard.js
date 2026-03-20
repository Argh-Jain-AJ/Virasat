import React, { useState, useEffect } from "react";
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

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden selection:bg-rose-500/30 font-sans flex flex-col items-center">
      
      {/* Dynamic Global Spotlight Effect */}
      <div 
        className="pointer-events-none fixed inset-0 z-0 opacity-30 transition-opacity duration-500"
        style={{ background: `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, rgba(225, 29, 72, 0.2), transparent 45%)` }}
      />

      {/* Background Image Overlay */}
      <div 
        className="fixed inset-0 z-[-1] bg-cover bg-center opacity-40 brightness-50"
        style={{ backgroundImage: `url(${bgImage})` }}
      />
      <div className="fixed inset-0 z-[-1] bg-gradient-to-b from-black/80 via-black/50 to-black/90" />

      {/* Main Content Container */}
      <div className="z-10 w-full max-w-7xl p-6 md:p-12 mb-20 animate-fade-in-up">
        
        {/* Header Section */}
        <header className="mb-12 border-b border-white/10 pb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-300 to-gray-500">
              COMMAND CENTER.
            </h1>
            <p className="text-sm md:text-base font-medium text-rose-500 tracking-[0.3em] uppercase mt-2">
              Select Your Lineage Context
            </p>
          </div>

          {/* Quick Mock Analytics */}
          <div className="flex gap-4 md:gap-8 bg-white/5 backdrop-blur-md border border-white/10 px-6 py-4 rounded-xl shadow-2xl">
            <div className="flex flex-col">
              <span className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Active Lineages</span>
              <span className="text-2xl font-black text-white">{families.length}</span>
            </div>
            <div className="w-px bg-white/10"></div>
            <div className="flex flex-col">
              <span className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">System Status</span>
              <span className="text-sm font-bold text-emerald-400 flex items-center gap-2 mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span> Optimized
              </span>
            </div>
          </div>
        </header>

        {error && (
          <div className="mb-8 p-4 bg-red-900/40 border border-red-500/50 rounded-xl text-red-200 text-sm font-medium flex items-center gap-3 backdrop-blur-md">
            <span className="text-xl">⚠️</span> {error}
          </div>
        )}

        {/* Dashboard Grid Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* Left Column: Lineage Cards */}
          <section className="lg:col-span-2 space-y-6">
            <h3 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
              Your Ancestral Horizons
              <span className="h-px bg-gradient-to-r from-rose-500 to-transparent flex-1 ml-4 opacity-50"></span>
            </h3>

            {families.length === 0 ? (
              <div className="bg-white/5 border border-white/10 p-10 rounded-2xl flex flex-col items-center justify-center text-center backdrop-blur-md">
                <div className="text-5xl mb-4 opacity-50">🧭</div>
                <h4 className="text-xl font-bold text-gray-200 mb-2">No Lineages Found</h4>
                <p className="text-gray-400 text-sm max-w-sm">You haven't established any family trees yet. Forge your first lineage on the right to begin tracking.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {families.map((fam) => (
                  <div 
                    key={fam.id} 
                    onClick={() => handleFamilySelect(fam.id)}
                    className="group cursor-pointer p-6 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 hover:border-rose-500/50 hover:from-white/15 hover:to-white/5 transition-all duration-300 shadow-xl hover:shadow-[0_0_30px_rgba(225,29,72,0.2)] flex flex-col h-48 backdrop-blur-md relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <span className="text-8xl font-black text-rose-500 ">{fam.family_name[0].toUpperCase()}</span>
                    </div>

                    <div className="z-20 flex justify-between items-start w-full">
                      <h4 className="text-2xl font-bold text-white mb-1 tracking-tight truncate pr-2">{fam.family_name}</h4>
                      <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 p-1.5 rounded-lg border border-white/10 backdrop-blur-md">
                        <button onClick={(e) => handleUpdateFamily(e, fam.id, fam.family_name)} className="text-gray-400 hover:text-white transition-colors" title="Rename Lineage">✏️</button>
                        <button onClick={(e) => handleDeleteFamily(e, fam.id)} className="text-gray-400 hover:text-rose-500 transition-colors" title="Erase Lineage">🗑️</button>
                      </div>
                    </div>

                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest z-10 mb-auto mt-1">ID: {fam.id.substring(0,8)}</p>
                    
                    <div className="z-10 flex items-center justify-between w-full mt-4">
                      <span className="text-sm font-medium text-gray-400 group-hover:text-rose-200 transition-colors">Access Workspace</span>
                      <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-rose-500 transition-colors text-white font-bold group-hover:rotate-45 transform duration-300">↗</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Right Column: Forge Lineage */}
          <section className="space-y-6">
            <h3 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
              Establish Origin
              <span className="h-px bg-gradient-to-r from-rose-500 to-transparent flex-1 ml-4 opacity-50"></span>
            </h3>

            <div className="bg-black/40 border border-white/10 p-8 rounded-2xl backdrop-blur-xl shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 to-orange-500"></div>
              
              <p className="text-sm text-gray-400 leading-relaxed mb-8">
                Initialize a brand new family tree. This acts as the anchor point for your generations, media, and chronologies.
              </p>

              <form onSubmit={handleCreateFamily} className="space-y-6">
                <div className="space-y-2 group">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest group-focus-within:text-rose-500 transition-colors">Lineage Name</label>
                  <input
                    placeholder="e.g. The Targaryen Ancestry"
                    value={newFamilyName}
                    onChange={(e) => setNewFamilyName(e.target.value)}
                    required
                    className="w-full bg-white/5 border-b-2 border-white/10 px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-rose-500 focus:bg-white/10 transition-all rounded-t-md"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-white text-black font-bold tracking-widest uppercase text-sm hover:bg-rose-500 hover:text-white transition-all duration-300 disabled:opacity-50 shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(225,29,72,0.4)] flex items-center justify-center gap-3"
                >
                  {loading ? (
                    <span className="animate-pulse">Forging...</span>
                  ) : (
                    <>Forge Lineage <span>+</span></>
                  )}
                </button>
              </form>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;