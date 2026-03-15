import React, { useState } from 'react';

const SearchBar = ({ onSearch }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSearch && query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input 
        type="text"
        placeholder="Search family member..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300 w-full"
      />
      <button 
        type="submit"
        className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700 transition"
      >
        Search
      </button>
    </form>
  );
};

export default SearchBar;
