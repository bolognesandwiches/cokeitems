import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Loader2, Music, Calendar, Package, BarChart3, TrendingUp, Filter, X, Search, DollarSign, Clock, SortAsc, SortDesc, Tag } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { imageBaseMap } from './data/imageBaseMap.js';
import { mockCatalogData, mockPossessionData } from './data/mockData.js';
import { useItemValuation } from './hooks/useItemValuation.js';

const CokeStudiosCatalog = () => {
  const [catalogData, setCatalogData] = useState([]);
  const [possessionData, setPossessionData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Enhanced filtering and sorting state
  const [selectedCategories, setSelectedCategories] = useState(['all']);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedItemFilter, setSelectedItemFilter] = useState('all');
  const [showUnownedItems, setShowUnownedItems] = useState(false);
  
  // New state for tabs and analytics
  const [activeTab, setActiveTab] = useState('catalog');

  // Trades state
  const [trades, setTrades] = useState([]);
  const [tradesLoading, setTradesLoading] = useState(true);
  const [tradesError, setTradesError] = useState(null);
  
  // Detect if running locally
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  
  // Add a URL parameter to force mock data: ?mock=true
  const urlParams = new URLSearchParams(window.location.search);
  const forceMockData = urlParams.get('mock') === 'true';
  const [analyticsDateRange, setAnalyticsDateRange] = useState('all');
  const [analyticsCategory, setAnalyticsCategory] = useState('all');

  // Header is now always sticky - no scroll detection needed

  // --- FIX: Always call useItemValuation at the top level, before any conditional returns ---
  const valuations = useItemValuation(catalogData, possessionData, trades);

  useEffect(() => {
    fetchData();
    fetchTrades();
  }, []);

  // Scroll detection effect - removed since we want sticky header by default
  // useEffect(() => {
  //   const handleScroll = () => {
  //     const currentScrollY = window.scrollY;
  //     
  //     // Header minimizes when scrolled down more than 100px
  //     setIsScrolled(currentScrollY > 100);
  //     setLastScrollY(currentScrollY);
  //   };

  //   window.addEventListener('scroll', handleScroll, { passive: true });
  //   return () => window.removeEventListener('scroll', handleScroll);
  // }, [lastScrollY]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      if (isLocalhost) {
        if (forceMockData) {
          console.log('🔧 Development: Using mock data');
          const catalogItems = parseCatalogData(mockCatalogData);
          setCatalogData(catalogItems);
          setPossessionData(mockPossessionData);
          setLoading(false);
          return;
        }
        
        console.log('🔧 Development: Attempting real API calls');
        
        try {
          // Try to fetch real data first
          const catalogResponse = await fetch('/api/proxy?endpoint=/client2/Catalogue_English.txt?r=86');
          if (catalogResponse.ok) {
            const catalogText = await catalogResponse.text();
            const catalogItems = parseCatalogData(catalogText);
            const excludedCategories = ['"Coke Studios Online Catalog"', '"Walls and Floors"'];
            const filteredCatalogItems = catalogItems.filter(item => !excludedCategories.includes(item.catName));
            setCatalogData(filteredCatalogItems);
            
            const possessionResponse = await fetch('/api/proxy?endpoint=/api/possession');
            if (possessionResponse.ok) {
              const possessionJson = await possessionResponse.json();
              setPossessionData(possessionJson);
            } else {
              console.log('⚠️ Real possession data unavailable, using mock data');
              setPossessionData(mockPossessionData);
            }
          } else {
            console.log('⚠️ Real catalog data unavailable, using mock data');
            const catalogItems = parseCatalogData(mockCatalogData);
            setCatalogData(catalogItems);
            setPossessionData(mockPossessionData);
          }
        } catch (error) {
          console.log('⚠️ API calls failed, falling back to mock data:', error.message);
          const catalogItems = parseCatalogData(mockCatalogData);
          setCatalogData(catalogItems);
          setPossessionData(mockPossessionData);
        }
        
        setLoading(false);
        return;
      }
      
      // Fetch catalog data
      const catalogResponse = await fetch('/api/proxy?endpoint=/client2/Catalogue_English.txt?r=86');
      const catalogText = await catalogResponse.text();
      
      // Parse catalog data
      const catalogItems = parseCatalogData(catalogText);
      const excludedCategories = ['"Coke Studios Online Catalog"', '"Walls and Floors"'];
      const filteredCatalogItems = catalogItems.filter(item => !excludedCategories.includes(item.catName));
      setCatalogData(filteredCatalogItems);
      
      // Fetch possession data
      const possessionResponse = await fetch('/api/proxy?endpoint=/api/possession');
      const possessionJson = await possessionResponse.json();
      setPossessionData(possessionJson);
      
    } catch (err) {
      setError('Failed to fetch data');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch trades from API
  const fetchTrades = async () => {
    try {
      setTradesLoading(true);
      setTradesError(null);
      const response = await fetch('/api/proxy?endpoint=/api/trading');
      if (!response.ok) throw new Error('Failed to fetch trades');
      const data = await response.json();
      setTrades(data);
    } catch (err) {
      setTradesError('Failed to fetch trades');
      setTrades([]);
    } finally {
      setTradesLoading(false);
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

  const getUniqueItemsInCategory = (category) => {
    if (category === 'all') return [];
    const items = catalogData.filter(item => item.catName === category);
    return items.map(item => ({
      id: item.prodId,
      name: item.name?.replace(/"/g, '') || 'Unnamed Item'
    })).sort((a, b) => a.name.localeCompare(b.name));
  };

  const getItemPrice = (item) => {
    const possessions = getItemPossessions(item.prodId);
    if (possessions.length === 0) return 0;
    // Return the most recent purchase price, or average if multiple
    return possessions[0].purchasePrice || 0;
  };

  const getItemPurchaseDate = (item) => {
    const possessions = getItemPossessions(item.prodId);
    if (possessions.length === 0) return null;
    // Return the most recent purchase date
    return new Date(possessions[0].datePurchased);
  };

  const filteredItems = catalogData.filter(item => {
    // Category filter
    if (!selectedCategories.includes('all') && !selectedCategories.includes(item.catName)) {
      return false;
    }
    // Search filter
    if (searchTerm && !(
      (item.name && item.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.catName && item.catName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.catDesc && item.catDesc.toLowerCase().includes(searchTerm.toLowerCase()))
    )) {
      return false;
    }
    // Price filter
    const price = getItemPrice(item);
    if (priceRange.min && price < Number(priceRange.min)) return false;
    if (priceRange.max && price > Number(priceRange.max)) return false;
    // Date filter
    const purchaseDate = getItemPurchaseDate(item);
    if (dateRange.start && (!purchaseDate || purchaseDate < new Date(dateRange.start))) return false;
    if (dateRange.end && (!purchaseDate || purchaseDate > new Date(dateRange.end))) return false;
    // Item filter
    if (selectedItemFilter !== 'all' && item.prodId !== parseInt(selectedItemFilter)) return false;
    // Show unowned items filter
    if (!showUnownedItems && getItemPossessions(item.prodId).length === 0) return false;
    return true;
  });

  // Enhanced sorting
  const sortedItems = [...filteredItems].sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case 'name':
        aValue = a.name?.replace(/"/g, '') || '';
        bValue = b.name?.replace(/"/g, '') || '';
        break;
      case 'category':
        aValue = a.catName || '';
        bValue = b.catName || '';
        break;
      case 'price':
        aValue = getItemPrice(a);
        bValue = getItemPrice(b);
        break;
      case 'date':
        aValue = getItemPurchaseDate(a) || new Date(0);
        bValue = getItemPurchaseDate(b) || new Date(0);
        break;
      case 'possessions':
        aValue = getItemPossessions(a.prodId).length;
        bValue = getItemPossessions(b.prodId).length;
        break;
      default:
        aValue = a.name?.replace(/"/g, '') || '';
        bValue = b.name?.replace(/"/g, '') || '';
    }
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortOrder === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    } else {
      return sortOrder === 'asc' 
        ? aValue - bValue
        : bValue - aValue;
    }
  });

  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedCategories(['all']);
    setPriceRange({ min: '', max: '' });
    setDateRange({ start: '', end: '' });
    setSortBy('name');
    setSortOrder('asc');
    setShowFilters(false);
    setShowUnownedItems(false);
  };

  const hasActiveFilters = () => {
    return searchTerm || 
           !selectedCategories.includes('all') || 
           priceRange.min || 
           priceRange.max || 
           dateRange.start || 
           dateRange.end ||
           sortBy !== 'name' ||
           sortOrder !== 'asc' ||
           showUnownedItems;
  };

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

    // Filter by specific item
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

  // Helper to get item details from possessionId
  const getItemDetailsByPossessionId = (possessionId) => {
    const possession = possessionData.find(p => p.id === possessionId);
    if (!possession) return null;
    const item = catalogData.find(i => i.prodId === possession.catalogItemId);
    return item ? { ...item, possession } : null;
  };

  // Helper to check if all item ids in a trade are valid possessions
  const isTradeValid = (trade) => {
    const allIds = [...(trade.traderItemIds || []), ...(trade.tradeeItemIds || [])];
    return allIds.every(pid => possessionData.some(p => p.id === pid));
  };

  // Trades tab filter/search state
  const [tradesSearchTerm, setTradesSearchTerm] = useState('');
  const [tradesSelectedCategories, setTradesSelectedCategories] = useState(['all']);
  const [tradesSortBy, setTradesSortBy] = useState('date');
  const [tradesSortOrder, setTradesSortOrder] = useState('desc');
  const [tradesShowFilters, setTradesShowFilters] = useState(false);

  // Helper to get all items in a trade (resolved)
  const getTradeItems = (trade) => {
    const traderItems = (trade.traderItemIds || []).map(getItemDetailsByPossessionId).filter(Boolean);
    const tradeeItems = (trade.tradeeItemIds || []).map(getItemDetailsByPossessionId).filter(Boolean);
    return [...traderItems, ...tradeeItems];
  };

  // --- Custom CC Valuation Logic for Trades ---
  const getCustomCCValue = (item) => {
    if (!item) return 0;
    // Use the same cleaning logic as in catalog
    const cleanedItemName = (item.name || '').replace(/"/g, '').trim();
    let value = valuations.get(item.prodId);
    if (value === undefined || value === null) return 0;
    if (cleanedItemName === 'Coca-Cola Pinball Machine') {
      value = value * 30;
    } else if ([
      'Gold Record',
      'Platinum Record',
      'Cushion',
      'Robot Dog',
      'Victorian Chair',
      'Victorian Table'
    ].includes(cleanedItemName)) {
      value = value / 3;
    } else if ([
      'Dryer',
      'Washer',
      'Gear Table',
      'Robot Sculpture',
      'Scrap Metal Carpet',
      'Tatami Mat',
      'Tire Chair',
      'Rice Paper Divider',
      'Recycling Bin'
    ].includes(cleanedItemName)) {
      value = value / 2;
    }
    if (cleanedItemName === 'V-Ball Machine') {
      value = value * 2;
    }
    if (cleanedItemName === 'Coca-Cola Neon Sign') {
      value = 0.7;
    }
    if (cleanedItemName === 'Coke Couch') {
      value = 1;
    }
    return value;
  };

  // Helper to get sum CC value for a list of possession IDs
  const getTradeCCSum = (possessionIds) => {
    return (possessionIds || [])
      .map(pid => getItemDetailsByPossessionId(pid))
      .filter(item => {
        const valuation = item ? valuations.get(item.prodId) : undefined;
        return item && shouldShowCCBadge(item, valuation);
      })
      .reduce((sum, item) => sum + getCustomCCValue(item), 0);
  };

  // Helper to get all unique categories from all trade items
  const getUniqueTradeCategories = () => {
    const categories = new Set(['all']);
    trades.forEach(trade => {
      getTradeItems(trade).forEach(item => {
        if (item.catName) categories.add(item.catName);
      });
    });
    return Array.from(categories).sort();
  };

  // Helper to check if a trade matches the current filter/search
  const doesTradeMatchFilters = (trade) => {
    const items = getTradeItems(trade);
    // Search filter
    const matchesSearch = tradesSearchTerm.trim() === '' || items.some(item =>
      (item.name?.toLowerCase().includes(tradesSearchTerm.toLowerCase()) ||
       item.catName?.toLowerCase().includes(tradesSearchTerm.toLowerCase()) ||
       item.catDesc?.toLowerCase().includes(tradesSearchTerm.toLowerCase()))
    );
    // Category filter
    const matchesCategory = tradesSelectedCategories.includes('all') ||
      items.some(item => tradesSelectedCategories.includes(item.catName));
    return matchesSearch && matchesCategory;
  };

  // Helper to sort trades
  const sortTrades = (a, b) => {
    let aValue, bValue;
    switch (tradesSortBy) {
      case 'date':
        aValue = new Date(a.tradeDate);
        bValue = new Date(b.tradeDate);
        break;
      case 'items':
        aValue = getTradeItems(a).length;
        bValue = getTradeItems(b).length;
        break;
      case 'id':
        aValue = a.tradeId;
        bValue = b.tradeId;
        break;
      default:
        aValue = new Date(a.tradeDate);
        bValue = new Date(b.tradeDate);
    }
    return tradesSortOrder === 'asc' ? aValue - bValue : bValue - aValue;
  };

  // Helper to clear all trades filters
  const clearAllTradesFilters = () => {
    setTradesSearchTerm('');
    setTradesSelectedCategories(['all']);
    setTradesSortBy('date');
    setTradesSortOrder('desc');
    setTradesShowFilters(false);
  };

  // Helper to check if any trades filters are active
  const hasActiveTradesFilters = () => {
    return tradesSearchTerm ||
      !tradesSelectedCategories.includes('all') ||
      tradesSortBy !== 'date' ||
      tradesSortOrder !== 'desc';
  };

  // --- CC Badge Display Logic (shared for Catalog and Trades) ---
  const shouldShowCCBadge = (item, valuation) => {
    if (!item) return false;
    const cleanedCatName = (item.catName || '').replace(/"/g, '').replace(/\s+/g, '');
    const cleanedItemName = (item.name || '').replace(/"/g, '').trim();
    const excludedNec6 = [
      'Beach View',
      'City View',
      'Black Traffic Light',
      'Curtain',
      'Retro TV',
      'Spider Web'
    ];
    if (cleanedItemName === 'Coca-Cola Pinball Machine') {
      return valuation !== undefined && valuation !== null;
    }
    if (cleanedItemName === 'Coca-Cola Neon Sign') {
      return true;
    }
    if (cleanedItemName === 'Coke Couch') {
      return true;
    }
    return ([
      'Necessities6',
      'Special'
    ].includes(cleanedCatName)
      && valuation !== undefined && valuation !== null
      && !excludedNec6.includes(cleanedItemName));
  };

  // State for expanded trades
  const [expandedTradeIds, setExpandedTradeIds] = useState(new Set());

  const toggleTradeExpand = (tradeId) => {
    setExpandedTradeIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tradeId)) {
        newSet.delete(tradeId);
      } else {
        newSet.add(tradeId);
      }
      return newSet;
    });
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
    <div className="space-y-4">
                {/* Enhanced Search and Filter */}
          <div className="fade-in">
            <div className="flex flex-col gap-3">
              {/* Search Bar */}
              <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search items, categories, descriptions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-white/30 bg-white/20 backdrop-blur-lg text-white placeholder-white/70 focus:outline-none focus:border-white/60 focus:bg-white/25 font-coke transition-all duration-300 shadow-lg hover:shadow-xl focus:shadow-glow"
                />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-red-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </div>
            </div>
            
            {/* Sort Controls */}
            <div className="flex gap-1">
              <div className="relative group">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-3 rounded-xl border-2 border-white/30 bg-white/20 backdrop-blur-lg text-white focus:outline-none focus:border-white/60 focus:bg-white/25 font-coke transition-all duration-300 shadow-lg hover:shadow-xl focus:shadow-glow cursor-pointer"
                >
                  <option value="name" className="bg-red-700 text-white">Name</option>
                  <option value="category" className="bg-red-700 text-white">Category</option>
                  <option value="price" className="bg-red-700 text-white">Price</option>
                  <option value="date" className="bg-red-700 text-white">Date</option>
                  <option value="possessions" className="bg-red-700 text-white">Possessions</option>
                </select>
              </div>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-4 py-3 rounded-xl border-2 border-white/30 bg-white/20 backdrop-blur-lg text-white hover:bg-white/25 focus:outline-none focus:border-white/60 font-coke transition-all duration-300 shadow-lg hover:shadow-xl focus:shadow-glow"
              >
                {sortOrder === 'asc' ? <SortAsc className="w-5 h-5" /> : <SortDesc className="w-5 h-5" />}
              </button>
            </div>
            
            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-3 rounded-xl border-2 backdrop-blur-lg font-coke transition-all duration-300 shadow-lg hover:shadow-xl focus:shadow-glow flex items-center gap-2 ${
                showFilters || hasActiveFilters()
                  ? 'border-red-400 bg-red-500/30 text-white'
                  : 'border-white/30 bg-white/20 text-white hover:bg-white/25 focus:border-white/60'
              }`}
            >
              <Filter className="w-5 h-5" />
              Filters
              {hasActiveFilters() && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {[
                    searchTerm && 1,
                    !selectedCategories.includes('all') && selectedCategories.length,
                    (priceRange.min || priceRange.max) && 1,
                    (dateRange.start || dateRange.end) && 1
                  ].filter(Boolean).reduce((a, b) => a + b, 0)}
                </span>
              )}
            </button>
          </div>

          {/* Advanced Filters Panel */}
          {showFilters && (
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20 animate-slide-in-down">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Category Filter */}
                <div>
                  <label className="block text-white font-coke font-semibold mb-1">Categories</label>
                  <div className="space-y-1 max-h-28 overflow-y-auto">
                    {getUniqueCategories().map(category => (
                      <label key={category} className="flex items-center gap-2 text-white/90 hover:text-white cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(category)}
                          onChange={e => {
                            if (e.target.checked) {
                              if (category === 'all') {
                                setSelectedCategories(['all']);
                              } else {
                                setSelectedCategories(prev => prev.filter(c => c !== 'all').concat(category));
                              }
                            } else {
                              setSelectedCategories(prev => prev.filter(c => c !== category));
                            }
                          }}
                          className="rounded border-white/30 bg-white/20"
                        />
                        <span className="font-coke text-sm">{category === 'all' ? 'All Categories' : category.replace(/"/g, '')}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Price Range Filter */}
                <div>
                  <label className="block text-white font-coke font-semibold mb-1">Price Range (dB)</label>
                  <div className="space-y-1">
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70 w-4 h-4" />
                      <input
                        type="number"
                        placeholder="Min price"
                        value={priceRange.min}
                        onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                        className="w-full pl-10 pr-3 py-2 rounded-lg border border-white/30 bg-white/20 text-white placeholder-white/70 focus:outline-none focus:border-white/60 font-coke text-sm"
                      />
                    </div>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70 w-4 h-4" />
                      <input
                        type="number"
                        placeholder="Max price"
                        value={priceRange.max}
                        onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                        className="w-full pl-10 pr-3 py-2 rounded-lg border border-white/30 bg-white/20 text-white placeholder-white/70 focus:outline-none focus:border-white/60 font-coke text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Date Range Filter */}
                <div>
                  <label className="block text-white font-coke font-semibold mb-1">Purchase Date</label>
                  <div className="space-y-1">
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70 w-4 h-4" />
                      <input
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                        className="w-full pl-10 pr-3 py-2 rounded-lg border border-white/30 bg-white/20 text-white focus:outline-none focus:border-white/60 font-coke text-sm"
                      />
                    </div>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70 w-4 h-4" />
                      <input
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                        className="w-full pl-10 pr-3 py-2 rounded-lg border border-white/30 bg-white/20 text-white focus:outline-none focus:border-white/60 font-coke text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Show Unowned Items Checkbox - move here above Clear Filters */}
                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 text-white/90 hover:text-white cursor-pointer mb-4">
                    <input
                      type="checkbox"
                      checked={showUnownedItems}
                      onChange={e => setShowUnownedItems(e.target.checked)}
                      className="rounded border-white/30 bg-white/20"
                    />
                    <span className="font-coke text-sm">Show unowned items</span>
                  </label>
                </div>

                {/* Clear Filters */}
                <div className="flex items-end">
                  <button
                    onClick={clearAllFilters}
                    className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-coke font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    Clear All Filters
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Enhanced Stats */}
      <div className="fade-in fade-in-delay-1">
        <div className="flex flex-wrap gap-2 text-white/90">
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-lg px-4 py-2 rounded-full border border-white/20 hover:bg-white/15 transition-all duration-300 transform hover:scale-105">
            <Package className="w-5 h-5" />
            <span className="font-coke text-sm font-semibold">{sortedItems.length} items</span>
          </div>
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-lg px-4 py-2 rounded-full border border-white/20 hover:bg-white/15 transition-all duration-300 transform hover:scale-105">
            <Calendar className="w-5 h-5" />
            <span className="font-coke text-sm font-semibold">{filteredPossessionsCount} possessions</span>
          </div>
          {hasActiveFilters() && (
            <div className="flex items-center gap-2 bg-red-500/20 backdrop-blur-lg px-4 py-2 rounded-full border border-red-400/30 hover:bg-red-500/30 transition-all duration-300 transform hover:scale-105">
              <Filter className="w-5 h-5 text-red-300" />
              <span className="font-coke text-sm font-semibold text-red-200">Filters Active</span>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Items List */}
      <div className="space-y-2 fade-in fade-in-delay-2">
        {sortedItems.map((item, index) => {
          const possessions = getItemPossessions(item.prodId);
          const isExpanded = expandedItems.has(item.prodId);
          const imageUrl = getImageUrl(item.imageBase);
          const valuation = valuations.get(item.prodId);

          // --- Use Shared Helper Functions for Consistency ---
          const showCCBadge = shouldShowCCBadge(item, valuation);
          const displayValuation = getCustomCCValue(item);

          return (
            <div 
              key={item.prodId} 
              className="bg-white/95 backdrop-blur-lg rounded-xl shadow-lg overflow-hidden card-hover border border-white/20 group"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div 
                className="p-4 cursor-pointer hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100/50 transition-all duration-300 relative overflow-hidden"
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
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
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
                          {showCCBadge && (
                            <span className="flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold font-coke transition-all duration-300 group-hover:bg-purple-200 group-hover:scale-105">
                              <TrendingUp className="w-3 h-3" />
                              {displayValuation.toFixed(2)} CC
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-600 mt-1">
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
                  <div className="p-4 space-y-3">
                    {possessions.length > 0 && (
                      <div className="fade-in">
                        <div className="flex items-center gap-2 mb-3">
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
                      <div className="text-center py-8 fade-in">
                        <div className="bg-white rounded-2xl p-6 border-2 border-dashed border-gray-300 max-w-md mx-auto">
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
      
      {sortedItems.length === 0 && (
        <div className="text-center py-12 text-white fade-in fade-in-delay-3">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mx-auto max-w-md border border-white/20 shadow-xl">
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
      <div className="space-y-4">
        {/* Analytics Filters */}
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
                setSelectedItemFilter('all'); // Reset item filter when category changes
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

        {/* Enhanced Summary Cards */}
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

                 {/* Beautiful Charts Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Combined Purchases & Spending Over Time */}
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

          {/* Enhanced Distribution - Changes based on filter */}
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

  // Trades Tab Renderer
  const renderTradesTab = () => {
    // Filter out trades with any unknown items
    const validTrades = trades.filter(isTradeValid);

    // --- Merge trades by publicId pair and 5-minute window ---
    // Helper to get a canonical key for a trade pair (order-independent)
    const getTradePairKey = (trade) => {
      const ids = [trade.traderPublicId, trade.tradeePublicId].sort();
      return ids.join('::');
    };

    // Sort trades by date ascending
    const sortedByDate = [...validTrades].sort((a, b) => new Date(a.tradeDate) - new Date(b.tradeDate));

    // Merge logic
    const mergedTrades = [];
    let i = 0;
    while (i < sortedByDate.length) {
      const baseTrade = sortedByDate[i];
      const baseKey = getTradePairKey(baseTrade);
      const baseTime = new Date(baseTrade.tradeDate).getTime();
      let group = [baseTrade];
      let j = i + 1;
      while (j < sortedByDate.length) {
        const nextTrade = sortedByDate[j];
        const nextKey = getTradePairKey(nextTrade);
        const nextTime = new Date(nextTrade.tradeDate).getTime();
        if (nextKey === baseKey && (nextTime - baseTime) <= 10 * 60 * 1000) {
          group.push(nextTrade);
          j++;
        } else {
          break;
        }
      }
      // Merge group into one trade
      if (group.length === 1) {
        mergedTrades.push(baseTrade);
      } else {
        // Robust merge: bucket items by publicId, regardless of direction
        const itemsByPerson = {
          [baseTrade.traderPublicId]: [],
          [baseTrade.tradeePublicId]: [],
        };

        group.forEach(trade => {
          itemsByPerson[trade.traderPublicId].push(...(trade.traderItemIds || []));
          itemsByPerson[trade.tradeePublicId].push(...(trade.tradeeItemIds || []));
        });

        mergedTrades.push({
          tradeId: group.map(t => t.tradeId).join(','),
          tradeDate: group[0].tradeDate,
          traderItemIds: itemsByPerson[baseTrade.traderPublicId],
          tradeeItemIds: itemsByPerson[baseTrade.tradeePublicId],
          traderPublicId: baseTrade.traderPublicId,
          tradeePublicId: baseTrade.tradeePublicId,
          mergedCount: group.length
        });
      }
      i += group.length;
    }

    // Apply search/filter
    const filteredTrades = mergedTrades.filter(doesTradeMatchFilters);
    // Sort
    const sortedTrades = [...filteredTrades].sort(sortTrades);

    return (
      <div className="space-y-4 fade-in">
        {/* Trades Search and Filter UI */}
        <div className="fade-in">
          <div className="flex flex-col gap-3">
            {/* Search Bar */}
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1">
                <div className="relative group">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search items, categories, descriptions..."
                    value={tradesSearchTerm}
                    onChange={(e) => setTradesSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-white/30 bg-white/20 backdrop-blur-lg text-white placeholder-white/70 focus:outline-none focus:border-white/60 focus:bg-white/25 font-coke transition-all duration-300 shadow-lg hover:shadow-xl focus:shadow-glow"
                  />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-red-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                </div>
              </div>
              {/* Sort Controls */}
              <div className="flex gap-1">
                <div className="relative group">
                  <select
                    value={tradesSortBy}
                    onChange={(e) => setTradesSortBy(e.target.value)}
                    className="px-4 py-3 rounded-xl border-2 border-white/30 bg-white/20 backdrop-blur-lg text-white focus:outline-none focus:border-white/60 focus:bg-white/25 font-coke transition-all duration-300 shadow-lg hover:shadow-xl focus:shadow-glow cursor-pointer"
                  >
                    <option value="date" className="bg-red-700 text-white">Date</option>
                    <option value="id" className="bg-red-700 text-white">Trade ID</option>
                    <option value="items" className="bg-red-700 text-white"># Items</option>
                  </select>
                </div>
                <button
                  onClick={() => setTradesSortOrder(tradesSortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-4 py-3 rounded-xl border-2 border-white/30 bg-white/20 backdrop-blur-lg text-white hover:bg-white/25 focus:outline-none focus:border-white/60 font-coke transition-all duration-300 shadow-lg hover:shadow-xl focus:shadow-glow"
                >
                  {tradesSortOrder === 'asc' ? <SortAsc className="w-5 h-5" /> : <SortDesc className="w-5 h-5" />}
                </button>
              </div>
              {/* Filter Toggle */}
              <button
                onClick={() => setTradesShowFilters(!tradesShowFilters)}
                className={`px-4 py-3 rounded-xl border-2 backdrop-blur-lg font-coke transition-all duration-300 shadow-lg hover:shadow-xl focus:shadow-glow flex items-center gap-2 ${
                  tradesShowFilters || hasActiveTradesFilters()
                    ? 'border-red-400 bg-red-500/30 text-white'
                    : 'border-white/30 bg-white/20 text-white hover:bg-white/25 focus:border-white/60'
                }`}
              >
                <Filter className="w-5 h-5" />
                Filters
                {hasActiveTradesFilters() && (
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {[
                      tradesSearchTerm && 1,
                      !tradesSelectedCategories.includes('all') && tradesSelectedCategories.length
                    ].filter(Boolean).reduce((a, b) => a + b, 0)}
                  </span>
                )}
              </button>
            </div>
            {/* Advanced Filters Panel */}
            {tradesShowFilters && (
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20 animate-slide-in-down">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Category Filter */}
                  <div>
                    <label className="block text-white font-coke font-semibold mb-1">Categories</label>
                    <div className="space-y-1 max-h-28 overflow-y-auto">
                      {getUniqueTradeCategories().map(category => (
                        <label key={category} className="flex items-center gap-2 text-white/90 hover:text-white cursor-pointer">
                          <input
                            type="checkbox"
                            checked={tradesSelectedCategories.includes(category)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                if (category === 'all') {
                                  setTradesSelectedCategories(['all']);
                                } else {
                                  setTradesSelectedCategories(prev =>
                                    prev.filter(c => c !== 'all').concat(category)
                                  );
                                }
                              } else {
                                setTradesSelectedCategories(prev =>
                                  prev.filter(c => c !== category)
                                );
                              }
                            }}
                            className="rounded border-white/30 bg-white/20"
                          />
                          <span className="font-coke text-sm">{category === 'all' ? 'All Categories' : category.replace(/"/g, '')}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  {/* Clear Filters Button */}
                  <div className="flex items-end">
                    <button
                      onClick={clearAllTradesFilters}
                      className="px-4 py-2 rounded-xl border-2 border-white/30 bg-white/20 text-white font-coke hover:bg-white/25 transition-all duration-300 shadow-lg"
                    >
                      Clear All Filters
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          {/* Enhanced Stats */}
          <div className="fade-in fade-in-delay-1">
            <div className="flex flex-wrap gap-2 text-white/90">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-lg px-4 py-2 rounded-full border border-white/20 hover:bg-white/15 transition-all duration-300 transform hover:scale-105">
                <Package className="w-5 h-5" />
                <span className="font-coke text-sm font-semibold">{sortedTrades.length} trades</span>
              </div>
              {hasActiveTradesFilters() && (
                <div className="flex items-center gap-2 bg-red-500/20 backdrop-blur-lg px-4 py-2 rounded-full border border-red-400/30 hover:bg-red-500/30 transition-all duration-300 transform hover:scale-105">
                  <Filter className="w-5 h-5 text-red-300" />
                  <span className="font-coke text-sm font-semibold text-red-200">Filters Active</span>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Trades List or No Results */}
        {tradesLoading ? (
          <div className="min-h-[300px] flex items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-red-600" />
          </div>
        ) : tradesError ? (
          <div className="min-h-[300px] flex items-center justify-center text-red-200">
            <X className="w-8 h-8 mr-2" />
            {tradesError}
          </div>
        ) : !sortedTrades || sortedTrades.length === 0 ? (
          <div className="min-h-[300px] flex flex-col items-center justify-center text-white/80 fade-in">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 mx-auto max-w-md border border-white/20 shadow-xl mb-4">
              <Package className="w-10 h-10 opacity-70 mx-auto mb-2" />
              <h3 className="text-xl font-bold font-coke mb-2 text-center">No trades found</h3>
              <p className="font-coke text-sm text-center">No trades are available for the selected items.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {sortedTrades.map(trade => {
              // Always define these at the top of the callback
              const traderTotal = getTradeCCSum(trade.traderItemIds);
              const tradeeTotal = getTradeCCSum(trade.tradeeItemIds);
              const traderBadgeColor = 'bg-purple-100 text-purple-700';
              const tradeeBadgeColor = 'bg-purple-100 text-purple-700';
              const isMerged = trade.mergedCount && trade.mergedCount > 1;
              const isExpanded = expandedTradeIds.has(trade.tradeId);
              // For merged trades, get the group of individual trades
              let subTrades = [];
              if (isMerged) {
                // Find all trades in the group by tradeId
                const tradeIds = trade.tradeId.split(',').map(id => id.trim());
                subTrades = validTrades.filter(t => tradeIds.includes(String(t.tradeId)));
              }
              return (
                <div
                  key={trade.tradeId}
                  className={`bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-white/20 hover:shadow-3xl transition-all duration-300 hover:scale-105 ${isMerged ? 'cursor-pointer' : ''}`}
                  onClick={isMerged ? () => toggleTradeExpand(trade.tradeId) : undefined}
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-coke font-bold text-lg text-red-700 flex items-center">
                        {isMerged && (
                          <span className="mr-2">
                            {isExpanded ? <ChevronDown className="inline w-5 h-5 text-red-700" /> : <ChevronRight className="inline w-5 h-5 text-red-700" />}
                          </span>
                        )}
                        Trade #{isMerged ? trade.tradeId.split(',')[0] + ` (+${trade.mergedCount - 1})` : trade.tradeId}
                      </span>
                      <span className="text-gray-500 font-coke text-sm">{new Date(trade.tradeDate).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                      <div className="font-coke text-sm text-gray-600 mb-1 flex items-center justify-between">
                        <span>Trader gave:</span>
                        <span className={`font-coke text-base font-bold rounded-full px-3 py-1 ml-2 flex items-center gap-2 shadow-lg ${traderBadgeColor}`}>
                          <TrendingUp className="w-3 h-3" />
                          {traderTotal.toFixed(2)} CC
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {trade.traderItemIds.length === 0 && <span className="text-gray-400 font-coke">Nothing</span>}
                        {trade.traderItemIds.map(pid => {
                          const item = getItemDetailsByPossessionId(pid);
                          const valuation = item ? valuations.get(item.prodId) : undefined;
                          const showBadge = item && shouldShowCCBadge(item, valuation);
                          console.log('[TradeTab Badge Debug]', {
                            pid,
                            item,
                            prodId: item && item.prodId,
                            name: item && item.name,
                            catName: item && item.catName,
                            showBadge
                          });
                          return item ? (
                            <div key={`${trade.tradeId}-${pid}`} className="flex items-center gap-2 bg-white/40 rounded-lg px-3 py-1 shadow border border-white/30">
                              {item.imageBase && (
                                <img src={getImageUrl(item.imageBase)} alt={item.name} className="w-8 h-8 object-contain" />
                              )}
                              <span className="font-coke text-sm">{item.name?.replace(/"/g, '') || 'Unknown'}</span>
                              {showBadge && (
                                <span className="ml-1 flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold font-coke">
                                  <TrendingUp className="w-3 h-3" />
                                  {(() => {
                                    let displayValuation = getCustomCCValue(item);
                                    return displayValuation.toFixed(2);
                                  })()} CC
                                </span>
                              )}
                            </div>
                          ) : (
                            <span key={pid} className="text-gray-400 font-coke">Unknown Item</span>
                          );
                        })}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="font-coke text-sm text-gray-600 mb-1 flex items-center justify-between">
                        <span>Tradee gave:</span>
                        <span className={`font-coke text-base font-bold rounded-full px-3 py-1 ml-2 flex items-center gap-2 shadow-lg ${tradeeBadgeColor}`}>
                          <TrendingUp className="w-3 h-3" />
                          {tradeeTotal.toFixed(2)} CC
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {trade.tradeeItemIds.length === 0 && <span className="text-gray-400 font-coke">Nothing</span>}
                        {trade.tradeeItemIds.map(pid => {
                          const item = getItemDetailsByPossessionId(pid);
                          const valuation = item ? valuations.get(item.prodId) : undefined;
                          const showBadge = item && shouldShowCCBadge(item, valuation);
                          console.log('[TradeTab Badge Debug]', {
                            pid,
                            item,
                            prodId: item && item.prodId,
                            name: item && item.name,
                            catName: item && item.catName,
                            showBadge
                          });
                          return item ? (
                            <div key={`${trade.tradeId}-${pid}`} className="flex items-center gap-2 bg-white/40 rounded-lg px-3 py-1 shadow border border-white/30">
                              {item.imageBase && (
                                <img src={getImageUrl(item.imageBase)} alt={item.name} className="w-8 h-8 object-contain" />
                              )}
                              <span className="font-coke text-sm">{item.name?.replace(/"/g, '') || 'Unknown'}</span>
                              {showBadge && (
                                <span className="ml-1 flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold font-coke">
                                  <TrendingUp className="w-3 h-3" />
                                  {(() => {
                                    let displayValuation = getCustomCCValue(item);
                                    return displayValuation.toFixed(2);
                                  })()} CC
                                </span>
                              )}
                            </div>
                          ) : (
                            <span key={pid} className="text-gray-400 font-coke">Unknown Item</span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  {/* Expanded breakdown for merged trades */}
                  {isMerged && isExpanded && (
                    <div className="mt-4 border-t border-gray-200 pt-4">
                      <div className="font-coke text-xs text-gray-500 mb-2">Breakdown of {trade.mergedCount} grouped trades:</div>
                      <div className="space-y-4">
                        {subTrades.map(sub => (
                          <div key={sub.tradeId} className="bg-white/80 rounded-xl p-3 border border-gray-200">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-coke font-bold text-red-700">Trade #{sub.tradeId}</span>
                              <span className="text-gray-500 font-coke text-xs">{new Date(sub.tradeDate).toLocaleString()}</span>
                            </div>
                            <div className="flex flex-col md:flex-row gap-4">
                              <div className="flex-1">
                                <div className="font-coke text-xs text-gray-600 mb-1">Trader gave:</div>
                                <div className="flex flex-wrap gap-2">
                                  {sub.traderItemIds.length === 0 && <span className="text-gray-400 font-coke">Nothing</span>}
                                  {sub.traderItemIds.map(pid => {
                                    const item = getItemDetailsByPossessionId(pid);
                                    const valuation = item ? valuations.get(item.prodId) : undefined;
                                    const showBadge = item && shouldShowCCBadge(item, valuation);
                                    return item ? (
                                      <div key={`${sub.tradeId}-${pid}`} className="flex items-center gap-2 bg-white/60 rounded-lg px-2 py-1 border border-white/30">
                                        {item.imageBase && (
                                          <img src={getImageUrl(item.imageBase)} alt={item.name} className="w-6 h-6 object-contain" />
                                        )}
                                        <span className="font-coke text-xs">{item.name?.replace(/"/g, '') || 'Unknown'}</span>
                                        {showBadge && (
                                          <span className="ml-1 flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold font-coke">
                                            <TrendingUp className="w-3 h-3" />
                                            {(() => {
                                              let displayValuation = getCustomCCValue(item);
                                              return displayValuation.toFixed(2);
                                            })()} CC
                                          </span>
                                        )}
                                      </div>
                                    ) : (
                                      <span key={pid} className="text-gray-400 font-coke">Unknown Item</span>
                                    );
                                  })}
                                </div>
                              </div>
                              <div className="flex-1">
                                <div className="font-coke text-xs text-gray-600 mb-1">Tradee gave:</div>
                                <div className="flex flex-wrap gap-2">
                                  {sub.tradeeItemIds.length === 0 && <span className="text-gray-400 font-coke">Nothing</span>}
                                  {sub.tradeeItemIds.map(pid => {
                                    const item = getItemDetailsByPossessionId(pid);
                                    const valuation = item ? valuations.get(item.prodId) : undefined;
                                    const showBadge = item && shouldShowCCBadge(item, valuation);
                                    return item ? (
                                      <div key={`${sub.tradeId}-${pid}`} className="flex items-center gap-2 bg-white/60 rounded-lg px-2 py-1 border border-white/30">
                                        {item.imageBase && (
                                          <img src={getImageUrl(item.imageBase)} alt={item.name} className="w-6 h-6 object-contain" />
                                        )}
                                        <span className="font-coke text-xs">{item.name?.replace(/"/g, '') || 'Unknown'}</span>
                                        {showBadge && (
                                          <span className="ml-1 flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold font-coke">
                                            <TrendingUp className="w-3 h-3" />
                                            {(() => {
                                              let displayValuation = getCustomCCValue(item);
                                              return displayValuation.toFixed(2);
                                            })()} CC
                                          </span>
                                        )}
                                      </div>
                                    ) : (
                                      <span key={pid} className="text-gray-400 font-coke">Unknown Item</span>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-600 via-red-700 to-red-800">
            {/* Enhanced Responsive Header with Coca-Cola Wave Effect - Always Sticky */}
      <div className="sticky top-0 z-50 bg-white shadow-2xl backdrop-blur-xl coke-wave">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between py-3">
            {/* Logo and Title */}
            <div className="flex items-center gap-3 transform scale-90">
              <div className="bg-red-600 p-2 rounded-full shadow-lg">
                <Music className="w-6 h-6 text-white" />
              </div>
              <h1 className="font-bold font-coke text-xl text-red-700 hidden sm:block">
                Decibel.fun
              </h1>
            </div>
            
            {/* Enhanced Tabs */}
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('catalog')}
                className={`font-semibold font-coke transition-all duration-300 shadow-lg backdrop-blur-sm transform hover:scale-105 active:scale-95 px-4 py-2 rounded-lg text-sm ${
                  activeTab === 'catalog'
                    ? 'bg-red-600 text-white shadow-xl border-2 border-red-500'
                    : 'bg-white/80 text-red-700 border-2 border-red-200 hover:bg-red-50 hover:border-red-300'
                }`}
              >
                <Package className="inline w-4 h-4 mr-1" />
                Catalog
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`font-semibold font-coke transition-all duration-300 shadow-lg backdrop-blur-sm transform hover:scale-105 active:scale-95 px-4 py-2 rounded-lg text-sm ${
                  activeTab === 'analytics'
                    ? 'bg-red-600 text-white shadow-xl border-2 border-red-500'
                    : 'bg-white/80 text-red-700 border-2 border-red-200 hover:bg-red-50 hover:border-red-300'
                }`}
              >
                <BarChart3 className="inline w-4 h-4 mr-1" />
                Analytics
              </button>
              <button
                onClick={() => setActiveTab('trades')}
                className={`font-semibold font-coke transition-all duration-300 shadow-lg backdrop-blur-sm transform hover:scale-105 active:scale-95 px-4 py-2 rounded-lg text-sm ${
                  activeTab === 'trades'
                    ? 'bg-red-600 text-white shadow-xl border-2 border-red-500'
                    : 'bg-white/80 text-red-700 border-2 border-red-200 hover:bg-red-50 hover:border-red-300'
                }`}
              >
                <DollarSign className="inline w-4 h-4 mr-1" />
                Trades
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-4">
        <div className="fade-in">
          {activeTab === 'catalog' ? renderCatalogTab() : activeTab === 'analytics' ? renderAnalyticsTab() : renderTradesTab()}
        </div>
      </div>
    </div>
  );
};

export default CokeStudiosCatalog;