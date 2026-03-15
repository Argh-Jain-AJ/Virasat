import React from 'react';
import { Handle, Position } from 'reactflow';

const PersonNode = ({ data }) => {
  // data contains the person info passed from FamilyTree
  const { first_name, last_name, gender, birth_date, photo_url } = data.person || {};
  
  // Parse birth year
  const birthYear = birth_date ? new Date(birth_date).getFullYear() : 'Unknown';
  
  // Fallback avatar based on gender
  const avatarBg = gender?.toLowerCase() === 'female' ? '#fbcfe8' : '#bfdbfe';

  return (
    <div 
      className="person-node shadow-md bg-white border border-gray-200 rounded-lg p-3 w-48 text-center"
      style={{
        padding: '10px',
        border: '1px solid #ddd',
        borderRadius: '8px',
        background: '#fff',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        width: '180px'
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: '#555' }} />
      
      <div 
        style={{ 
          width: '50px', 
          height: '50px', 
          borderRadius: '50%', 
          margin: '0 auto 10px',
          background: photo_url ? `url(${photo_url}) center/cover` : avatarBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '20px',
          fontWeight: 'bold',
          color: '#555'
        }}
      >
        {!photo_url && (first_name ? first_name[0].toUpperCase() : '?')}
      </div>
      
      <div style={{ fontWeight: 'bold' }}>{first_name} {last_name}</div>
      <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
        {birthYear} • {gender || 'Unspecified'}
      </div>
      
      <Handle type="source" position={Position.Bottom} style={{ background: '#555' }} />
    </div>
  );
};

export default PersonNode;
