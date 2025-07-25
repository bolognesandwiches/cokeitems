import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { Filter, Package, Tag, TrendingUp, BarChart3, ArrowLeftRight, Users, Activity, ChevronDown, ChevronRight } from 'lucide-react';
import { getImageUrl, shouldShowCCBadge, getCustomCCValue } from '../../utils/helpers';

const AnalyticsTab = ({ 
  catalogData, 
  possessionData, 
  trades, 
  tradesLoading, 
  tradesError, 
  valuations, 
  getItemDetailsByPossessionId, 
  isTradeValid 
}) => {
  const [analyticsDateRange, setAnalyticsDateRange] = useState('all');
  const [analyticsCategory, setAnalyticsCategory] = useState('all');
  const [selectedItemFilter, setSelectedItemFilter] = useState('all');
  const [expandedCards, setExpandedCards] = useState({
    purchaseMetrics: true,
    tradeMetrics: true,
    purchaseCharts: false,
    tradeCharts: false
  });

  const toggleCard = (cardId) => {
    setExpandedCards(prev => ({
      ...prev,
      [cardId]: !prev[cardId]
    }));
  };

  const getUniqueCategories = () => {
    const categories = new Set(['all']);
    catalogData.forEach(item => {
      if (item.catName) {
        categories.add(item.catName);
      }
    });
    return Array.from(categories).sort();
  };

  const getUniqueItemsInCategory = (category) => {
    if (category === 'all') return [];
    const items = catalogData.filter(item => item.catName === category);
    return items.map(item => ({
      id: item.prodId,
      name: item.name?.replace(/"/g, '') || 'Unnamed Item'
    })).sort((a, b) => a.name.localeCompare(b.name));
  };

  const getAnalyticsData = () => {
    if (!possessionData.length) return null;

    let filteredPossessions = [...possessionData];
    
    if (analyticsDateRange !== 'all') {
      const now = new Date();
      const cutoffDate = new Date();
      
      switch (analyticsDateRange) {
        case '7d':
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          cutoffDate.setDate(now.getDate() - 30);
          break;
        case '90d':
          cutoffDate.setDate(now.getDate() - 90);
          break;
        case '1y':
          cutoffDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      filteredPossessions = possessionData.filter(p => 
        new Date(p.datePurchased) >= cutoffDate
      );
    }

    if (analyticsCategory !== 'all') {
      const categoryItems = catalogData.filter(item => item.catName === analyticsCategory);
      const categoryItemIds = new Set(categoryItems.map(item => item.prodId));
      filteredPossessions = filteredPossessions.filter(p => 
        categoryItemIds.has(p.catalogItemId)
      );
    }

    if (selectedItemFilter !== 'all') {
      filteredPossessions = filteredPossessions.filter(p => 
        p.catalogItemId === parseInt(selectedItemFilter)
      );
    }

    return filteredPossessions;
  };

  const getPurchasesOverTime = () => {
    const analyticsData = getAnalyticsData();
    if (!analyticsData) return [];

    const purchasesByDate = {};
    analyticsData.forEach(possession => {
      const date = new Date(possession.datePurchased).toLocaleDateString();
      purchasesByDate[date] = (purchasesByDate[date] || 0) + 1;
    });

    return Object.entries(purchasesByDate)
      .sort(([a], [b]) => new Date(a) - new Date(b))
      .map(([date, count]) => ({ date, purchases: count }));
  };

  const getCategoryDistribution = () => {
    const analyticsData = getAnalyticsData();
    if (!analyticsData) return [];

    const categoryCount = {};
    analyticsData.forEach(possession => {
      const item = catalogData.find(i => i.prodId === possession.catalogItemId);
      const category = item?.catName || 'Unknown';
      categoryCount[category] = (categoryCount[category] || 0) + 1;
    });

    return Object.entries(categoryCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  };

  const getSpendingOverTime = () => {
    const analyticsData = getAnalyticsData();
    if (!analyticsData) return [];

    const spendingByDate = {};
    analyticsData.forEach(possession => {
      const date = new Date(possession.datePurchased).toLocaleDateString();
      spendingByDate[date] = (spendingByDate[date] || 0) + (possession.purchasePrice || 0);
    });

    return Object.entries(spendingByDate)
      .sort(([a], [b]) => new Date(a) - new Date(b))
      .map(([date, amount]) => ({ date, spending: amount }));
  };

  const getItemDistribution = () => {
    const analyticsData = getAnalyticsData();
    if (!analyticsData) return [];

    if (analyticsCategory !== 'all') {
      const itemCount = {};
      analyticsData.forEach(possession => {
        const item = catalogData.find(i => i.prodId === possession.catalogItemId);
        if (item) {
          const itemName = item.name?.replace(/"/g, '') || 'Unknown';
          itemCount[itemName] = (itemCount[itemName] || 0) + 1;
        }
      });

      return Object.entries(itemCount)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);
    }

    return getCategoryDistribution();
  };

  const getTotalSpent = () => {
    const analyticsData = getAnalyticsData();
    if (!analyticsData) return 0;
    
    return analyticsData.reduce((total, possession) => {
      return total + (possession.purchasePrice || 0);
    }, 0);
  };

  // Trading Analytics Functions
  const getTradeAnalyticsData = () => {
    if (!trades || !trades.length || tradesLoading || tradesError) return null;
    
    const validTrades = trades.filter(isTradeValid);
    let filteredTrades = [...validTrades];
    
    if (analyticsDateRange !== 'all') {
      const now = new Date();
      const cutoffDate = new Date();
      
      switch (analyticsDateRange) {
        case '7d':
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          cutoffDate.setDate(now.getDate() - 30);
          break;
        case '90d':
          cutoffDate.setDate(now.getDate() - 90);
          break;
        case '1y':
          cutoffDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      filteredTrades = validTrades.filter(trade => 
        new Date(trade.tradeDate) >= cutoffDate
      );
    }

    // Apply category and item filters to trades
    if (analyticsCategory !== 'all' || selectedItemFilter !== 'all') {
      filteredTrades = filteredTrades.filter(trade => {
        const tradeItems = [...(trade.traderItemIds || []), ...(trade.tradeeItemIds || [])];
        const items = tradeItems.map(id => getItemDetailsByPossessionId(id)).filter(Boolean);
        
        let matchesCategory = analyticsCategory === 'all';
        let matchesItem = selectedItemFilter === 'all';
        
        items.forEach(item => {
          // Check category match
          if (analyticsCategory !== 'all' && item.catName === analyticsCategory) {
            matchesCategory = true;
          }
          
          // Check specific item match
          if (selectedItemFilter !== 'all' && item.prodId === parseInt(selectedItemFilter)) {
            matchesItem = true;
          }
        });
        
        return matchesCategory && matchesItem;
      });
    }

    return filteredTrades;
  };

  const getTradesOverTime = () => {
    const tradeData = getTradeAnalyticsData();
    if (!tradeData || !valuations) return [];

    const tradesByDate = {};
    const valuesByDate = {};

    tradeData.forEach(trade => {
      const date = new Date(trade.tradeDate).toLocaleDateString();
      tradesByDate[date] = (tradesByDate[date] || 0) + 1;
      
      // Calculate total CC value for this trade
      const traderCC = (trade.traderItemIds || [])
        .map(id => getItemDetailsByPossessionId(id))
        .filter(item => {
          const valuation = item ? valuations.get(item.prodId) : undefined;
          return item && shouldShowCCBadge(item, valuation);
        })
        .reduce((sum, item) => sum + getCustomCCValue(item, valuations), 0);
      
      const tradeeCC = (trade.tradeeItemIds || [])
        .map(id => getItemDetailsByPossessionId(id))
        .filter(item => {
          const valuation = item ? valuations.get(item.prodId) : undefined;
          return item && shouldShowCCBadge(item, valuation);
        })
        .reduce((sum, item) => sum + getCustomCCValue(item, valuations), 0);
      
      const totalTradeValue = traderCC + tradeeCC;
      valuesByDate[date] = (valuesByDate[date] || 0) + totalTradeValue;
    });

    return Object.entries(tradesByDate)
      .sort(([a], [b]) => new Date(a) - new Date(b))
      .map(([date, count]) => ({ 
        date, 
        trades: count, 
        value: valuesByDate[date] || 0 
      }));
  };

  const getMostTradedItems = () => {
    const tradeData = getTradeAnalyticsData();
    if (!tradeData) return [];

    const itemCount = {};
    tradeData.forEach(trade => {
      [...(trade.traderItemIds || []), ...(trade.tradeeItemIds || [])].forEach(itemId => {
        const item = getItemDetailsByPossessionId(itemId);
        if (item) {
          const key = item.prodId;
          const name = item.name?.replace(/"/g, '') || 'Unknown';
          if (!itemCount[key]) {
            itemCount[key] = { name, count: 0, item };
          }
          itemCount[key].count++;
        }
      });
    });

    return Object.values(itemCount)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  };

  const getTradingActivity = () => {
    const tradeData = getTradeAnalyticsData();
    if (!tradeData || !valuations) return { totalTrades: 0, totalItems: 0, totalValue: 0, uniqueTraders: 0 };

    const traderSet = new Set();
    let totalItems = 0;
    let totalValue = 0;

    tradeData.forEach(trade => {
      traderSet.add(trade.traderPublicId);
      traderSet.add(trade.tradeePublicId);
      totalItems += (trade.traderItemIds || []).length + (trade.tradeeItemIds || []).length;
      
      // Calculate trade value
      const traderCC = (trade.traderItemIds || [])
        .map(id => getItemDetailsByPossessionId(id))
        .filter(item => {
          const valuation = item ? valuations.get(item.prodId) : undefined;
          return item && shouldShowCCBadge(item, valuation);
        })
        .reduce((sum, item) => sum + getCustomCCValue(item, valuations), 0);
      
      const tradeeCC = (trade.tradeeItemIds || [])
        .map(id => getItemDetailsByPossessionId(id))
        .filter(item => {
          const valuation = item ? valuations.get(item.prodId) : undefined;
          return item && shouldShowCCBadge(item, valuation);
        })
        .reduce((sum, item) => sum + getCustomCCValue(item, valuations), 0);
      
      totalValue += traderCC + tradeeCC;
    });

    return {
      totalTrades: tradeData.length,
      totalItems,
      totalValue,
      uniqueTraders: traderSet.size
    };
  };

  const purchaseData = getPurchasesOverTime();
  const spendingData = getSpendingOverTime();
  const distributionData = getItemDistribution();
  const totalSpent = getTotalSpent();
  const analyticsData = getAnalyticsData();

  const combinedTimeData = purchaseData.map(purchase => {
    const spending = spendingData.find(spend => spend.date === purchase.date);
    return {
      date: purchase.date,
      purchases: purchase.purchases,
      spending: spending ? spending.spending : 0
    };
  });

  // Trading data processing
  const tradesTimeData = getTradesOverTime();
  const mostTradedItems = getMostTradedItems();
  const tradingActivity = getTradingActivity();

  const combinedTradeTimeData = tradesTimeData.map(trade => ({
    date: trade.date,
    trades: trade.trades,
    value: trade.value
  }));

  const gradientColors = [
    { start: '#FF6B6B', end: '#EE5A52' },
    { start: '#4ECDC4', end: '#44A08D' },
    { start: '#45B7D1', end: '#2196F3' },
    { start: '#FFA726', end: '#FF7043' },
    { start: '#AB47BC', end: '#8E24AA' },
    { start: '#66BB6A', end: '#43A047' },
    { start: '#FF7043', end: '#D84315' },
    { start: '#42A5F5', end: '#1976D2' },
    { start: '#EC407A', end: '#C2185B' },
    { start: '#26A69A', end: '#00695C' }
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70 w-4 h-4" />
          <select
            value={analyticsDateRange}
            onChange={(e) => setAnalyticsDateRange(e.target.value)}
            className="w-full md:w-48 pl-10 pr-4 py-3 rounded-xl border-2 border-white/30 bg-white/20 backdrop-blur-sm text-white focus:outline-none focus:border-white/60 font-coke shadow-lg transition-all duration-200 hover:bg-white/25"
          >
            <option value="all" className="bg-red-700 text-white">All Time</option>
            <option value="7d" className="bg-red-700 text-white">Last 7 days</option>
            <option value="30d" className="bg-red-700 text-white">Last 30 days</option>
            <option value="90d" className="bg-red-700 text-white">Last 90 days</option>
            <option value="1y" className="bg-red-700 text-white">Last year</option>
          </select>
        </div>
        <div className="relative">
          <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70 w-4 h-4" />
          <select
            value={analyticsCategory}
            onChange={(e) => {
              setAnalyticsCategory(e.target.value);
              setSelectedItemFilter('all');
            }}
            className="w-full md:w-60 pl-10 pr-4 py-3 rounded-xl border-2 border-white/30 bg-white/20 backdrop-blur-sm text-white focus:outline-none focus:border-white/60 font-coke shadow-lg transition-all duration-200 hover:bg-white/25"
          >
            {getUniqueCategories().map(category => (
              <option key={category} value={category} className="bg-red-700 text-white">
                {category === 'all' ? 'All Categories' : category}
              </option>
            ))}
          </select>
        </div>
        {analyticsCategory !== 'all' && (
          <div className="relative">
            <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70 w-4 h-4" />
            <select
              value={selectedItemFilter}
              onChange={(e) => setSelectedItemFilter(e.target.value)}
              className="w-full md:w-60 pl-10 pr-4 py-3 rounded-xl border-2 border-white/30 bg-white/20 backdrop-blur-sm text-white focus:outline-none focus:border-white/60 font-coke shadow-lg transition-all duration-200 hover:bg-white/25"
            >
              <option value="all" className="bg-red-700 text-white">All Items</option>
              {getUniqueItemsInCategory(analyticsCategory).map(item => (
                <option key={item.id} value={item.id} className="bg-red-700 text-white">
                  {item.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Purchase Analytics Card */}
      <div className="bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
        <div 
          className="flex items-center justify-between p-6 cursor-pointer hover:bg-white/50 transition-all duration-200"
          onClick={() => toggleCard('purchaseMetrics')}
        >
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-3 rounded-xl">
              <Package className="w-6 h-6 text-blue-700" />
            </div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent font-coke">
              Purchase Analytics
            </h3>
          </div>
          {expandedCards.purchaseMetrics ? <ChevronDown className="w-6 h-6 text-gray-600" /> : <ChevronRight className="w-6 h-6 text-gray-600" />}
        </div>
        
        {expandedCards.purchaseMetrics && (
          <div className="px-6 pb-6 space-y-4">
            {/* Purchase Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/50 backdrop-blur-lg rounded-xl p-4 border border-white/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 font-coke mb-1">Total Purchases</p>
                    <p className="text-2xl font-bold bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent font-coke">
                      {analyticsData?.length || 0}
                    </p>
                  </div>
                  <Package className="w-6 h-6 text-red-700" />
                </div>
              </div>
              <div className="bg-white/50 backdrop-blur-lg rounded-xl p-4 border border-white/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 font-coke mb-1">Total Spent</p>
                    <p className="text-2xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent font-coke">
                      {totalSpent.toFixed(2)} <span className="text-sm">dB</span>
                    </p>
                  </div>
                  <TrendingUp className="w-6 h-6 text-green-700" />
                </div>
              </div>
              <div className="bg-white/50 backdrop-blur-lg rounded-xl p-4 border border-white/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 font-coke mb-1">
                      {analyticsCategory !== 'all' ? 'Unique Items' : 'Categories'}
                    </p>
                    <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent font-coke">
                      {distributionData.length}
                    </p>
                  </div>
                  <BarChart3 className="w-6 h-6 text-blue-700" />
                </div>
              </div>
            </div>

            {/* Purchase Charts */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              {/* Purchases Over Time */}
              <div className="bg-white/50 backdrop-blur-lg rounded-xl p-4 border border-white/30 xl:col-span-2">
                <h4 className="font-coke font-bold text-lg text-gray-800 mb-4">Purchases & Spending Over Time</h4>
                {combinedTimeData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={combinedTimeData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                      <YAxis yAxisId="purchases" tick={{ fontSize: 10 }} />
                      <YAxis yAxisId="spending" orientation="right" tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Line yAxisId="purchases" type="monotone" dataKey="purchases" stroke="#8B5CF6" strokeWidth={2} />
                      <Line yAxisId="spending" type="monotone" dataKey="spending" stroke="#10B981" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p className="font-coke">No purchase data available</p>
                  </div>
                )}
              </div>

              {/* Purchase Distribution */}
              <div className="bg-white/50 backdrop-blur-lg rounded-xl p-4 border border-white/30">
                <h4 className="font-coke font-bold text-lg text-gray-800 mb-4">
                  {analyticsCategory !== 'all' ? 'Item Distribution' : 'Category Distribution'}
                </h4>
                {distributionData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <defs>
                        {gradientColors.map((color, index) => (
                          <linearGradient key={index} id={`gradient${index}`} x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor={color.start} />
                            <stop offset="100%" stopColor={color.end} />
                          </linearGradient>
                        ))}
                      </defs>
                      <Pie
                        data={distributionData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        innerRadius={30}
                        dataKey="value"
                        stroke="rgba(255,255,255,0.8)"
                        strokeWidth={2}
                      >
                        {distributionData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={`url(#gradient${index % gradientColors.length})`}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p className="font-coke">No distribution data available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Trading Analytics Card */}
      <div className="bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
        <div 
          className="flex items-center justify-between p-6 cursor-pointer hover:bg-white/50 transition-all duration-200"
          onClick={() => toggleCard('tradeMetrics')}
        >
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-purple-100 to-purple-200 p-3 rounded-xl">
              <ArrowLeftRight className="w-6 h-6 text-purple-700" />
            </div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent font-coke">
              Trading Analytics
            </h3>
          </div>
          {expandedCards.tradeMetrics ? <ChevronDown className="w-6 h-6 text-gray-600" /> : <ChevronRight className="w-6 h-6 text-gray-600" />}
        </div>
        
        {expandedCards.tradeMetrics && (
          <div className="px-6 pb-6 space-y-4">
            {/* Trading Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white/50 backdrop-blur-lg rounded-xl p-4 border border-white/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 font-coke mb-1">Total Trades</p>
                    <p className="text-2xl font-bold bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent font-coke">
                      {tradingActivity.totalTrades}
                    </p>
                  </div>
                  <ArrowLeftRight className="w-6 h-6 text-red-700" />
                </div>
              </div>
              <div className="bg-white/50 backdrop-blur-lg rounded-xl p-4 border border-white/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 font-coke mb-1">Total Value</p>
                    <p className="text-2xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent font-coke">
                      {tradingActivity.totalValue.toFixed(2)} <span className="text-sm">CC</span>
                    </p>
                  </div>
                  <TrendingUp className="w-6 h-6 text-green-700" />
                </div>
              </div>
              <div className="bg-white/50 backdrop-blur-lg rounded-xl p-4 border border-white/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 font-coke mb-1">Items Traded</p>
                    <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent font-coke">
                      {tradingActivity.totalItems}
                    </p>
                  </div>
                  <Package className="w-6 h-6 text-blue-700" />
                </div>
              </div>
              <div className="bg-white/50 backdrop-blur-lg rounded-xl p-4 border border-white/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 font-coke mb-1">Unique Traders</p>
                    <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent font-coke">
                      {tradingActivity.uniqueTraders}
                    </p>
                  </div>
                  <Users className="w-6 h-6 text-purple-700" />
                </div>
              </div>
            </div>

            {/* Trading Charts */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              {/* Trades Over Time */}
              <div className="bg-white/50 backdrop-blur-lg rounded-xl p-4 border border-white/30 xl:col-span-2">
                <h4 className="font-coke font-bold text-lg text-gray-800 mb-4">Trades & Value Over Time</h4>
                {combinedTradeTimeData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={combinedTradeTimeData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                      <YAxis yAxisId="trades" tick={{ fontSize: 10 }} />
                      <YAxis yAxisId="value" orientation="right" tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(value, name) => [
                        name === 'trades' ? `${value} trades` : `${value.toFixed(2)} CC`, 
                        name === 'trades' ? 'Trades' : 'Trade Value'
                      ]} />
                      <Line yAxisId="trades" type="monotone" dataKey="trades" stroke="#8B5CF6" strokeWidth={2} />
                      <Line yAxisId="value" type="monotone" dataKey="value" stroke="#10B981" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p className="font-coke">No trade data available</p>
                  </div>
                )}
              </div>

              {/* Most Traded Items */}
              <div className="bg-white/50 backdrop-blur-lg rounded-xl p-4 border border-white/30">
                <h4 className="font-coke font-bold text-lg text-gray-800 mb-4">Most Traded Items</h4>
                {mostTradedItems.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={mostTradedItems} margin={{ top: 10, right: 15, left: 0, bottom: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fontSize: 8 }}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis tick={{ fontSize: 9 }} />
                      <Tooltip formatter={(value) => [`${value} times`, 'Traded']} />
                      <Bar dataKey="count" fill="#3B82F6" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p className="font-coke">No trading data available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsTab; 