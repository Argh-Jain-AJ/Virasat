import React, { useState } from 'react';
import api from '../api/api';

const GedcomImport = ({ familyId, onImportSuccess }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setMessage('');
      setError('');
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a GEDCOM file.');
      return;
    }
    if (!familyId) {
       setError('Please select a family context first.');
       return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('family_id', familyId);

    try {
      setUploading(true);
      setError('');
      setMessage('');
      const response = await api.post('/gedcom/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setMessage(`GEDCOM file imported successfully.`);
      setFile(null);
      // reset file input
      document.getElementById('gedcom-upload').value = null;
      if (onImportSuccess) {
        onImportSuccess(response.data);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to upload GEDCOM file.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white p-4 border rounded shadow-sm mb-4">
      <h3 className="text-md font-semibold text-gray-800 border-b pb-2 mb-3">Import GEDCOM File</h3>
      <form onSubmit={handleUpload}>
        <div className="flex flex-col space-y-3">
          <input
            id="gedcom-upload"
            type="file"
            accept=".ged"
            onChange={handleFileChange}
            className="text-sm text-gray-700
              file:mr-4 file:py-2 file:px-4
              file:rounded file:border-0
              file:text-sm file:font-semibold
              file:bg-indigo-50 file:text-indigo-700
              hover:file:bg-indigo-100"
          />
          <button
            type="submit"
            disabled={uploading || !file || !familyId}
            className={`self-start px-4 py-2 text-white font-medium rounded shadow transition ${
              uploading || !file || !familyId ? 'bg-indigo-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {uploading ? 'Importing...' : 'Upload & Import'}
          </button>
        </div>
        {message && <div className="mt-3 p-2 bg-green-50 text-green-700 text-sm rounded">{message}</div>}
        {error && <div className="mt-3 p-2 bg-red-50 text-red-700 text-sm rounded">{error}</div>}
      </form>
    </div>
  );
};

export default GedcomImport;
