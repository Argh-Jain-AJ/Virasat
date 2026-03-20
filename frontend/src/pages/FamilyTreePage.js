import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  createPerson, 
  createRelationship, 
  getFamilyTree 
} from '../services/familyService';
import FamilyTree from '../components/FamilyTree';
import GlobalSearchBar from '../components/SearchBar';
import FamilyInvite from '../components/FamilyInvite';
import FamilyTimeline from '../components/FamilyTimeline';
import GedcomImport from '../components/GedcomImport';
import UpcomingReminders from '../components/UpcomingReminders';
import bgImage from '../assets/hero-bg.png';

const FamilyTreePage = () => {
  const navigate = useNavigate();
  const [selectedFamily, setSelectedFamily] = useState('');
  const [treeData, setTreeData] = useState({ nodes: [], edges: [] });
  const [error, setError] = useState('');
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

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
      navigate('/dashboard');
      return;
    }
    setSelectedFamily(familyId);
    fetchTree(familyId);

    const handleMouseMove = (e) => {
      setMousePos({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
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
      setError('Failed to link family members.');
    }
  };

  const handleNodeClick = (personId) => {
    navigate(`/person/${personId}`);
  };



  return (
    <div className="min-h-screen bg-black text-white relative overflow-x-hidden font-sans selection:bg-rose-500/30">
      
      {/* Dynamic Global Spotlight Effect */}
      <div 
        className="pointer-events-none fixed inset-0 z-0 opacity-40 transition-opacity duration-500"
        style={{ background: `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, rgba(225, 29, 72, 0.15), transparent 45%)` }}
      />

      {/* Background Image Overlay */}
      <div 
        className="fixed inset-0 z-[-1] bg-cover bg-center opacity-30 brightness-50"
        style={{ backgroundImage: `url(${bgImage})` }}
      />
      <div className="fixed inset-0 z-[-1] bg-gradient-to-b from-black/60 via-transparent to-black/90" />

      {/* Main Container */}
      <div className="relative z-10 p-6 md:p-10 max-w-[1600px] mx-auto animate-fade-in">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 pb-6 border-b border-white/10 gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-300 to-gray-500">
              LINEAGE WORKSPACE
            </h1>
            <p className="text-sm font-medium text-rose-500 tracking-[0.3em] uppercase mt-2">
              Kinsphere Origin Node: {selectedFamily.substring(0,8)}
            </p>
          </div>
          <div className="flex gap-4 items-center">
            <div className="bg-white/5 backdrop-blur-md rounded-xl p-1 border border-white/10 shadow-lg">
              <GlobalSearchBar />
            </div>
            <button 
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 border border-white/20 bg-white/5 backdrop-blur-md rounded-xl text-white font-bold tracking-widest uppercase text-xs hover:bg-white hover:text-black transition-all duration-300 shadow-xl"
            >
              Exit Workspace
            </button>
          </div>
        </header>

        {error && (
          <div className="mb-8 p-4 bg-red-900/40 border border-red-500/50 rounded-xl text-red-200 text-sm font-medium flex items-center gap-3 backdrop-blur-md">
            <span className="text-xl">⚠️</span> {error}
          </div>
        )}

        {/* Top Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="bg-black/40 p-6 rounded-3xl shadow-2xl border border-white/10 backdrop-blur-xl">
            <h3 className="text-lg font-bold text-white mb-4 tracking-tight flex items-center gap-2">
              Collaborate <span className="text-rose-500 flex-1 h-px bg-gradient-to-r from-rose-500 to-transparent ml-4 opacity-50"></span>
            </h3>
            <FamilyInvite familyId={selectedFamily} />
          </div>
          
          <div className="bg-black/40 p-6 rounded-3xl shadow-2xl border border-white/10 backdrop-blur-xl">
            <h3 className="text-lg font-bold text-white mb-4 tracking-tight flex items-center gap-2">
              Upcoming Ancestral Events <span className="text-rose-500 flex-1 h-px bg-gradient-to-r from-rose-500 to-transparent ml-4 opacity-50"></span>
            </h3>
            <UpcomingReminders familyId={selectedFamily} />
          </div>
        </div>

        <div className="mb-8">
          <GedcomImport familyId={selectedFamily} onImportSuccess={(importedTreeData) => setTreeData(importedTreeData)} />
        </div>
        
        {/* Addition Tools Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-10">
          
          {/* Add Family Member Section */}
          <section className="bg-black/40 p-8 rounded-3xl shadow-2xl border border-white/10 backdrop-blur-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-white/20 to-white/5"></div>
            <h3 className="text-xl font-bold text-white mb-6 tracking-tight flex items-center gap-2">
              Spawn Node <span className="text-gray-500 font-normal text-sm tracking-widest uppercase ml-2">(Add Member)</span>
            </h3>
            <form onSubmit={handleCreatePerson} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <input placeholder="First Name" value={personData.first_name} onChange={e => setPersonData({...personData, first_name: e.target.value})} className="w-full bg-white/5 border-b-2 border-white/10 px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-rose-500 focus:bg-white/10 transition-all rounded-t-md" required />
              <input placeholder="Last Name" value={personData.last_name} onChange={e => setPersonData({...personData, last_name: e.target.value})} className="w-full bg-white/5 border-b-2 border-white/10 px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-rose-500 focus:bg-white/10 transition-all rounded-t-md" />
              <input placeholder="Gender (Male/Female)" value={personData.gender} onChange={e => setPersonData({...personData, gender: e.target.value})} className="w-full bg-white/5 border-b-2 border-white/10 px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-rose-500 focus:bg-white/10 transition-all rounded-t-md" />
              <input placeholder="Birth Place / Origin" value={personData.birth_place} onChange={e => setPersonData({...personData, birth_place: e.target.value})} className="w-full bg-white/5 border-b-2 border-white/10 px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-rose-500 focus:bg-white/10 transition-all rounded-t-md" />
              <button type="submit" className="col-span-1 md:col-span-2 py-4 bg-white text-black font-bold tracking-widest uppercase text-sm hover:bg-rose-500 hover:text-white transition-all duration-300 shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(225,29,72,0.4)]">
                Inject into Tree
              </button>
            </form>
          </section>

          {/* Add Relationship Section */}
          <section className="bg-black/40 p-8 rounded-3xl shadow-2xl border border-white/10 backdrop-blur-xl relative overflow-hidden flex flex-col justify-center">
            <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-l from-rose-500/50 to-transparent"></div>
            <h3 className="text-xl font-bold text-white mb-6 tracking-tight flex items-center gap-2">
              Forge Link <span className="text-gray-500 font-normal text-sm tracking-widest uppercase ml-2">(Build Relationship)</span>
            </h3>
            <form onSubmit={handleCreateRelationship} className="flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-xl border border-white/10 bg-white/5">
                <select value={relationshipData.person1_id} onChange={e => setRelationshipData({...relationshipData, person1_id: e.target.value})} className="w-full sm:flex-1 px-4 py-3 border-b-2 border-white/10 bg-black/50 text-white font-medium focus:border-rose-500 focus:outline-none rounded-t-md" required>
                  <option value="" disabled>-- Subject --</option>
                  {treeData.nodes.filter(n => n.data?.person).map(n => (
                    <option key={n.data.person.id} value={n.data.person.id}>
                      {n.data.person.first_name} {n.data.person.last_name || ''}
                    </option>
                  ))}
                </select>

                <span className="text-rose-400 font-bold italic text-sm px-2 tracking-widest uppercase">Is The</span>

                <select value={relationshipData.relationship_type} onChange={e => setRelationshipData({...relationshipData, relationship_type: e.target.value})} className="w-full sm:w-auto px-4 py-3 border-b-2 border-white/10 bg-black/50 text-rose-400 font-black focus:border-rose-500 focus:outline-none rounded-t-md text-center" required>
                    <option value="" disabled>-- Role --</option>
                    <option value="parent">Parent</option>
                    <option value="child">Child</option>
                    <option value="spouse">Spouse</option>
                    <option value="sibling">Sibling</option>
                </select>

                <span className="text-rose-400 font-bold italic text-sm px-2 tracking-widest uppercase">Of</span>

                <select value={relationshipData.person2_id} onChange={e => setRelationshipData({...relationshipData, person2_id: e.target.value})} className="w-full sm:flex-1 px-4 py-3 border-b-2 border-white/10 bg-black/50 text-white font-medium focus:border-rose-500 focus:outline-none rounded-t-md" required>
                  <option value="" disabled>-- Target --</option>
                  {treeData.nodes.filter(n => n.data?.person).map(n => (
                    <option key={n.data.person.id} value={n.data.person.id}>
                      {n.data.person.first_name} {n.data.person.last_name || ''}
                    </option>
                  ))}
                </select>
              </div>
              
              <button type="submit" className="w-full py-4 bg-gradient-to-r from-rose-600 to-rose-500 text-white font-bold tracking-widest uppercase text-sm hover:shadow-[0_0_30px_rgba(225,29,72,0.6)] transition-all duration-300">
                Establish Connection
              </button>
            </form>
          </section>

        </div>

        {/* Visualizations (Tree & Timeline) */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <section className="xl:col-span-2 bg-black/40 p-2 rounded-3xl shadow-2xl border border-white/10 backdrop-blur-xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-white/10 flex justify-between items-center bg-transparent">
              <h3 className="text-xl font-bold text-white tracking-tight">Lineage Map</h3>
            </div>
            <div className="relative flex-1 min-h-[700px] w-full">
              <FamilyTree nodes={treeData.nodes} edges={treeData.edges} onNodeClick={handleNodeClick} />
            </div>
          </section>

          <section className="bg-black/40 p-6 rounded-3xl shadow-2xl border border-white/10 backdrop-blur-xl h-[700px] overflow-y-auto custom-scrollbar">
            <h3 className="text-xl font-bold text-white border-b border-white/10 pb-4 mb-6 sticky top-0 bg-black/80 backdrop-blur-xl z-20 pt-2">
              Chronicles
            </h3>
            <FamilyTimeline familyId={selectedFamily} />
          </section>
        </div>

      </div>
    </div>
  );
};

export default FamilyTreePage;
