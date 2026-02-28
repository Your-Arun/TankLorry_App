import api from './apiConfig';

export const saveStockEntry = async (tank1, tank2, entryDate) => {
  const response = await api.post('/stock', {
    tank1,
    tank2,
    entryDate: entryDate ? entryDate.toISOString() : new Date().toISOString(),
  });
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
