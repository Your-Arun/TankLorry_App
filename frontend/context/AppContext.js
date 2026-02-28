import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { saveStockEntry, getLatestEntry, getHistory as fetchHistoryApi } from '../api/stockApi';
import { loadSaleRates } from '../utils/decisionEngine';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [latestEntry,    setLatestEntry]    = useState(null);
  const [history,        setHistory]        = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error,          setError]          = useState(null);

  useEffect(() => {
    loadSaleRates().then(() => loadLatest());
  }, []);

  const loadLatest = async () => {
    setLoading(true); setError(null);
    try {
      const res = await getLatestEntry();
      setLatestEntry(res.data);
    } catch (err) {
      if (err?.response?.status !== 404)
        setError('Server se connect nahi ho raha. Backend chalu hai?');
      setLatestEntry(null);
    } finally { setLoading(false); }
  };

  const refreshLatest = useCallback(async () => {
    await loadSaleRates();
    await loadLatest();
  }, []);

  // entryDate = the night being recorded (next day = entryDate + 1)
  const saveEntry = useCallback(async (tank1, tank2, entryDate) => {
    try {
      const res = await saveStockEntry(tank1, tank2, entryDate || new Date());
      setLatestEntry(res.data);
      return { success: true };
    } catch (err) {
      return { success: false, error: err?.response?.data?.message || err.message || 'Server error' };
    }
  }, []);

  const fetchHistory = useCallback(async (page = 1, limit = 20) => {
    setHistoryLoading(true);
    try {
      const res = await fetchHistoryApi(page, limit);
      setHistory(res.data);
    } catch { setError('History load nahi hui.'); }
    finally { setHistoryLoading(false); }
  }, []);

  return (
    <AppContext.Provider value={{ latestEntry, history, loading, historyLoading, error, saveEntry, fetchHistory, refreshLatest }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
};
