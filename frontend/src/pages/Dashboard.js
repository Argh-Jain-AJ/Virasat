import React, { useState, useEffect } from 'react';
import { 
  getFamilies, 
  createFamily, 
  createPerson, 
  createRelationship, 
  getFamilyTree 
} from '../services/familyService';
import FamilyTree from '../components/FamilyTree';

const Dashboard = () => {
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
      setTreeData({
        nodes: data.nodes || [],
        edges: data.edges || []
      });
    } catch (err) {
      console.error(err);
      setError('Failed to fetch family tree (Note: Check if endpoint /family-tree/:id exists in backend).');
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

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <h1>Dashboard</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        
        {/* --- Create Family Section --- */}
        <section style={sectionStyle}>
          <h3>Create Family</h3>
          <form onSubmit={handleCreateFamily}>
            <div>
              <input 
                placeholder="Family Name" 
                value={newFamilyName} 
                onChange={(e) => setNewFamilyName(e.target.value)} 
                required 
              />
            </div>
            <button type="submit" style={{ marginTop: '10px' }}>Create</button>
          </form>
        </section>

        {/* --- Family Selection --- */}
        <section style={sectionStyle}>
          <h3>Select Family Context</h3>
          <select value={selectedFamily} onChange={handleFamilySelect}>
            <option value="">-- Select a Family --</option>
            {families.map(fam => (
              <option key={fam.id} value={fam.id}>{fam.family_name}</option>
            ))}
          </select>
        </section>

      </div>

      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginTop: '20px' }}>
        
        {/* --- Add Family Member Section --- */}
        <section style={sectionStyle}>
          <h3>Add Family Member</h3>
          <form onSubmit={handleCreatePerson}>
            <div><input placeholder="First Name" value={personData.first_name} onChange={e => setPersonData({...personData, first_name: e.target.value})} required /></div>
            <div><input placeholder="Last Name" value={personData.last_name} onChange={e => setPersonData({...personData, last_name: e.target.value})} /></div>
            <div><input placeholder="Gender" value={personData.gender} onChange={e => setPersonData({...personData, gender: e.target.value})} /></div>
            <div><input placeholder="Birth Place" value={personData.birth_place} onChange={e => setPersonData({...personData, birth_place: e.target.value})} /></div>
            <button type="submit" style={{ marginTop: '10px' }} disabled={!selectedFamily}>Add Member</button>
          </form>
        </section>

        {/* --- Add Relationship Section --- */}
        <section style={sectionStyle}>
          <h3>Add Relationship</h3>
          <form onSubmit={handleCreateRelationship}>
            <div><input placeholder="Person 1 ID" value={relationshipData.person1_id} onChange={e => setRelationshipData({...relationshipData, person1_id: e.target.value})} required /></div>
            <div><input placeholder="Person 2 ID" value={relationshipData.person2_id} onChange={e => setRelationshipData({...relationshipData, person2_id: e.target.value})} required /></div>
            <div>
              <select value={relationshipData.relationship_type} onChange={e => setRelationshipData({...relationshipData, relationship_type: e.target.value})} required>
                <option value="">-- Type --</option>
                <option value="parent">Parent</option>
                <option value="child">Child</option>
                <option value="spouse">Spouse</option>
                <option value="sibling">Sibling</option>
              </select>
            </div>
            <button type="submit" style={{ marginTop: '10px' }} disabled={!selectedFamily}>Add Relationship</button>
          </form>
        </section>

      </div>

      {/* --- Family Tree Visualization --- */}
      <section style={{ ...sectionStyle, width: '100%', marginTop: '20px' }}>
        <h3>Family Tree Visualization</h3>
        {selectedFamily ? (
          <FamilyTree nodes={treeData.nodes} edges={treeData.edges} />
        ) : (
          <p>Select a family to view the tree.</p>
        )}
      </section>

    </div>
  );
};

const sectionStyle = {
  border: '1px solid #ddd',
  padding: '15px',
  borderRadius: '5px',
  flex: '1',
  minWidth: '250px'
};

export default Dashboard;
