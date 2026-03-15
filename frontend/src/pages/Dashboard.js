import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getFamilies, 
  createFamily, 
  createPerson, 
  createRelationship, 
  getFamilyTree 
} from '../services/familyService';
import api from '../api/api';
import FamilyTree from '../components/FamilyTree';
import SearchBar from '../components/SearchBar';
import FamilyInvite from '../components/FamilyInvite';
import FamilyTimeline from '../components/FamilyTimeline';
import GedcomImport from '../components/GedcomImport';

const Dashboard = () => {
  const navigate = useNavigate();

  // State for fetching data
  const [families, setFamilies] = useState([]);
  const [selectedFamily, setSelectedFamily] = useState('');
  const [treeData, setTreeData] = useState({ nodes: [], edges: [] });
  const [error, setError] = useState('');

  // Form states
  const [newFamilyName, setNewFamilyName] = useState('');
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

  // Initial load: Fetch available families
  useEffect(() => {
    fetchFamilies();
  }, []);

  const fetchFamilies = async () => {
    try {
      const data = await getFamilies();
      setFamilies(data);
    } catch (err) {
      setError('Failed to fetch families.');
    }
  };

  const fetchTree = async (familyId) => {
    try {
      const data = await getFamilyTree(familyId);
      // We assume backend returns nodes and edges properly format
      setTreeData({
        nodes: data.nodes || [],
        edges: data.edges || []
      });
    } catch (err) {
      console.error(err);
      setError('Failed to fetch family tree.');
    }
  };

  // Handlers
  const handleFamilySelect = (e) => {
    const familyId = e.target.value;
    setSelectedFamily(familyId);
    if (familyId) {
      fetchTree(familyId);
    } else {
      setTreeData({ nodes: [], edges: [] });
    }
  };

  const handleCreateFamily = async (e) => {
    e.preventDefault();
    try {
      await createFamily({ family_name: newFamilyName });
      setNewFamilyName('');
      fetchFamilies(); // Refresh list
    } catch (err) {
      setError('Failed to create family.');
    }
  };

  const handleCreatePerson = async (e) => {
    e.preventDefault();
    if (!selectedFamily) return setError('Please select a family first.');
    
    try {
      await createPerson({ ...personData, family_id: selectedFamily });
      setPersonData({ first_name: '', last_name: '', gender: '', birth_place: '' });
      fetchTree(selectedFamily); // Refresh tree
    } catch (err) {
      setError('Failed to create person.');
    }
  };

  const handleCreateRelationship = async (e) => {
    e.preventDefault();
    if (!selectedFamily) return setError('Please select a family first.');

    try {
      await createRelationship(relationshipData);
      setRelationshipData({ person1_id: '', person2_id: '', relationship_type: '' });
      fetchTree(selectedFamily); // Refresh tree
    } catch (err) {
      setError('Failed to create relationship.');
    }
  };

  const handleNodeClick = (personId) => {
    // Navigate to PersonProfile page from stage 11
    navigate(`/person/${personId}`);
  };

  // --- Search functionality (Stage 13) ---
  const handleSearch = async (query) => {
    try {
      // If we implement the backend exact match, we can find the node ID.
      // Alternatively, we highlight in the current node list:
      const matchedNode = treeData.nodes.find(n => 
        n.data?.person?.first_name?.toLowerCase().includes(query.toLowerCase()) || 
        n.data?.person?.last_name?.toLowerCase().includes(query.toLowerCase())
      );
      
      if (matchedNode) {
        // Highlighting process: mark the styled background of this matched node
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
        <h1 className="text-3xl font-bold text-gray-800">Family Dashboard</h1>
        {selectedFamily && (
          <SearchBar onSearch={handleSearch} />
        )}
      </div>

      {error && <p className="text-red-600 mb-4 bg-red-50 p-3 rounded border border-red-200">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        
        {/* --- Create Family Section --- */}
        <section className="bg-white p-5 rounded-xl shadow border border-gray-100">
          <h3 className="text-lg font-semibold mb-3 border-b pb-2">Create Family</h3>
          <form onSubmit={handleCreateFamily} className="flex flex-col gap-3">
            <input 
              placeholder="Family Name" 
              value={newFamilyName} 
              onChange={(e) => setNewFamilyName(e.target.value)} 
              required 
              className="px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
            />
            <button type="submit" className="bg-blue-600 text-white py-2 rounded font-medium hover:bg-blue-700 transition">
              Create
            </button>
          </form>
        </section>

        {/* --- Family Selection --- */}
        <section className="bg-white p-5 rounded-xl shadow border border-gray-100">
          <h3 className="text-lg font-semibold mb-3 border-b pb-2">Select Family Context</h3>
          <select 
            value={selectedFamily} 
            onChange={handleFamilySelect}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300 bg-white"
          >
            <option value="">-- Select a Family --</option>
            {families.map(fam => (
              <option key={fam.id} value={fam.id}>{fam.family_name}</option>
            ))}
          </select>
          {selectedFamily && <FamilyInvite familyId={selectedFamily} />}
        </section>

      </div>

      {selectedFamily && (
        <>
          <GedcomImport familyId={selectedFamily} onImportSuccess={() => fetchTree(selectedFamily)} />
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
              <input placeholder="Person 1 ID" value={relationshipData.person1_id} onChange={e => setRelationshipData({...relationshipData, person1_id: e.target.value})} className="px-3 py-2 border rounded" required />
              <input placeholder="Person 2 ID" value={relationshipData.person2_id} onChange={e => setRelationshipData({...relationshipData, person2_id: e.target.value})} className="px-3 py-2 border rounded" required />
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
        </>
      )}

      {/* --- Visualizations (Tree & Timeline) --- */}
      {selectedFamily && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Family Tree Configuration */}
          <section className="xl:col-span-2 bg-white p-1 rounded-xl shadow border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">Family Tree Visualization</h3>
            </div>
            <FamilyTree nodes={treeData.nodes} edges={treeData.edges} onNodeClick={handleNodeClick} />
          </section>

          {/* Timeline View Integration */}
          <section className="bg-white p-5 rounded-xl shadow border border-gray-100 h-[600px] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4 sticky top-0 bg-white z-10">Chronological Family History</h3>
            <FamilyTimeline familyId={selectedFamily} />
          </section>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
