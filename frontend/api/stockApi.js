import api from './apiConfig';

// Only tank1 and tank2 needed — avgSale is auto-set from day of week
export const saveStockEntry = async (tank1, tank2) => {
  const response = await api.post('/stock', { tank1, tank2 });
  return response.data;
};

export const getLatestEntry = async () => {
  const response = await api.get('/stock/latest');
  return response.data;
};

export const getHistory = async (page = 1, limit = 20) => {
  const response = await api.get('/stock/history?page=' + page + '&limit=' + limit);
  return response.data;
};

export const deleteEntry = async (id) => {
  const response = await api.delete('/stock/' + id);
  return response.data;
};
