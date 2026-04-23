import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getFamilies, createFamily, deleteFamily, updateFamily } from "../services/familyService";
import bgImage from "../assets/hero-bg.png";
import CanvasNetwork from "../components/CanvasNetwork";

// ─────────────────────────────────────────────
// MINI LINEAGE CANVAS — renders inside each card on hover
// ─────────────────────────────────────────────
const CardLineageCanvas = ({ active }) => {
  const canvasRef = useRef(null);
  const animRef   = useRef(null);
  const nodesRef  = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    // Fixed seed nodes so they don't re-randomise every render
    if (nodesRef.current.length === 0) {
      for (let i = 0; i < 10; i++) {
        nodesRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          r: Math.random() * 1.8 + 1,
          glow: Math.random(),
          glowDir: Math.random() > 0.5 ? 0.025 : -0.025,
        });
      }
    }

    const draw = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const alpha = active ? 1 : 0.3;

      nodesRef.current.forEach(n => {
        n.glow += n.glowDir;
        if (n.glow > 1 || n.glow < 0) n.glowDir *= -1;

        ctx.beginPath();
        ctx.arc(n.x * (canvas.width / 320), n.y * (canvas.height / 200), n.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(225, 29, 72, ${n.glow * 0.8 * alpha})`;
        ctx.shadowBlur = active ? 10 : 4;
        ctx.shadowColor = "rgba(225,29,72,0.6)";
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      const ns = nodesRef.current;
      for (let i = 0; i < ns.length; i++) {
        for (let j = i + 1; j < ns.length; j++) {
          const ax = ns[i].x * (canvas.width / 320);
          const ay = ns[i].y * (canvas.height / 200);
          const bx = ns[j].x * (canvas.width / 320);
          const by = ns[j].y * (canvas.height / 200);
          const dist = Math.hypot(ax - bx, ay - by);
          if (dist < 90) {
            ctx.beginPath();
            ctx.moveTo(ax, ay);
            ctx.lineTo(bx, by);
            ctx.strokeStyle = `rgba(225, 29, 72, ${(0.18 - dist / 500) * alpha})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }

      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none rounded-2xl"
      style={{ opacity: active ? 1 : 0.25, transition: "opacity 0.4s ease" }}
    />
  );
};

