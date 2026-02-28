// frontend/api/apiConfig.js
// Centralized API base URL configuration
// Change BASE_URL to your server IP when testing on a real device

import axios from 'axios';

// ⚠️ IMPORTANT: For Android emulator use 10.0.2.2
// ⚠️ For real device use your PC's local IP e.g. http://192.168.1.5:5000
// ⚠️ For production use your deployed server URL

const BASE_URL = 'http://10.0.2.2:5000/api'; // Android Emulator default

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000, // 10 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - log outgoing requests in dev
api.interceptors.request.use(
  (config) => {
    console.log(`📡 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - log responses and errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('❌ API Error:', error?.response?.data?.message || error.message);
    return Promise.reject(error);
  }
);

export default api;
