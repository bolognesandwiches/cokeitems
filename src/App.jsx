import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Loader2, Music, Calendar, Package, BarChart3, TrendingUp, Filter, X } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { imageBaseMap } from './data/imageBaseMap.js';

const CokeStudiosCatalog = () => {
  const [catalogData, setCatalogData] = useState([]);
  const [possessionData, setPossessionData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // New state for tabs and analytics
  const [activeTab, setActiveTab] = useState('catalog');
  const [analyticsDateRange, setAnalyticsDateRange] = useState('all');
  const [analyticsCategory, setAnalyticsCategory] = useState('all');

  // State for scroll detection and header minimization
  const [isScrolled, setIsScrolled] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  // Scroll detection effect
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Header minimizes when scrolled down more than 100px
      setIsScrolled(currentScrollY > 100);
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch catalog data
      const catalogResponse = await fetch('https://decibel.fun/client2/Catalogue_English.txt?r=86');
      const catalogText = await catalogResponse.text();
      
      // Parse catalog data
      const catalogItems = parseCatalogData(catalogText);
      const excludedCategories = ['"Coke Studios Online Catalog"', '"Walls and Floors"'];
      const filteredCatalogItems = catalogItems.filter(item => !excludedCategories.includes(item.catName));
      setCatalogData(filteredCatalogItems);
      
      // Fetch possession data
      const possessionResponse = await fetch('https://decibel.fun/api/possession');
      const possessionJson = await possessionResponse.json();
      setPossessionData(possessionJson);
      
    } catch (err) {
      setError('Failed to fetch data');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const parseCatalogData = (text) => {
    const items = [];
    const lines = text.split('\n');
    
    for (const line of lines) {
      if (line.startsWith('ITEM=[')) {
        try {
          // Extract the item data from the line
          const match = line.match(/ITEM=\[\s*(.+)\s*\]/);
          if (match) {
            const itemData = match[1];
            const item = parseItemProperties(itemData);
            if (item.prodId !== undefined) {
              items.push(item);
            }
          }
        } catch (e) {
          console.warn('Failed to parse item:', line);
        }
      }
    }
    return items;
  };

  const parseItemProperties = (itemData) => {
    const item = {};
    const regex = /#(\w+):\s*"([^"]*)"|\s*#(\w+):\s*([^,\]]+)/g;
    let match;
    
    while ((match = regex.exec(itemData)) !== null) {
      const key = match[1] || match[3];
      let value = match[2] || match[4];
      
      // Clean up the value
      if (value) {
        value = value.trim();
        if (value === 'true') value = true;
        else if (value === 'false') value = false;
        else if (!isNaN(value) && value !== '') value = Number(value);
      }
      
      item[key] = value;
    }
    
    return item;
  };

  const toggleExpanded = (prodId) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(prodId)) {
      newExpanded.delete(prodId);
    } else {
      newExpanded.add(prodId);
    }
    setExpandedItems(newExpanded);
  };

  const getImageUrl = (imageBase) => {
    if (!imageBase) return null;
    
    const key = imageBase.replace(/"/g, '').toLowerCase();
    const imageName = imageBaseMap[key];
    
    if (imageName) {
      return `/icons/${imageName}`;
    }
    
    // Only warn if we expect this to have an image
    if (key) {
      console.warn(`No image mapping found for imageBase: "${key}"`);
    }
    return null;
  };

  const getItemPossessions = (prodId) => {
    return possessionData.filter(possession => possession.catalogItemId === prodId);
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

  const filteredItems = catalogData.filter(item => {
    const matchesSearch = item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.catName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.catDesc?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || item.catName === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const filteredPossessionsCount = filteredItems.reduce((count, item) => {
    return count + getItemPossessions(item.prodId).length;
  }, 0);

  // Analytics functions
  const getAnalyticsData = () => {
    if (!possessionData.length) return null;

    // Filter data based on date range
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

    // Filter by category
    if (analyticsCategory !== 'all') {
      const categoryItems = catalogData.filter(item => item.catName === analyticsCategory);
      const categoryItemIds = new Set(categoryItems.map(item => item.prodId));
      filteredPossessions = filteredPossessions.filter(p => 
        categoryItemIds.has(p.catalogItemId)
      );
    }

    return filteredPossessions;
  };

  const getPurchasesOverTime = () => {
    const analyticsData = getAnalyticsData();
    if (!analyticsData) return [];

    // Group by date
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

    // Group by date and sum spending
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

    // If category filter is applied, show individual items within that category
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
        .slice(0, 10); // Show top 10 items in category
    }

    // Otherwise show category distribution as before
    return getCategoryDistribution();
  };

  const getTotalSpent = () => {
    const analyticsData = getAnalyticsData();
    if (!analyticsData) return 0;
    
    return analyticsData.reduce((total, possession) => {
      return total + (possession.purchasePrice || 0);
    }, 0);
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-600 via-red-700 to-red-800 flex items-center justify-center">
        <div className="text-center text-white fade-in">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-12 mx-auto max-w-md border border-white/20 shadow-2xl">
            <div className="pulse-glow rounded-full w-20 h-20 bg-white/10 flex items-center justify-center mx-auto mb-8">
              <Loader2 className="w-10 h-10 animate-spin" />
            </div>
            <h2 className="text-2xl font-bold font-coke mb-4">Loading CokeMusic Catalog</h2>
            <p className="text-white/80 font-coke">Fetching your items and possessions...</p>
            <div className="flex justify-center mt-6">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-600 via-red-700 to-red-800 flex items-center justify-center">
        <div className="text-center text-white fade-in">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-12 mx-auto max-w-md border border-red-400/30 shadow-2xl">
            <div className="bg-red-500/20 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-8 border border-red-400/40">
              <X className="w-10 h-10 text-red-300" />
            </div>
            <h2 className="text-2xl font-bold font-coke mb-4">Oops! Something went wrong</h2>
            <p className="text-red-200 font-coke mb-8">{error}</p>
            <button 
              onClick={fetchData}
              className="btn-animate px-8 py-3 bg-white text-red-700 rounded-xl font-bold font-coke shadow-lg hover:shadow-xl focus:shadow-glow transition-all duration-300 border-2 border-transparent hover:border-red-200 focus-ring"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }



  const renderCatalogTab = () => (
    <div className="space-y-8">
      {/* Enhanced Search and Filter */}
      <div className="fade-in">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative group">
              <input
                type="text"
                placeholder="Search items, categories, descriptions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-white/30 bg-white/20 backdrop-blur-lg text-white placeholder-white/70 focus:outline-none focus:border-white/60 focus:bg-white/25 font-coke transition-all duration-300 shadow-lg hover:shadow-xl focus:shadow-glow"
              />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-red-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </div>
          </div>
          <div className="md:w-64">
            <div className="relative group">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-white/30 bg-white/20 backdrop-blur-lg text-white focus:outline-none focus:border-white/60 focus:bg-white/25 font-coke transition-all duration-300 shadow-lg hover:shadow-xl focus:shadow-glow cursor-pointer"
              >
                {getUniqueCategories().map(category => (
                  <option key={category} value={category} className="bg-red-700 text-white">
                    {category === 'all' ? 'All Categories' : category.replace(/"/g, '')}
                  </option>
                ))}
              </select>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Enhanced Stats */}
      <div className="fade-in fade-in-delay-1">
        <div className="flex flex-wrap gap-4 text-white/90">
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-lg px-4 py-2 rounded-full border border-white/20 hover:bg-white/15 transition-all duration-300 transform hover:scale-105">
            <Package className="w-5 h-5" />
            <span className="font-coke text-sm font-semibold">{filteredItems.length} items</span>
          </div>
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-lg px-4 py-2 rounded-full border border-white/20 hover:bg-white/15 transition-all duration-300 transform hover:scale-105">
            <Calendar className="w-5 h-5" />
            <span className="font-coke text-sm font-semibold">{filteredPossessionsCount} possessions</span>
          </div>
        </div>
      </div>

      {/* Enhanced Items List */}
      <div className="space-y-4 fade-in fade-in-delay-2">
        {filteredItems.map((item, index) => {
          const possessions = getItemPossessions(item.prodId);
          const isExpanded = expandedItems.has(item.prodId);
          const imageUrl = getImageUrl(item.imageBase);
          
          return (
            <div 
              key={item.prodId} 
              className="bg-white/95 backdrop-blur-lg rounded-xl shadow-lg overflow-hidden card-hover border border-white/20 group"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div 
                className="p-5 cursor-pointer hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100/50 transition-all duration-300 relative overflow-hidden"
                onClick={() => toggleExpanded(item.prodId)}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 flex items-center gap-3">
                      {imageUrl && (
                        <img 
                          src={imageUrl} 
                          alt={item.name.replace(/"/g, '')}
                          className="w-12 h-12 object-contain transition-transform duration-300 group-hover:scale-110"
                          onError={(e) => {
                            console.error(`Failed to load image: ${imageUrl} for item ${item.name}`);
                            e.target.style.display = 'none';
                          }}
                        />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-lg font-bold text-red-700 font-coke transition-colors duration-300 group-hover:text-red-800">
                            {item.name || 'Unnamed Item'}
                          </h3>
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-semibold font-coke transition-all duration-300 group-hover:bg-red-200 group-hover:scale-105">
                            ID: {item.prodId}
                          </span>
                          {possessions.length > 0 && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-semibold font-coke transition-all duration-300 group-hover:bg-green-200 group-hover:scale-105">
                              {possessions.length} owned
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600 mt-2">
                          <span className="font-coke">
                            <strong>Category:</strong> {item.catName || 'Unknown'}
                          </span>
                          <span className="font-coke">
                            <strong>Type:</strong> {item.type || 'Unknown'}
                          </span>
                          {item.catDesc && (
                            <span className="font-coke">
                              <strong>Description:</strong> {item.catDesc}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="transition-transform duration-300 group-hover:scale-110">
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5 text-red-700" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-red-700" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100/50 animate-slide-in-left">
                  <div className="p-6 space-y-4">
                    {possessions.length > 0 && (
                      <div className="fade-in">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="bg-red-100 p-2 rounded-lg">
                            <Calendar className="w-5 h-5 text-red-700" />
                          </div>
                          <h4 className="text-lg font-bold text-red-700 font-coke">
                            Purchase History ({possessions.length} items)
                          </h4>
                        </div>
                        <div className="overflow-x-auto rounded-xl shadow-lg border border-gray-200/50">
                          <table className="min-w-full bg-white overflow-hidden">
                            <thead className="bg-gradient-to-r from-red-700 to-red-600 text-white">
                              <tr>
                                <th className="px-4 py-3 text-left font-coke font-semibold">Purchase ID</th>
                                <th className="px-4 py-3 text-left font-coke font-semibold">Date Purchased</th>
                                <th className="px-4 py-3 text-left font-coke font-semibold">Price Paid</th>
                              </tr>
                            </thead>
                            <tbody className="text-sm">
                              {possessions.map((possession, possessionIndex) => (
                                <tr 
                                  key={possession.id} 
                                  className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50/30 transition-all duration-300 transform hover:scale-[1.01] fade-in"
                                  style={{ animationDelay: `${possessionIndex * 0.1}s` }}
                                >
                                  <td className="px-4 py-3 font-coke font-medium text-gray-700">
                                    <span className="bg-gray-100 px-2 py-1 rounded-lg text-xs">
                                      #{possession.id}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 font-coke text-gray-600">
                                    <div className="flex items-center gap-2">
                                      <Calendar className="w-4 h-4 opacity-50" />
                                      {new Date(possession.datePurchased).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric'
                                      })}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 font-coke">
                                    {possession.purchasePrice === 0 ? (
                                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded-lg text-xs font-semibold">
                                        FREE
                                      </span>
                                    ) : (
                                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-lg text-xs font-semibold">
                                        {possession.purchasePrice} dB
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                    
                    {possessions.length === 0 && (
                      <div className="text-center py-12 fade-in">
                        <div className="bg-white rounded-2xl p-8 border-2 border-dashed border-gray-300 max-w-md mx-auto">
                          <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                            <Package className="w-8 h-8 text-gray-400" />
                          </div>
                          <h5 className="font-coke text-lg font-bold text-gray-700 mb-2">No Purchase History</h5>
                          <p className="font-coke text-sm text-gray-500">This item hasn't been purchased yet</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {filteredItems.length === 0 && (
        <div className="text-center py-16 text-white fade-in fade-in-delay-3">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 mx-auto max-w-md border border-white/20 shadow-xl">
            <div className="pulse-glow rounded-full w-20 h-20 bg-white/10 flex items-center justify-center mx-auto mb-6">
              <Package className="w-10 h-10 opacity-70" />
            </div>
            <h3 className="text-xl font-bold font-coke mb-2">No items found</h3>
            <p className="text-white/80 font-coke text-sm">Try adjusting your search terms or category filter</p>
          </div>
        </div>
      )}
    </div>
  );

  const renderAnalyticsTab = () => {
    const purchaseData = getPurchasesOverTime();
    const spendingData = getSpendingOverTime();
    const distributionData = getItemDistribution();
    const totalSpent = getTotalSpent();
    const analyticsData = getAnalyticsData();

    // Merge purchase and spending data for combo chart
    const combinedTimeData = purchaseData.map(purchase => {
      const spending = spendingData.find(spend => spend.date === purchase.date);
      return {
        date: purchase.date,
        purchases: purchase.purchases,
        spending: spending ? spending.spending : 0
      };
    });

    // Custom gradients and colors for beautiful charts
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
      <div className="space-y-8">
        {/* Analytics Filters */}
        <div className="flex flex-col md:flex-row gap-4">
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
              onChange={(e) => setAnalyticsCategory(e.target.value)}
              className="w-full md:w-60 pl-10 pr-4 py-3 rounded-xl border-2 border-white/30 bg-white/20 backdrop-blur-sm text-white focus:outline-none focus:border-white/60 font-coke shadow-lg transition-all duration-200 hover:bg-white/25"
            >
              {getUniqueCategories().map(category => (
                <option key={category} value={category} className="bg-red-700 text-white">
                  {category === 'all' ? 'All Categories' : category}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Enhanced Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20 hover:shadow-3xl transition-all duration-300 hover:scale-105">
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
          <div className="bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20 hover:shadow-3xl transition-all duration-300 hover:scale-105">
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
          <div className="bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20 hover:shadow-3xl transition-all duration-300 hover:scale-105">
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

                 {/* Beautiful Charts Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Combined Purchases & Spending Over Time */}
          <div className="bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20 hover:shadow-3xl transition-all duration-300 xl:col-span-2">
            <div className="flex items-center gap-3 mb-6">
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

          {/* Enhanced Distribution - Changes based on filter */}
          <div className="bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20 hover:shadow-3xl transition-all duration-300 xl:col-span-2">
            <div className="flex items-center gap-3 mb-6">
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-600 via-red-700 to-red-800">
      {/* Enhanced Responsive Header with Coca-Cola Wave Effect */}
      <div className={`sticky top-0 z-50 transition-all duration-500 ease-in-out transform ${
        isScrolled 
          ? 'bg-white shadow-2xl backdrop-blur-xl coke-wave' 
          : 'bg-white/10 backdrop-blur-lg border-b border-white/20'
      }`}>
        <div className="container mx-auto px-6 transition-all duration-500 ease-in-out">
          <div className={`flex items-center justify-between transition-all duration-500 ease-in-out ${
            isScrolled ? 'py-3' : 'py-4'
          }`}>
            {/* Logo and Title */}
            <div className={`flex items-center gap-3 transition-all duration-500 ease-in-out ${
              isScrolled ? 'transform scale-90' : ''
            }`}>
              <div className={`transition-all duration-500 ease-in-out ${
                isScrolled ? 'bg-red-600 p-2 rounded-full shadow-lg' : ''
              }`}>
                <Music className={`transition-all duration-500 ease-in-out ${
                  isScrolled ? 'w-6 h-6 text-white' : 'w-8 h-8 text-white'
                }`} />
              </div>
              <h1 className={`font-bold font-coke transition-all duration-500 ease-in-out ${
                isScrolled 
                  ? 'text-xl text-red-700 hidden sm:block' 
                  : 'text-3xl text-white'
              }`}>
                {isScrolled ? 'Decibel.fun' : 'Decibel.fun Purchase data'}
              </h1>
            </div>
            
            {/* Enhanced Tabs */}
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('catalog')}
                className={`font-semibold font-coke transition-all duration-300 shadow-lg backdrop-blur-sm transform hover:scale-105 active:scale-95 ${
                  isScrolled
                    ? `px-4 py-2 rounded-lg text-sm ${
                        activeTab === 'catalog'
                          ? 'bg-red-600 text-white shadow-xl border-2 border-red-500'
                          : 'bg-white/80 text-red-700 border-2 border-red-200 hover:bg-red-50 hover:border-red-300'
                      }`
                    : `px-6 py-3 rounded-xl ${
                        activeTab === 'catalog'
                          ? 'bg-white/25 text-white border-2 border-white/50 shadow-xl transform scale-105'
                          : 'bg-white/15 text-white/90 border-2 border-white/25 hover:bg-white/20 hover:border-white/40 hover:shadow-xl hover:scale-[1.02]'
                      }`
                }`}
              >
                <Package className={`inline ${isScrolled ? 'w-4 h-4 mr-1' : 'w-5 h-5 mr-2'}`} />
                Catalog
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`font-semibold font-coke transition-all duration-300 shadow-lg backdrop-blur-sm transform hover:scale-105 active:scale-95 ${
                  isScrolled
                    ? `px-4 py-2 rounded-lg text-sm ${
                        activeTab === 'analytics'
                          ? 'bg-red-600 text-white shadow-xl border-2 border-red-500'
                          : 'bg-white/80 text-red-700 border-2 border-red-200 hover:bg-red-50 hover:border-red-300'
                      }`
                    : `px-6 py-3 rounded-xl ${
                        activeTab === 'analytics'
                          ? 'bg-white/25 text-white border-2 border-white/50 shadow-xl transform scale-105'
                          : 'bg-white/15 text-white/90 border-2 border-white/25 hover:bg-white/20 hover:border-white/40 hover:shadow-xl hover:scale-[1.02]'
                      }`
                }`}
              >
                <BarChart3 className={`inline ${isScrolled ? 'w-4 h-4 mr-1' : 'w-5 h-5 mr-2'}`} />
                Analytics
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="fade-in">
          {activeTab === 'catalog' ? renderCatalogTab() : renderAnalyticsTab()}
        </div>
      </div>
    </div>
  );
};

export default CokeStudiosCatalog;