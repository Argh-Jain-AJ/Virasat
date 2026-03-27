import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import bgImage from '../assets/hero-bg.png';
import api from '../api/api';

const Login = () => {
  const [email, setEmail] = useState('demo@demo.com');
  const [password, setPassword] = useState('password123');
  const [message, setMessage] = useState('');
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const navigate = useNavigate();

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

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem("token", res.data.token);
      navigate("/dashboard");
    } catch (err) {
      setMessage(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <>
      <style>
        {`
          @keyframes verySlowPulse {
            0%, 100% { opacity: 0.15; transform: scale(1); }
            50% { opacity: 0.25; transform: scale(1.05); }
          }
          .animate-slow-pulse {
            animation: verySlowPulse 12s ease-in-out infinite;
          }
        `}
      </style>
      
      <div className="flex flex-col md:flex-row min-h-screen bg-black text-white overflow-hidden relative selection:bg-rose-500/30">
        
        {/* --- Background Micro-Animation (Extremely Slow) --- */}
        <div 
          className="pointer-events-none absolute inset-0 z-0 animate-slow-pulse"
          style={{
            background: `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, rgba(225, 29, 72, 0.4), transparent 50%)`
          }}
        />

        {/* --- LEFT SIDE: Brand Experience --- */}
        <div className="relative w-full md:w-3/5 lg:w-2/3 h-64 md:h-screen flex flex-col justify-end p-10 md:p-20 z-10 overflow-hidden group">
          {/* Background Network Image */}
          <div 
            className="absolute inset-0 z-[-1] bg-cover bg-center transition-transform duration-[30s] ease-out group-hover:scale-110"
            style={{ backgroundImage: `url(${bgImage})` }}
          />
          <div className="absolute inset-0 z-[-1] bg-gradient-to-t from-black via-black/80 to-transparent opacity-95" />
          <div className="absolute inset-0 z-[-1] bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
          
          <div className="relative animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter mb-8 text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-100 to-gray-400 drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]">
              VIRASAT.AI
            </h1>
            <p className="text-xl md:text-2xl font-medium text-white tracking-[0.15em] uppercase mb-12 border-l-2 border-rose-500 pl-5 drop-shadow-md">
              Every Family Has a Story. <br className="hidden md:block" />
              <span className="font-black text-rose-100">Preserve Yours.</span>
            </p>

            <div className="max-w-xl backdrop-blur-md bg-black/40 p-8 rounded-3xl border border-white/5 shadow-[0_10px_40px_rgba(0,0,0,0.5)] transition-all duration-500 hover:bg-black/50 hover:border-rose-500/20 hover:-translate-y-1 hover:shadow-[0_15px_40px_rgba(225,29,72,0.1)]">
              <h3 className="text-sm font-black text-rose-500 tracking-[0.2em] mb-3 uppercase flex items-center gap-2 drop-shadow-sm">
                <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(225,29,72,0.8)]"></span>
                Why Virasat?
              </h3>
              <p className="text-gray-100 font-light leading-relaxed text-sm md:text-base">
                It’s not just a database. Virasat.ai is a <span className="text-white font-bold drop-shadow-lg">living, breathing archive</span>. 
                We transform static genealogy into high-fidelity, interactive constellations. Track deep bloodlines, map chronological memories, and intelligently preserve the moments that matter most. Because your history deserves to live forever.
              </p>
            </div>
          </div>
        </div>

        {/* --- RIGHT SIDE: Premium Glassmorphic Auth Form --- */}
        <div className="relative w-full md:w-2/5 lg:w-1/3 flex items-center justify-center p-8 md:p-12 z-10 bg-black/60 backdrop-blur-md border-l border-white/5 shadow-[-15px_0_40px_rgba(0,0,0,0.6),-2px_0_20px_rgba(225,29,72,0.05)]">
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-transparent pointer-events-none" />
          
          <div className="w-full max-w-sm space-y-8 relative animate-in fade-in slide-in-from-right-4 duration-500 delay-150 fill-mode-both">
            
            <div className="text-center">
              <h2 className="text-3xl font-black tracking-tight text-white mb-2 drop-shadow-md">Welcome Back</h2>
              <p className="text-sm text-gray-400 font-medium">Enter your credentials to access your lineage.</p>
            </div>

            {message && (
             <div className="p-3 bg-red-900/40 border border-red-500/50 rounded-xl text-red-100 text-sm font-medium text-center shadow-lg">
               {message}
             </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6 mt-8">
              <div className="space-y-1.5 group relative">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest group-focus-within:text-rose-400 transition-colors duration-300 block">Email Address</label>
                <div className="relative flex items-center">
                  <span className="absolute left-4 text-gray-500 group-focus-within:text-rose-400 group-focus-within:drop-shadow-[0_0_8px_rgba(225,29,72,0.8)] transition-all duration-300 pointer-events-none">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 hover:border-white/20 pl-12 pr-4 py-3.5 text-white placeholder-gray-600 focus:outline-none focus:border-rose-500/80 focus:bg-white/10 transition-all duration-300 rounded-xl focus:shadow-[inset_0_2px_10px_rgba(225,29,72,0.05),0_0_15px_rgba(225,29,72,0.25)]"
                    placeholder="lineage@virasat.ai"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5 group relative">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest group-focus-within:text-rose-400 transition-colors duration-300 block">Password</label>
                <div className="relative flex items-center">
                  <span className="absolute left-4 text-gray-500 group-focus-within:text-rose-400 group-focus-within:drop-shadow-[0_0_8px_rgba(225,29,72,0.8)] transition-all duration-300 pointer-events-none">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                  </span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 hover:border-white/20 pl-12 pr-4 py-3.5 text-white placeholder-gray-600 focus:outline-none focus:border-rose-500/80 focus:bg-white/10 transition-all duration-300 rounded-xl focus:shadow-[inset_0_2px_10px_rgba(225,29,72,0.05),0_0_15px_rgba(225,29,72,0.25)]"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full py-4 mt-8 bg-gradient-to-r from-rose-600 to-rose-500 border border-rose-400/30 text-white font-black tracking-[0.2em] uppercase text-xs rounded-xl shadow-[0_5px_15px_rgba(225,29,72,0.3)] hover:shadow-[0_15px_30px_rgba(225,29,72,0.5)] hover:from-rose-500 hover:to-rose-400 hover:scale-[1.02] active:scale-[0.97] transition-all duration-300 relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-white/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative z-10 flex items-center justify-center gap-2">Enter Workspace <span className="text-rose-200 transition-transform duration-300 group-hover:translate-x-1">→</span></span>
              </button>
            </form>

            <div className="pt-8 border-t border-white/5 text-center space-y-4">
              <p className="text-sm font-medium text-gray-400 tracking-wide">
                Don't have an origin yet? <Link to="/register" className="text-rose-500 hover:text-rose-400 font-bold underline decoration-rose-500/30 hover:decoration-rose-400 underline-offset-4 transition-all duration-300 ml-1 drop-shadow-sm">Begin here.</Link>
              </p>
              <p className="text-xs text-gray-500/90 italic font-medium drop-shadow-sm tracking-wide">
                "Your story matters. Keep it alive."
              </p>
            </div>

          </div>
        </div>
        
      </div>
    </>
  );
};

export default Login;
