import React, { useState } from 'react';
import api from '../api/api';

const FamilyInvite = ({ familyId }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('viewer');
  const [status, setStatus] = useState({ type: '', message: '' });

  const handleInvite = async (e) => {
    e.preventDefault();
    setStatus({ type: '', message: '' });
    
    if (!familyId) {
      return setStatus({ type: 'error', message: 'No family context selected.' });
    }

    try {
      // POST /families/invite endpoint assumption
      await api.post(`/families/invite`, {
        family_id: familyId,
        email,
        role
      });
      setStatus({ type: 'success', message: 'Invitation sent successfully!' });
      setEmail('');
      setRole('viewer');
    } catch (error) {
      console.error('Invite error:', error);
      setStatus({ type: 'error', message: error.response?.data?.message || 'Failed to send invite.' });
    }
  };

  return (
    <div className="mt-4 border-t pt-4">
      <h4 className="text-sm font-semibold text-gray-700 mb-2">Collaborate (Invite Member)</h4>
      <form onSubmit={handleInvite} className="flex flex-col gap-2">
        <input 
          type="email" 
          placeholder="Collaborator's Email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="px-3 py-1.5 border rounded text-sm focus:outline-none focus:ring focus:border-blue-300"
          required
        />
        <select 
          value={role} 
          onChange={(e) => setRole(e.target.value)}
          className="px-3 py-1.5 border rounded text-sm bg-white focus:outline-none focus:ring focus:border-blue-300"
        >
          <option value="viewer">Viewer</option>
          <option value="editor">Editor</option>
          <option value="owner">Owner</option>
        </select>
        <button 
          type="submit" 
          className="bg-indigo-600 text-white py-1.5 rounded text-sm font-medium hover:bg-indigo-700 transition"
        >
          Send Invite
        </button>
      </form>
      {status.message && (
        <p className={`mt-2 text-xs font-medium ${status.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
          {status.message}
        </p>
      )}
    </div>
  );
};

export default FamilyInvite;
