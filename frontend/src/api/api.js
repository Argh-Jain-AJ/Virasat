import axios from 'axios';

// Configure axios instance with the backend base URL
const api = axios.create({
  baseURL: 'http://localhost:5001/api',
});

// Add a request interceptor to attach the JWT token to outgoing requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
