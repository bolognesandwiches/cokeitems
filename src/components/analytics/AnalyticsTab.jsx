import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { Filter, Package, Tag, TrendingUp, BarChart3 } from 'lucide-react';

const AnalyticsTab = ({ catalogData, possessionData }) => {
  const [analyticsDateRange, setAnalyticsDateRange] = useState('all');
  const [analyticsCategory, setAnalyticsCategory] = useState('all');
  const [selectedItemFilter, setSelectedItemFilter] = useState('all');

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
            className="w-full md:w-60 pl-10 pr-4 py-3 rounded-xl border-2 border-white/30 bg-white/20 backdrop-blur-sm text-white focus:outline-none focus:border-white/60 font-coke shadow-lg transition-all duration-200 hover:bg-white/25"
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-white/20 hover:shadow-3xl transition-all duration-300 hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 font-coke mb-2">Total Purchases</p>
              <p className="text-4xl font-bold bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent font-coke">
                {analyticsData?.length || 0}
              </p>
            </div>
            <div className="bg-gradient-to-br from-red-100 to-red-200 p-4 rounded-2xl">
              <Package className="w-8 h-8 text-red-700" />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-white/20 hover:shadow-3xl transition-all duration-300 hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 font-coke mb-2">Total Spent</p>
              <p className="text-4xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent font-coke">
                {totalSpent}
                <span className="text-lg ml-1">dB</span>
              </p>
            </div>
            <div className="bg-gradient-to-br from-green-100 to-green-200 p-4 rounded-2xl">
              <TrendingUp className="w-8 h-8 text-green-700" />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-white/20 hover:shadow-3xl transition-all duration-300 hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 font-coke mb-2">
                {analyticsCategory !== 'all' ? 'Unique Items' : 'Categories'}
              </p>
              <p className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent font-coke">
                {distributionData.length}
              </p>
            </div>
            <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-4 rounded-2xl">
              <BarChart3 className="w-8 h-8 text-blue-700" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-white/20 hover:shadow-3xl transition-all duration-300 xl:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-gradient-to-br from-purple-100 to-purple-200 p-3 rounded-xl">
              <TrendingUp className="w-6 h-6 text-purple-700" />
            </div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent font-coke">
              Purchases & Spending Over Time
            </h3>
          </div>
          {combinedTimeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={combinedTimeData} margin={{ top: 20, right: 80, left: 20, bottom: 60 }}>
                <defs>
                  <linearGradient id="purchaseGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="spendingGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 11, fill: '#6B7280' }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  stroke="#9CA3AF"
                />
                <YAxis 
                  yAxisId="purchases"
                  tick={{ fontSize: 11, fill: '#8B5CF6' }} 
                  stroke="#8B5CF6"
                  label={{ value: 'Purchases', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#8B5CF6' } }}
                />
                <YAxis 
                  yAxisId="spending"
                  orientation="right"
                  tick={{ fontSize: 11, fill: '#10B981' }} 
                  stroke="#10B981"
                  label={{ value: 'Spending (dB)', angle: 90, position: 'insideRight', style: { textAnchor: 'middle', fill: '#10B981' } }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                    border: 'none', 
                    borderRadius: '12px',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                    backdropFilter: 'blur(10px)'
                  }}
                  formatter={(value, name) => [
                    name === 'purchases' ? `${value} items` : `${value} dB`, 
                    name === 'purchases' ? 'Purchases' : 'Spending'
                  ]}
                />
                <Line 
                  yAxisId="purchases"
                  type="monotone" 
                  dataKey="purchases" 
                  stroke="#8B5CF6" 
                  strokeWidth={3}
                  fill="url(#purchaseGradient)"
                  dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 5 }}
                  activeDot={{ r: 7, fill: '#7C3AED', strokeWidth: 3, stroke: '#FFFFFF' }}
                />
                <Line 
                  yAxisId="spending"
                  type="monotone" 
                  dataKey="spending" 
                  stroke="#10B981" 
                  strokeWidth={3}
                  fill="url(#spendingGradient)"
                  dot={{ fill: '#10B981', strokeWidth: 2, r: 5 }}
                  activeDot={{ r: 7, fill: '#059669', strokeWidth: 3, stroke: '#FFFFFF' }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-16 text-gray-500">
              <div className="bg-gradient-to-br from-gray-100 to-gray-200 p-6 rounded-2xl inline-block mb-4">
                <TrendingUp className="w-16 h-16 text-gray-400" />
              </div>
              <p className="font-coke text-lg">No purchase data available</p>
            </div>
          )}
        </div>

        <div className="bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-white/20 hover:shadow-3xl transition-all duration-300 xl:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-gradient-to-br from-orange-100 to-orange-200 p-3 rounded-xl">
              <BarChart3 className="w-6 h-6 text-orange-700" />
            </div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent font-coke">
              {analyticsCategory !== 'all' ? 'Item Distribution' : 'Category Distribution'}
            </h3>
          </div>
          {distributionData.length > 0 ? (
            <div className="flex justify-center">
              <ResponsiveContainer width="100%" height={450}>
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
                    outerRadius={150}
                    innerRadius={60}
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
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                      border: 'none', 
                      borderRadius: '12px',
                      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                      backdropFilter: 'blur(10px)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center py-16 text-gray-500">
              <div className="bg-gradient-to-br from-gray-100 to-gray-200 p-6 rounded-2xl inline-block mb-4">
                <BarChart3 className="w-16 h-16 text-gray-400" />
              </div>
              <p className="font-coke text-lg">No distribution data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsTab; 