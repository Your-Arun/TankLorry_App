// frontend/api/stockApi.js
// All API calls to the Node.js backend

import api from './apiConfig';

/**
 * Save a new daily stock entry
 * @param {number} tank1
 * @param {number} tank2
 * @param {number} avgSale
 */
export const saveStockEntry = async (tank1, tank2, avgSale) => {
  const response = await api.post('/stock', { tank1, tank2, avgSale });
  return response.data;
};

/**
 * Get the latest stock entry
 */
export const getLatestEntry = async () => {
  const response = await api.get('/stock/latest');
  return response.data;
};

/**
 * Get paginated history
 * @param {number} page - Page number (default 1)
 * @param {number} limit - Items per page (default 20)
 */
export const getHistory = async (page = 1, limit = 20) => {
  const response = await api.get(`/stock/history?page=${page}&limit=${limit}`);
  return response.data;
};

/**
 * Delete a stock entry by ID
 * @param {string} id - MongoDB _id
 */
export const deleteEntry = async (id) => {
  const response = await api.delete(`/stock/${id}`);
  return response.data;
};
