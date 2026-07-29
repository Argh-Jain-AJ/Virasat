import React from 'react';
import { Navigate } from 'react-router-dom';

// Redirects to /login before a protected page ever renders if no token exists,
// instead of relying solely on the reactive 401 redirect in api.js.
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export default ProtectedRoute;
