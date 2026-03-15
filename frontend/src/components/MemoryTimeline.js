import React from 'react';

const MemoryTimeline = ({ memories = [] }) => {
  if (!memories.length) {
    return <p className="text-gray-500 italic">No memories attached yet.</p>;
  }

  return (
    <div className="relative border-l border-gray-200 ml-3">
      {memories.map((mem, index) => (
        <div key={mem.id || index} className="mb-8 ml-6">
          <span className="absolute flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full -left-3 ring-8 ring-white">
            <svg className="w-3 h-3 text-blue-800" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
          </span>
          <h3 className="flex items-center mb-1 text-lg font-semibold text-gray-900">
            {mem.title}
          </h3>
          <time className="block mb-2 text-sm font-normal leading-none text-gray-400">
            {mem.event_date ? new Date(mem.event_date).toLocaleDateString() : 'Date unspecified'}
          </time>
          <p className="mb-4 text-base font-normal text-gray-500">
            {mem.description}
          </p>
          {mem.media_url && (
            <img 
              src={mem.media_url} 
              alt={mem.title} 
              className="mt-2 rounded-lg max-w-xs object-cover border"
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default MemoryTimeline;
