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
  const [ratesLoaded,    setRatesLoaded]    = useState(false);

  useEffect(() => {
    // Load user's custom sale rates first, then load latest entry
    loadSaleRates().then(() => {
      setRatesLoaded(true);
      loadLatest();
    });
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
    } finally {
      setLoading(false);
    }
  };

  const refreshLatest = useCallback(async () => {
    // Also reload sale rates in case user changed them in Settings
    await loadSaleRates();
    await loadLatest();
  }, []);

  const saveEntry = useCallback(async (tank1, tank2) => {
    try {
      const res = await saveStockEntry(tank1, tank2);
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
    <AppContext.Provider value={{
      latestEntry, history, loading, historyLoading, error,
      saveEntry, fetchHistory, refreshLatest, ratesLoaded,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
};
