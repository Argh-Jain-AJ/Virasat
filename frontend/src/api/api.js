import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5001/api',
});

// Attach JWT to every outgoing request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle expired / invalid tokens and network errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Standardize error structure for the frontend
    const standardizedError = {
      ...error,
      response: {
        ...error.response,
        data: {
          message: 'An unexpected error occurred. Please try again.',
          ...(error.response?.data || {})
        }
      }
    };

    if (!error.response) {
      // Network errors or CORS
      standardizedError.response.data.message = 'Unable to connect to the lineage archive. Please check your network connection.';
    }

    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('selectedFamily');
      // Redirect to login only if not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    // Pass the standardized error down to the catch blocks
    return Promise.reject(standardizedError);
  }
);

export default api;