// ─────────────────────────────────────────────
// LINEAGE CARD
// ─────────────────────────────────────────────
const LineageCard = ({ fam, isLastOpened, onSelect, onUpdate, onDelete, formatDate, transitioning }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={() => onSelect(fam.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`
        group cursor-pointer p-6 rounded-2xl
        bg-gradient-to-br from-black/60 to-black/40
        border transition-all duration-500 ease-out
        shadow-[0_10px_20px_rgba(0,0,0,0.5)]
        flex flex-col h-56 backdrop-blur-2xl relative overflow-hidden
        ${transitioning ? "scale-105 opacity-0" : "scale-100 opacity-100"}
        ${hovered ? "-translate-y-2 shadow-[0_25px_50px_rgba(225,29,72,0.2)]" : ""}
        ${isLastOpened
          ? "border-rose-500/40 shadow-[0_0_20px_rgba(225,29,72,0.12)]"
          : "border-white/5 hover:border-rose-500/30"}
      `}
      style={{ transition: transitioning ? "transform 0.45s ease, opacity 0.45s ease" : "all 0.5s ease" }}
    >
      {/* Living mini-canvas background */}
      <CardLineageCanvas active={hovered} />

      {/* Dark overlay so text stays crisp */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/30 to-black/70 pointer-events-none rounded-2xl z-[1]" />

      {/* Hover gradient wash */}
      <div className={`absolute inset-0 bg-gradient-to-br from-rose-500/8 to-transparent pointer-events-none rounded-2xl z-[1] transition-opacity duration-400 ${hovered ? "opacity-100" : "opacity-0"}`} />

      {/* Large letter watermark */}
      <div className="absolute top-0 right-0 p-4 pointer-events-none z-[1]">
        <span className={`text-8xl font-black text-rose-500 mix-blend-screen transition-opacity duration-400 ${hovered ? "opacity-15" : "opacity-5"}`}>
          {fam.family_name[0].toUpperCase()}
        </span>
      </div>

      {/* Card content */}
      <div className="z-[5] flex justify-between items-start w-full gap-2 relative">
        <div className="flex-1">
          {isLastOpened && (
            <span className="inline-block px-2 py-0.5 bg-rose-500/10 border border-rose-500/30 rounded-md text-[10px] font-black tracking-widest text-rose-400 uppercase mb-3">
              Last Opened
            </span>
          )}
          <h4 className={`text-2xl font-bold mb-1 tracking-tight truncate pr-2 transition-colors duration-300 ${hovered ? "text-white" : "text-gray-100"}`}>
            {fam.family_name}
          </h4>
          <p className="text-xs text-gray-400 font-medium tracking-wide leading-relaxed">
            {fam.member_count || 0} family members recorded<br />
            Last chapter added {formatDate(fam.updated_at)}
          </p>
        </div>

        <div className={`flex gap-2 transition-opacity duration-300 bg-black/60 p-1.5 rounded-lg border border-white/5 backdrop-blur-md shadow-lg shrink-0 ${hovered ? "opacity-100" : "opacity-0"}`}>
          <button onClick={(e) => onUpdate(e, fam.id, fam.family_name)} className="text-gray-400 hover:text-white transition-colors p-1" title="Rename">✏️</button>
          <button onClick={(e) => onDelete(e, fam.id)} className="text-gray-400 hover:text-rose-500 transition-colors p-1" title="Delete">🗑️</button>
        </div>
      </div>

      <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest z-[5] mb-auto mt-4 mix-blend-screen relative">
        ID: {fam.id.substring(0, 8)}
      </p>

      <div className="z-[5] flex items-center justify-between w-full mt-4 pt-4 border-t border-white/5 relative">
        <span className={`text-sm font-bold transition-all duration-300 drop-shadow-sm underline-offset-4 ${hovered ? "text-rose-300 underline decoration-rose-500/30" : "text-gray-400"}`}>
          Enter this story
        </span>
        <span className={`w-8 h-8 rounded-full border flex items-center justify-center text-white font-black transition-all duration-400 shadow-inner ${hovered ? "bg-rose-500 border-rose-400 translate-x-1.5 shadow-[0_0_15px_rgba(225,29,72,0.6)]" : "bg-white/5 border-white/5"}`}>
          →
        </span>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────
const Dashboard = () => {
  const navigate = useNavigate();

  const [families, setFamilies]       = useState([]);
  const [error, setError]             = useState("");
  const [newFamilyName, setNewFamilyName] = useState("");
  const [loading, setLoading]         = useState(false);
  const [mousePos, setMousePos]       = useState({ x: 0, y: 0 });
  const [transitioningId, setTransitioningId] = useState(null);

  useEffect(() => {
    fetchFamilies();
    const handleMouseMove = (e) =>
      setMousePos({ x: (e.clientX / window.innerWidth) * 100, y: (e.clientY / window.innerHeight) * 100 });
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const fetchFamilies = async () => {
    try {
      const response = await getFamilies();
      const familyList = response?.data || response || [];
      familyList.sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0));
      setFamilies(familyList);
    } catch (err) {
      setError("Failed to fetch lineages.");
    }
  };

  // Smooth zoom-fade transition before navigating
  const handleFamilySelect = useCallback((familyId) => {
    if (!familyId) return;
    setTransitioningId(familyId);
    localStorage.setItem("selectedFamily", familyId);
    setTimeout(() => navigate("/family-tree"), 450);
  }, [navigate]);

  const handleDeleteFamily = async (e, familyId) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to permanently obliterate this lineage?")) {
      try {
        await deleteFamily(familyId);
        if (localStorage.getItem("selectedFamily") === familyId) localStorage.removeItem("selectedFamily");
        fetchFamilies();
      } catch { setError("Failed to delete lineage."); }
    }
  };

  const handleUpdateFamily = async (e, familyId, currentName) => {
    e.stopPropagation();
    const newName = window.prompt("Enter new lineage name:", currentName);
    if (newName && newName.trim() !== currentName) {
      try {
        await updateFamily(familyId, { family_name: newName.trim() });
        fetchFamilies();
      } catch { setError("Failed to rename lineage."); }
    }
  };

  const handleCreateFamily = async (e) => {
    e.preventDefault();
    if (!newFamilyName.trim()) { setError("Lineage name cannot be empty."); return; }
    setLoading(true);
    setError("");
    try {
      const response = await createFamily({ family_name: newFamilyName.trim() });
      const created = response?.data || response;
      if (!created?.id) throw new Error("Invalid family response");
      localStorage.setItem("selectedFamily", created.id);
      navigate("/family-tree");
    } catch { setError("Failed to forge new lineage."); }
    finally { setLoading(false); }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Recently";
    return new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const lastOpenedId = useMemo(() => {
    const selected = localStorage.getItem("selectedFamily");
    if (selected && families.some(f => f.id === selected)) return selected;
    return families.length > 0 ? families[0].id : null;
  }, [families]);

  return (
    <>
      <style>{`
        @keyframes statusPulse {
          0%, 100% { transform: scale(1); opacity: 0.8; box-shadow: 0 0 5px rgba(52,211,153,0.4); }
          50% { transform: scale(1.15); opacity: 1; box-shadow: 0 0 16px rgba(52,211,153,0.9); }
        }
        .animate-status-dot { animation: statusPulse 2.5s ease-in-out infinite; }
      `}</style>

      <div className="min-h-screen bg-black text-white relative overflow-hidden selection:bg-rose-500/30 font-sans flex flex-col items-center">

        {/* Mouse-tracking spotlight */}
        <div
          className="pointer-events-none fixed inset-0 z-0 opacity-30 transition-opacity duration-500"
          style={{ background: `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, rgba(225,29,72,0.22), transparent 45%)` }}
        />

        {/* Background image */}
        <div
          className="fixed inset-0 z-[-2] bg-cover bg-center opacity-40 brightness-50"
          style={{ backgroundImage: `url(${bgImage})` }}
        />
        {/* Global canvas network */}
        <CanvasNetwork mousePos={mousePos} />
        <div className="fixed inset-0 z-[-1] bg-gradient-to-b from-black/80 via-black/50 to-black/90 pointer-events-none" />

        {/* Main content */}
        <div className="z-10 w-full max-w-7xl p-6 md:p-12 mb-20">

          {/* ── HEADER ── */}
          <header className="mb-14 border-b border-white/10 pb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 animate-in fade-in slide-in-from-top-4 duration-700 fill-mode-both">
            <div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-300 to-gray-500 drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                Where Your Story Continues.
              </h1>
              <p className="text-sm md:text-base text-gray-400 mt-3 font-medium tracking-wide">
                Choose a lineage to explore or begin a new chapter.
              </p>
            </div>

            {/* Emotional stats block */}
            <div className="flex gap-4 md:gap-8 bg-black/40 backdrop-blur-xl border border-white/5 px-6 py-4 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
              <div className="flex flex-col">
                <span className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">Active Stories</span>
                <span className="text-2xl font-black text-white drop-shadow-md">{families.length}</span>
              </div>
              <div className="w-px bg-white/10" />
              <div className="flex flex-col">
                <span className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">Legacy Status</span>
                <span className="text-sm font-bold text-emerald-400 flex items-center gap-2 mt-1 tracking-wide">
                  <span className="relative w-2.5 h-2.5">
                    <span className="absolute inset-0 rounded-full bg-emerald-400 animate-status-dot" />
                    <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-20" />
                  </span>
                  Preserving your legacy
                </span>
              </div>
            </div>
          </header>

          {error && (
            <div className="mb-8 p-4 bg-red-900/40 border border-red-500/50 rounded-xl text-red-100 text-sm font-medium flex items-center gap-3 backdrop-blur-md animate-in fade-in zoom-in-95 duration-300">
              <span className="text-xl">⚠️</span> {error}
            </div>
          )}

          {/* ── GRID ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

            {/* Left: Lineage cards */}
            <section className="lg:col-span-2 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150 fill-mode-both">
              <h3 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3 drop-shadow-md">
                Your Ancestral Horizons
                <span className="h-px bg-gradient-to-r from-rose-500 to-transparent flex-1 ml-4 opacity-30" />
              </h3>

              {families.length === 0 ? (
                <div className="bg-black/40 border border-white/5 p-10 rounded-2xl flex flex-col items-center justify-center text-center backdrop-blur-2xl shadow-xl">
                  <div className="text-5xl mb-4 opacity-40">🧭</div>
                  <h4 className="text-xl font-bold text-gray-200 mb-2">No Lineages Found</h4>
                  <p className="text-gray-400 text-sm max-w-sm">You haven't established any family trees yet. Begin a new chapter on the right.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {families.map((fam) => (
                      <LineageCard
                        key={fam.id}
                        fam={fam}
                        isLastOpened={fam.id === lastOpenedId}
                        onSelect={handleFamilySelect}
                        onUpdate={handleUpdateFamily}
                        onDelete={handleDeleteFamily}
                        formatDate={formatDate}
                        transitioning={transitioningId === fam.id}
                      />
                    ))}
                  </div>

                  {/* Suggested actions */}
                  <div className="mt-10 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Suggested Actions</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {[
                        { icon: "👤", label: "Add your first ancestor", accent: "rose" },
                        { icon: "📸", label: "Upload a family memory",  accent: "blue" },
                        { icon: "🌳", label: "Expand your lineage",     accent: "emerald" },
                      ].map(({ icon, label, accent }) => (
                        <div
                          key={label}
                          onClick={() => handleFamilySelect(lastOpenedId)}
                          className={`p-4 bg-black/40 border border-white/5 rounded-xl hover:bg-white/5 hover:border-${accent}-500/30 transition-all duration-300 cursor-pointer flex flex-col gap-2 group shadow-lg backdrop-blur-md`}
                        >
                          <span className="text-xl group-hover:scale-110 transition-transform origin-left">{icon}</span>
                          <p className="text-xs font-medium text-gray-300 group-hover:text-white transition-colors">{label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* Right: Create lineage */}
            <section id="establish-origin" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 fill-mode-both">
              <h3 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3 drop-shadow-md">
                Begin a New Chapter
                <span className="h-px bg-gradient-to-r from-rose-500 to-transparent flex-1 ml-4 opacity-30" />
              </h3>

              <div className="bg-black/40 border border-white/5 p-8 rounded-2xl backdrop-blur-2xl shadow-[-15px_0_40px_rgba(0,0,0,0.6)] relative overflow-hidden group transition-all duration-500 hover:shadow-[0_0_50px_rgba(225,29,72,0.18)] hover:border-rose-500/30">
                <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-rose-600 via-rose-500 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />

                <div className="mb-8 relative z-10">
                  <p className="text-sm text-gray-300 leading-relaxed font-medium">
                    Start a new lineage and preserve stories for generations to come.
                  </p>
                  <p className="text-[10px] text-rose-500/80 font-black uppercase tracking-widest mt-4 group-hover:text-rose-400 transition-colors">
                    Preserve Your Legacy
                  </p>
                </div>

                <form onSubmit={handleCreateFamily} className="space-y-6 relative z-10">
                  <div className="space-y-1.5 group/input">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest group-focus-within/input:text-rose-400 transition-colors duration-300">
                      Lineage Name
                    </label>
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
                    className="w-full py-4 mt-2 bg-gradient-to-r from-rose-600 to-rose-500 border border-rose-400/30 text-white font-black tracking-[0.2em] uppercase text-xs rounded-xl shadow-[0_5px_15px_rgba(225,29,72,0.3)] hover:shadow-[0_15px_40px_rgba(225,29,72,0.55)] hover:from-rose-500 hover:to-orange-500 hover:scale-[1.02] active:scale-[0.97] transition-all duration-500 disabled:opacity-50 flex items-center justify-center gap-3 relative overflow-hidden group/btn"
                  >
                    {loading ? (
                      <span className="animate-pulse">Forging...</span>
                    ) : (
                      <>
                        <div className="absolute inset-0 bg-white/20 blur-md opacity-0 group-hover/btn:opacity-100 group-hover/btn:animate-pulse transition-opacity duration-300" />
                        <span className="relative z-10 flex items-center gap-2">Begin this Story <span className="text-xl leading-none -mt-0.5">+</span></span>
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