import React from 'react';
import { Handle, Position } from 'reactflow';

const PersonNode = ({ data }) => {
  const { first_name, last_name, gender, birth_date, death_date, photo_url } = data.person || {};
  
  const birthYear = birth_date ? new Date(birth_date).getFullYear() : 'Unknown';
  const deathYear = death_date ? new Date(death_date).getFullYear() : '';
  const lifespan = deathYear ? `${birthYear} - ${deathYear}` : `b. ${birthYear}`;
  
  // Dynamic gradients based on gender semantics for a premium aesthetic
  const gradient = gender?.toLowerCase() === 'female' 
    ? 'bg-gradient-to-br from-pink-400 to-rose-500'
    : gender?.toLowerCase() === 'male'
      ? 'bg-gradient-to-br from-blue-400 to-indigo-500'
      : 'bg-gradient-to-br from-emerald-400 to-teal-500';

  const avatarShadow = 'shadow-[0_4px_10px_rgba(0,0,0,0.5)]';
  const isHighlighted = data.highlighted;
  
  const highlightClass = isHighlighted 
    ? 'border-4 border-rose-500 shadow-[0_0_40px_rgba(225,29,72,1)] scale-110 z-50 ring-4 ring-rose-500/50' 
    : 'border border-white/20 hover:border-white/50 hover:shadow-2xl';

  return (
    <div 
      className={`group relative flex flex-col items-center bg-black/80 backdrop-blur-xl rounded-2xl p-5 w-56 text-center transition-all duration-300 hover:scale-[1.03] overflow-hidden ${highlightClass}`}
    >
      {/* Decorative top bar */}
      <div className={`absolute top-0 left-0 w-full h-2 ${gradient} opacity-90`} />

      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !border-2 !border-white !bg-gray-400 !-mt-1" />
      
      <div 
        className={`w-16 h-16 rounded-full mb-3 flex items-center justify-center text-xl font-bold text-white tracking-widest ${!photo_url ? gradient : ''} ${avatarShadow} border-2 border-white`}
        style={photo_url ? { background: `url(${photo_url}) center/cover` } : {}}
      >
        {!photo_url && (first_name ? first_name[0].toUpperCase() : '?')}
      </div>
      
      <div className="font-extrabold text-white text-lg tracking-tight leading-tight">
        {first_name} <span className="text-gray-300 font-semibold">{last_name}</span>
      </div>
      
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest mt-1.5 flex items-center justify-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(225,29,72,0.8)]"></span>
        {lifespan}
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(225,29,72,0.8)]"></span>
      </div>
      
      {gender && (
        <div className="mt-3 px-3 py-1 rounded-full bg-white/10 text-[10px] font-bold text-gray-300 uppercase tracking-wider border border-white/10">
          {gender}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !border-2 !border-white !bg-gray-400 !-mb-1" />
    </div>
  );
};

export default PersonNode;
