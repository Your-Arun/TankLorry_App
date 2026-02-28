import axios from 'axios';

const BASE_URL = 'https://tanklorry-app.onrender.com/api'; 

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000, // 10 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('❌ API Error:', error?.response?.data?.message || error.message);
    return Promise.reject(error);
  }
);

export default api;
