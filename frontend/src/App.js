import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import FamilyTreePage from './pages/FamilyTreePage';
import PersonProfile from './pages/PersonProfile';
import './App.css'; 

function App() {
  return (
    <BrowserRouter>
      <div className="App bg-gray-100 min-h-screen">
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/family-tree" element={<FamilyTreePage />} />
          <Route path="/person/:id" element={<PersonProfile />} />
          
          {/* Default fallback route redirecting to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
