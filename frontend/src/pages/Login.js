import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/api';
import bgImage from '../assets/hero-bg.png';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const navigate = useNavigate();

  // Track mouse for the interactive "Alive" spotlight lighting effect
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    // temporary bypass
    localStorage.setItem("token", "demo-token");
    navigate("/dashboard");
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-black text-white overflow-hidden relative selection:bg-rose-500/30">
      
      {/* --- Dynamic Global Spotlight Effect --- */}
      <div 
        className="pointer-events-none absolute inset-0 z-0 opacity-40 transition-opacity duration-500"
        style={{
          background: `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, rgba(225, 29, 72, 0.15), transparent 40%)`
        }}
      />

      {/* --- LEFT SIDE: Brand & Aesthetic (Charles Leclerc Inspired) --- */}
      <div className="relative w-full md:w-3/5 lg:w-2/3 h-64 md:h-screen flex flex-col justify-end p-10 md:p-20 z-10 overflow-hidden group">
        {/* Background Image with Parallax & Dark Overlay */}
        <div 
          className="absolute inset-0 z-[-1] bg-cover bg-center transition-transform duration-[10s] group-hover:scale-105"
          style={{ backgroundImage: `url(${bgImage})` }}
        />
        <div className="absolute inset-0 z-[-1] bg-gradient-to-t from-black via-black/80 to-transparent opacity-90" />
        <div className="absolute inset-0 z-[-1] bg-gradient-to-r from-black/60 to-transparent" />

        <div className="relative animate-fade-in-up">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-500 drop-shadow-2xl">
            KINSPHERE.
          </h1>
          <p className="text-xl md:text-2xl font-light text-rose-100/80 tracking-widest uppercase mb-8 border-l-2 border-rose-500 pl-4">
            Forge Your Legacy.
          </p>

          <div className="max-w-xl backdrop-blur-sm bg-black/20 p-6 rounded-2xl border border-white/5 shadow-2xl">
            <h3 className="text-sm font-bold text-rose-500 tracking-[0.2em] mb-2 uppercase">Why Kinsphere?</h3>
            <p className="text-gray-300 font-light leading-relaxed text-sm md:text-base">
              It’s not just a database. Kinsphere is a <span className="text-white font-medium">living, breathing archive</span>. 
              We transform static genealogy into high-fidelity, interactive constellations. Track deep bloodlines, map chronological memories, and intelligently remind your entire family of the moments that matter most. Because your history deserves to feel alive.
            </p>
          </div>
        </div>
      </div>

      {/* --- RIGHT SIDE: Glassmorphic Auth Form --- */}
      <div className="relative w-full md:w-2/5 lg:w-1/3 flex items-center justify-center p-8 z-10 bg-black/40 backdrop-blur-xl border-l border-white/10 shadow-[-20px_0_50px_rgba(0,0,0,0.5)]">
        <div className="w-full max-w-sm space-y-8 animate-fade-in">
          
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white mb-2">Welcome Back</h2>
            <p className="text-sm text-gray-400">Enter your credentials to access your lineage.</p>
          </div>

          {message && (
            <div className="p-3 bg-red-900/30 border border-red-500/50 rounded-lg text-red-200 text-sm text-center">
              {message}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6 mt-8">
            <div className="space-y-1 group">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest group-focus-within:text-rose-500 transition-colors">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border-b-2 border-white/10 px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-rose-500 focus:bg-white/10 transition-all rounded-t-md"
                placeholder="lineage@kinsphere.com"
                required
              />
            </div>

            <div className="space-y-1 group">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest group-focus-within:text-rose-500 transition-colors">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border-b-2 border-white/10 px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-rose-500 focus:bg-white/10 transition-all rounded-t-md"
                placeholder="••••••••"
                required
              />
            </div>

            <button 
              type="submit" 
              className="w-full py-4 mt-4 bg-white text-black font-bold tracking-widest uppercase text-sm rounded-none hover:bg-rose-500 hover:text-white transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(225,29,72,0.4)]"
            >
              Enter Workspace
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-8">
            Don't have an origin yet? <Link to="/register" className="text-white hover:text-rose-400 font-semibold underline decoration-white/30 underline-offset-4 transition-colors">Begin here.</Link>
          </p>
        </div>
      </div>
      
    </div>
  );
};

export default Login;
