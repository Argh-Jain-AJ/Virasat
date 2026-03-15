import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/api';
import MemoryTimeline from '../components/MemoryTimeline';

const PersonProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [person, setPerson] = useState(null);
  const [memories, setMemories] = useState([]);
  const [relationships, setRelationships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Memory form state
  const [memoryForm, setMemoryForm] = useState({
    title: '',
    description: '',
    event_date: '',
    media_url: ''
  });

  // AI state
  const [generatingBio, setGeneratingBio] = useState(false);

  useEffect(() => {
    fetchProfileData();
    // eslint-disable-next-line
  }, [id]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const [personRes, memoriesRes, relsRes] = await Promise.all([
        api.get(`/persons/${id}`),
        api.get(`/memories/person/${id}`),
        api.get(`/relationships/${id}`)
      ]);
      setPerson(personRes.data);
      setMemories(memoriesRes.data || []);
      setRelationships(relsRes.data || []);
    } catch (err) {
      console.error(err);
      setError('Failed to load profile details.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMemory = async (e) => {
    e.preventDefault();
    try {
      if (!person) return;
      await api.post('/memories', {
        ...memoryForm,
        person_id: id,
        family_id: person.family_id
      });
      // Reset form and reload data
      setMemoryForm({ title: '', description: '', event_date: '', media_url: '' });
      fetchProfileData();
    } catch (err) {
      setError('Failed to add memory.');
    }
  };

  const handleGenerateBio = async () => {
    try {
      setGeneratingBio(true);
      const res = await api.post('/ai/generate-biography', { person_id: id });
      // Update local person bio with generated response
      setPerson({ ...person, bio: res.data.biography });
    } catch (err) {
      alert('Failed to generate biography.');
    } finally {
      setGeneratingBio(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading Profile...</div>;
  if (error || !person) return <div className="p-8 text-center text-red-500">{error || 'Person not found'}</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 mt-8 bg-white shadow-xl rounded-xl">
      <button 
        onClick={() => navigate('/dashboard')}
        className="mb-4 text-blue-600 hover:text-blue-800 text-sm font-semibold"
      >
        &larr; Back to Dashboard
      </button>

      {/* Profile Header section */}
      <div className="flex items-center gap-6 mb-8 border-b pb-6">
        <div 
          className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-3xl font-bold text-gray-500 overflow-hidden"
          style={{ backgroundImage: person.photo_url ? `url(${person.photo_url})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }}
        >
          {!person.photo_url && person.first_name[0].toUpperCase()}
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            {person.first_name} {person.last_name || ''}
          </h1>
          <p className="text-gray-500 mt-1">
            Born: {person.birth_date ? new Date(person.birth_date).toLocaleDateString() : 'Unknown'} 
            {person.birth_place ? ` in ${person.birth_place}` : ''}
          </p>
          {person.death_date && (
            <p className="text-gray-500 text-sm">
              Passed away: {new Date(person.death_date).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Col: Info & Relationships */}
        <div className="col-span-1 space-y-6">
          <section className="bg-white p-4 border rounded shadow-sm">
            <div className="flex justify-between items-center mb-3 border-b pb-1">
              <h2 className="text-xl font-semibold text-gray-800">About</h2>
              <button 
                onClick={handleGenerateBio} 
                disabled={generatingBio}
                className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200 transition"
              >
                {generatingBio ? 'Generating...' : '✨ Generate AI Bio'}
              </button>
            </div>
            <p className="text-gray-700 text-sm whitespace-pre-wrap">{person.bio || 'No biography written.'}</p>
            {person.occupation && (
              <p className="mt-2 text-sm text-gray-600"><strong>Occupation:</strong> {person.occupation}</p>
            )}
            {person.gender && (
              <p className="mt-1 text-sm text-gray-600"><strong>Gender:</strong> {person.gender}</p>
            )}
          </section>

          <section className="bg-white p-4 border rounded shadow-sm">
            <h2 className="text-xl font-semibold mb-3 border-b pb-1">Relationships</h2>
            {relationships.length === 0 ? (
               <p className="text-gray-500 text-sm">No recorded relationships.</p>
            ) : (
              <ul className="space-y-2">
                {relationships.map(rel => {
                  // Figure out if the other person is person1 or person2
                  const isPerson1 = rel.person1_id === id;
                  const otherPersonId = isPerson1 ? rel.person2_id : rel.person1_id;
                  return (
                    <li key={rel.id} className="text-sm bg-gray-50 p-2 rounded border">
                      <span className="font-semibold capitalize text-blue-700">{rel.relationship_type}</span> to ID: {otherPersonId}
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        </div>

        {/* Right Col: Timeline & Forms */}
        <div className="col-span-2 space-y-8">
          
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Life Timeline</h2>
            <MemoryTimeline memories={memories} />
          </section>

          <section className="bg-gray-50 p-4 rounded-lg border shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-3">Add a New Memory</h3>
            <form onSubmit={handleAddMemory} className="space-y-3">
              <div>
                <input 
                  type="text" 
                  placeholder="Memory Title" 
                  value={memoryForm.title} 
                  onChange={e => setMemoryForm({...memoryForm, title: e.target.value})} 
                  className="w-full p-2 border rounded" 
                  required 
                />
              </div>
              <div>
                <textarea 
                  placeholder="Describe the memory or story..." 
                  value={memoryForm.description} 
                  onChange={e => setMemoryForm({...memoryForm, description: e.target.value})} 
                  className="w-full p-2 border rounded"
                  rows={3}
                ></textarea>
              </div>
              <div className="flex gap-3">
                <input 
                  type="date" 
                  value={memoryForm.event_date} 
                  onChange={e => setMemoryForm({...memoryForm, event_date: e.target.value})} 
                  className="w-full p-2 border rounded" 
                />
                <input 
                  type="url" 
                  placeholder="Image URL (optional)" 
                  value={memoryForm.media_url} 
                  onChange={e => setMemoryForm({...memoryForm, media_url: e.target.value})} 
                  className="w-full p-2 border rounded" 
                />
              </div>
              <button 
                type="submit" 
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
              >
                Save Memory
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PersonProfile;
