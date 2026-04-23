import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Footer from './components/Footer';
import { ToastProvider } from './context/ToastContext';
import './App.css';

// Lazy loaded pages
const Register = lazy(() => import('./pages/Register'));
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const FamilyTreePage = lazy(() => import('./pages/FamilyTreePage'));
const PersonProfile = lazy(() => import('./pages/PersonProfile'));
const StoryTransition = lazy(() => import('./pages/StoryTransition'));

// Global fallback loader
const PageLoader = () => (
  <div className="flex-1 flex items-center justify-center min-h-screen bg-black">
    <div className="w-10 h-10 border-4 border-rose-500/20 border-t-rose-500 rounded-full animate-spin"></div>
  </div>
);

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <div className="App bg-black min-h-screen flex flex-col">
          <Suspense fallback={<PageLoader />}>
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
          </Suspense>
          <Footer />
        </div>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
