import React, { useEffect, useState } from 'react';
import api from '../api/api';

const UpcomingReminders = ({ familyId }) => {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!familyId) return;

    const fetchReminders = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/reminders/${familyId}`);
        setReminders(response.data?.data || []);
      } catch (err) {
        console.error("Failed to fetch reminders:", err);
        setError("Could not load reminders.");
      } finally {
        setLoading(false);
      }
    };

    fetchReminders();
  }, [familyId]);

  if (loading) return <div className="p-4 text-gray-500">Loading upcoming features...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;
  if (!reminders.length) return <div className="p-4 text-gray-500 text-sm">No upcoming family events for the next 30 days.</div>;

  return (
    <div className="space-y-4">
      {reminders.map((event, idx) => {
        let textStyle = "text-blue-600";
        let bgStyle = "bg-blue-50 border-blue-200";
        let icon = "🎂";

        if (event.event_type.includes("Death")) {
          textStyle = "text-gray-600";
          bgStyle = "bg-gray-50 border-gray-200";
          icon = "🕯️";
        } else if (event.event_type.includes("Anniversary") || event.event_type.includes("Wedding")) {
          textStyle = "text-pink-600";
          bgStyle = "bg-pink-50 border-pink-200";
          icon = "💍";
        }

        return (
          <div key={`${event.id}-${idx}`} className={`p-4 rounded-lg border ${bgStyle} flex justify-between items-center transition hover:shadow-sm`}>
            <div>
              <p className="font-semibold text-gray-800">
                {icon} {event.first_name} {event.last_name}'s {event.event_type}
              </p>
              <p className={`text-sm ${textStyle} font-medium mt-1`}>
                {new Date(event.next_occurrence).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </p>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-bold ${event.days_away === 0 ? 'bg-red-500 text-white animate-pulse' : 'bg-white text-gray-700 border border-gray-200'}`}>
              {event.days_away === 0 ? "TODAY!" : `In ${event.days_away} Days`}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default UpcomingReminders;
