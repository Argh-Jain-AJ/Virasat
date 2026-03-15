import React, { useState, useEffect } from 'react';
import api from '../api/api';

const FamilyTimeline = ({ familyId }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (familyId) {
      fetchEvents();
    }
    // eslint-disable-next-line
  }, [familyId]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/events?family_id=${familyId}`);
      setEvents(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch family timeline.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-gray-500 py-4">Loading timeline...</div>;
  if (error) return <div className="text-red-500 py-4">{error}</div>;
  if (!events.length) return <div className="text-gray-500 py-4 italic">No major events recorded for this family yet. Add dates of birth/death or memories to populate!</div>;

  return (
    <div className="relative border-l border-indigo-200 ml-4 py-2 mt-4">
      {events.map((evt, idx) => (
        <div key={evt.id || idx} className="mb-6 ml-6">
          <span className="absolute flex items-center justify-center w-6 h-6 bg-indigo-100 rounded-full -left-3 ring-8 ring-gray-50 text-indigo-800 font-bold text-xs uppercase">
            {evt.type[0]}
          </span>
          <div className="bg-white p-4 border rounded-lg shadow-sm">
            <h4 className="font-bold text-gray-800 mb-1">{evt.title}</h4>
            <time className="block text-sm font-semibold text-indigo-600 mb-2">
              {new Date(evt.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
            </time>
            <p className="text-gray-600 text-sm leading-relaxed">{evt.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default FamilyTimeline;
