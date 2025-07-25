import { useState, useEffect } from 'react';
import { fetchCatalogAndPossessionData, fetchTradesData } from '../utils/api';
import { useItemValuation } from './useItemValuation';

export const useCokeData = () => {
  const [catalogData, setCatalogData] = useState([]);
  const [possessionData, setPossessionData] = useState([]);
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tradesLoading, setTradesLoading] = useState(true);
  const [tradesError, setTradesError] = useState(null);

  const valuations = useItemValuation(catalogData, possessionData, trades);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const { catalogData, possessionData } = await fetchCatalogAndPossessionData();
      setCatalogData(catalogData);
      setPossessionData(possessionData);
    } catch (err) {
      setError('Failed to fetch data');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrades = async () => {
    try {
      setTradesLoading(true);
      setTradesError(null);
      const data = await fetchTradesData();
      setTrades(data);
    } catch (err) {
      setTradesError('Failed to fetch trades');
      setTrades([]);
    } finally {
      setTradesLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchTrades();
  }, []);

  const getItemPossessions = (prodId) => {
    return possessionData.filter(p => p.catalogItemId === prodId);
  };

  const getItemPrice = (item) => {
    const possessions = getItemPossessions(item.prodId);
    if (possessions.length === 0) return 0;
    return possessions[0].purchasePrice || 0;
  };

  const getItemPurchaseDate = (item) => {
    const possessions = getItemPossessions(item.prodId);
    if (possessions.length === 0) return null;
    return new Date(possessions[0].datePurchased);
  };

  const getItemDetailsByPossessionId = (possessionId) => {
    const possession = possessionData.find(p => p.id === possessionId);
    if (!possession) return null;
    const item = catalogData.find(i => i.prodId === possession.catalogItemId);
    return item ? { ...item, possession } : null;
  };

  const isTradeValid = (trade) => {
    const allIds = [...(trade.traderItemIds || []), ...(trade.tradeeItemIds || [])];
    return allIds.every(pid => possessionData.some(p => p.id === pid));
  };

  return {
    catalogData,
    possessionData,
    trades,
    loading,
    error,
    tradesLoading,
    tradesError,
    valuations,
    fetchData,
    getItemPossessions,
    getItemPrice,
    getItemPurchaseDate,
    getItemDetailsByPossessionId,
    isTradeValid
  };
}; 