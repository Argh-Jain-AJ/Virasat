import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  createPerson, 
  createRelationship, 
  getFamilyTree 
} from '../services/familyService';
import FamilyTree from '../components/FamilyTree';
import SearchBar from '../components/SearchBar';
import FamilyInvite from '../components/FamilyInvite';
import FamilyTimeline from '../components/FamilyTimeline';
import GedcomImport from '../components/GedcomImport';

const FamilyTreePage = () => {
  const navigate = useNavigate();
  
  const [selectedFamily, setSelectedFamily] = useState('');
  const [treeData, setTreeData] = useState({ nodes: [], edges: [] });
  const [error, setError] = useState('');

  // Form states
  const [personData, setPersonData] = useState({
    first_name: '',
    last_name: '',
    gender: '',
    birth_place: ''
  });
  const [relationshipData, setRelationshipData] = useState({
    person1_id: '',
    person2_id: '',
    relationship_type: ''
  });

  useEffect(() => {
    const familyId = localStorage.getItem('selectedFamily');
    if (!familyId) {
      navigate('/dashboard'); // redirect if accessed without context
      return;
    }
    setSelectedFamily(familyId);
    fetchTree(familyId);
  }, [navigate]);

  const fetchTree = async (familyId) => {
    try {
      const data = await getFamilyTree(familyId);
      setTreeData({
        nodes: data.nodes || [],
        edges: data.edges || []
      });
    } catch (err) {
      console.error(err);
      setError('Failed to fetch family tree.');
    }
  };

  const handleCreatePerson = async (e) => {
    e.preventDefault();
    if (!selectedFamily) return;
    
    try {
      await createPerson({ ...personData, family_id: selectedFamily });
      setPersonData({ first_name: '', last_name: '', gender: '', birth_place: '' });
      fetchTree(selectedFamily);
    } catch (err) {
      setError('Failed to create person.');
    }
  };

  const handleCreateRelationship = async (e) => {
    e.preventDefault();
    if (!selectedFamily) return;

    try {
      await createRelationship(relationshipData);
      setRelationshipData({ person1_id: '', person2_id: '', relationship_type: '' });
      fetchTree(selectedFamily);
    } catch (err) {
      setError('Failed to create relationship.');
    }
  };

  const handleNodeClick = (personId) => {
    navigate(`/person/${personId}`);
  };

  const handleSearch = async (query) => {
    try {
      const matchedNode = treeData.nodes.find(n => 
        n.data?.person?.first_name?.toLowerCase().includes(query.toLowerCase()) || 
        n.data?.person?.last_name?.toLowerCase().includes(query.toLowerCase())
      );
      
      if (matchedNode) {
        const updatedNodes = treeData.nodes.map(n => ({
          ...n,
          style: n.id === matchedNode.id ? { ...n.style, border: '3px solid #3b82f6', boxShadow: '0 0 15px rgba(59,130,246,0.6)' } : { ...n.style, border: '1px solid #ddd', boxShadow: 'none' }
        }));
        setTreeData({ ...treeData, nodes: updatedNodes });
      } else {
        alert('No family member found matching your search in this tree.');
      }
    } catch (err) {
      console.error('Search error', err);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Family Workspace</h1>
        <div className="flex gap-4">
          <SearchBar onSearch={handleSearch} />
          <button 
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-100 transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>

      {error && <p className="text-red-600 mb-4 bg-red-50 p-3 rounded border border-red-200">{error}</p>}

      <div className="mb-6 bg-white p-5 rounded-xl shadow border border-gray-100">
        <h3 className="text-lg font-semibold mb-3 border-b pb-2">Family Settings</h3>
        <FamilyInvite familyId={selectedFamily} />
      </div>

      <GedcomImport familyId={selectedFamily} onImportSuccess={(importedTreeData) => setTreeData(importedTreeData)} />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* --- Add Family Member Section --- */}
        <section className="bg-white p-5 rounded-xl shadow border border-gray-100">
          <h3 className="text-lg font-semibold mb-3 border-b pb-2">Add Family Member</h3>
          <form onSubmit={handleCreatePerson} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input placeholder="First Name" value={personData.first_name} onChange={e => setPersonData({...personData, first_name: e.target.value})} className="px-3 py-2 border rounded" required />
            <input placeholder="Last Name" value={personData.last_name} onChange={e => setPersonData({...personData, last_name: e.target.value})} className="px-3 py-2 border rounded" />
            <input placeholder="Gender (Male/Female)" value={personData.gender} onChange={e => setPersonData({...personData, gender: e.target.value})} className="px-3 py-2 border rounded" />
            <input placeholder="Birth Place" value={personData.birth_place} onChange={e => setPersonData({...personData, birth_place: e.target.value})} className="px-3 py-2 border rounded" />
            <button type="submit" className="col-span-1 sm:col-span-2 bg-green-600 text-white py-2 rounded font-medium hover:bg-green-700 transition">Add Member</button>
          </form>
        </section>

        {/* --- Add Relationship Section --- */}
        <section className="bg-white p-5 rounded-xl shadow border border-gray-100">
          <h3 className="text-lg font-semibold mb-3 border-b pb-2">Add Relationship</h3>
          <form onSubmit={handleCreateRelationship} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select value={relationshipData.person1_id} onChange={e => setRelationshipData({...relationshipData, person1_id: e.target.value})} className="px-3 py-2 border rounded bg-white" required>
              <option value="">-- Select Person 1 --</option>
              {treeData.nodes.filter(n => n.data?.person).map(n => (
                <option key={n.data.person.id} value={n.data.person.id}>
                  {n.data.person.first_name} {n.data.person.last_name || ''}
                </option>
              ))}
            </select>
            <select value={relationshipData.person2_id} onChange={e => setRelationshipData({...relationshipData, person2_id: e.target.value})} className="px-3 py-2 border rounded bg-white" required>
              <option value="">-- Select Person 2 --</option>
              {treeData.nodes.filter(n => n.data?.person).map(n => (
                <option key={n.data.person.id} value={n.data.person.id}>
                  {n.data.person.first_name} {n.data.person.last_name || ''}
                </option>
              ))}
            </select>
            <select value={relationshipData.relationship_type} onChange={e => setRelationshipData({...relationshipData, relationship_type: e.target.value})} className="col-span-1 sm:col-span-2 px-3 py-2 border rounded bg-white" required>
                <option value="">-- Relationship Type --</option>
                <option value="parent">Parent</option>
                <option value="child">Child</option>
                <option value="spouse">Spouse</option>
                <option value="sibling">Sibling</option>
            </select>
            <button type="submit" className="col-span-1 sm:col-span-2 bg-purple-600 text-white py-2 rounded font-medium hover:bg-purple-700 transition">Add Relationship</button>
          </form>
        </section>
      </div>

      {/* --- Visualizations (Tree & Timeline) --- */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <section className="xl:col-span-2 bg-white p-1 rounded-xl shadow border border-gray-100 overflow-hidden">
          <div className="bg-gray-50 p-4 border-b flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-800">Family Tree Visualization</h3>
          </div>
          <FamilyTree nodes={treeData.nodes} edges={treeData.edges} onNodeClick={handleNodeClick} />
        </section>

        <section className="bg-white p-5 rounded-xl shadow border border-gray-100 h-[600px] overflow-y-auto">
          <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4 sticky top-0 bg-white z-10">Chronological Family History</h3>
          <FamilyTimeline familyId={selectedFamily} />
        </section>
      </div>

    </div>
  );
};

export default FamilyTreePage;
