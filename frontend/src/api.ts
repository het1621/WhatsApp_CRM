import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001/api', // Make sure this matches your backend URL
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
