import axios from 'axios';

const BASE_URL = 'https://tanklorry-app.onrender.com/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  async (config) => {
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response.data, // 👈 directly data return karega
  (error) => {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      'Something went wrong';

    console.error('❌ API Error:', message);

    return Promise.reject(message);
  }
);

export default api;