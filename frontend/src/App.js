import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import FamilyTreePage from './pages/FamilyTreePage';
import PersonProfile from './pages/PersonProfile';
import StoryTransition from './pages/StoryTransition';
import Footer from './components/Footer';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <div className="App bg-black min-h-screen flex flex-col">
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/story-transition" element={<StoryTransition />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/family-tree" element={<FamilyTreePage />} />
          <Route path="/person/:id" element={<PersonProfile />} />

          {/* Default fallback route redirecting to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
