// frontend/context/AppContext.js
// Global state management - fetches data from Node.js REST API

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { saveStockEntry, getLatestEntry, getHistory as fetchHistoryApi } from '../api/stockApi';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [latestEntry, setLatestEntry] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load latest entry on mount
  useEffect(() => {
    loadLatest();
  }, []);

  const loadLatest = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getLatestEntry();
      setLatestEntry(res.data);
    } catch (err) {
      // 404 = no entries yet, that's okay
      if (err?.response?.status !== 404) {
        setError('Cannot connect to server. Make sure the backend is running.');
      }
      setLatestEntry(null);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Save a new daily stock entry via API
   */
  const saveEntry = useCallback(async (tank1, tank2, avgSale) => {
    try {
      const res = await saveStockEntry(tank1, tank2, avgSale);
      // Update latest entry immediately from API response
      setLatestEntry(res.data);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err?.response?.data?.message || err.message || 'Server error',
      };
    }
  }, []);

  /**
   * Fetch history from API
   */
  const fetchHistory = useCallback(async (page = 1, limit = 20) => {
    setHistoryLoading(true);
    try {
      const res = await fetchHistoryApi(page, limit);
      setHistory(res.data);
    } catch (err) {
      setError('Failed to load history.');
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  return (
    <AppContext.Provider
      value={{
        latestEntry,
        history,
        loading,
        historyLoading,
        error,
        saveEntry,
        fetchHistory,
        refreshLatest: loadLatest,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
};
