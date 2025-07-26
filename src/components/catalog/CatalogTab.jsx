import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Package, Calendar, Filter, TrendingUp, Info } from 'lucide-react';
import FilterControls from '../common/FilterControls';
import ValuationModal from '../common/ValuationModal';
import { getImageUrl, shouldShowCCBadge, getCustomCCValue } from '../../utils/helpers';

const CatalogTab = ({
  catalogData,
  possessionData,
  trades,
  valuations,
  getItemPossessions,
  getItemPrice,
  getItemPurchaseDate,
}) => {
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [collapsingItems, setCollapsingItems] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState(['all']);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showFilters, setShowFilters] = useState(false);
  const [showUnownedItems, setShowUnownedItems] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [showValuationModal, setShowValuationModal] = useState(false);

  const openValuationModal = () => setShowValuationModal(true);
  const closeValuationModal = () => setShowValuationModal(false);

  // Track when animations should be enabled (not during search typing)
  useEffect(() => {
    if (searchTerm) {
      setIsSearching(true);
    } else {
      // Small delay to allow animations on filter changes when search is cleared
      const timer = setTimeout(() => setIsSearching(false), 50);
      return () => clearTimeout(timer);
    }
  }, [searchTerm]);

  // Enable animations on non-search filter changes
  useEffect(() => {
    setIsSearching(false);
    
    // Remove reorder classes after animations complete to restore hover effects
    const timer = setTimeout(() => {
      document.querySelectorAll('.trade-reorder').forEach(element => {
        element.classList.remove('trade-reorder');
      });
    }, 1800); // After staggered animations complete (trades timing)
    
    return () => clearTimeout(timer);
  }, [selectedCategories, sortBy, sortOrder, priceRange, dateRange, showUnownedItems]);

  // Also remove reorder classes on initial page load
  useEffect(() => {
    const timer = setTimeout(() => {
      document.querySelectorAll('.trade-reorder').forEach(element => {
        element.classList.remove('trade-reorder');
      });
    }, 1800);
    
    return () => clearTimeout(timer);
  }, []); // Run once on mount

  const toggleExpanded = (prodId) => {
    if (expandedItems.has(prodId)) {
      // Start collapse animation
      setCollapsingItems(prev => new Set(prev).add(prodId));
      
      // After animation completes, remove from expanded
      setTimeout(() => {
        setExpandedItems(prev => {
          const newExpanded = new Set(prev);
          newExpanded.delete(prodId);
          return newExpanded;
        });
        setCollapsingItems(prev => {
          const newCollapsing = new Set(prev);
          newCollapsing.delete(prodId);
          return newCollapsing;
        });
      }, 500); // Slightly longer than collapse animation for smoother removal
    } else {
      // Expand immediately
      setExpandedItems(prev => new Set(prev).add(prodId));
      
      // Scroll to top of the expanded card after a brief delay
      setTimeout(() => {
        const cardElement = document.querySelector(`[data-item-id="${prodId}"]`);
        if (cardElement) {
          // Custom smooth scroll for better control
          const targetPosition = cardElement.offsetTop - 20; // 20px offset from top
          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });
        }
      }, 200); // Slightly longer delay for smoother coordination
    }
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
    // Show unowned items filter
    if (!showUnownedItems && getItemPossessions(item.prodId).length === 0) return false;
    return true;
  });

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

  return (
    <div className="space-y-4">
      <FilterControls
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        hasActiveFilters={hasActiveFilters}
        clearAllFilters={clearAllFilters}
        priceRange={priceRange}
        setPriceRange={setPriceRange}
        dateRange={dateRange}
        setDateRange={setDateRange}
        selectedCategories={selectedCategories}
        setSelectedCategories={setSelectedCategories}
        getUniqueCategories={getUniqueCategories}
        showUnownedItems={showUnownedItems}
        setShowUnownedItems={setShowUnownedItems}
      />
      
      {/* Enhanced Stats */}
      <div className="fade-in fade-in-delay-1">
        <div className="flex flex-wrap gap-2 text-white/90">
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-lg px-4 py-2 rounded-full border border-white/20 hover:bg-white/15 transition-all duration-300 transform hover:scale-105 badge-hover">
            <Package className="w-5 h-5 icon-hover" />
            <span className="font-coke text-sm font-semibold">{sortedItems.length} items</span>
          </div>
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-lg px-4 py-2 rounded-full border border-white/20 hover:bg-white/15 transition-all duration-300 transform hover:scale-105 badge-hover">
            <Calendar className="w-5 h-5 icon-hover" />
            <span className="font-coke text-sm font-semibold">{filteredPossessionsCount} possessions</span>
          </div>
          {hasActiveFilters() && (
            <div className="flex items-center gap-2 bg-red-500/20 backdrop-blur-lg px-4 py-2 rounded-full border border-red-400/30 hover:bg-red-500/30 transition-all duration-300 transform hover:scale-105 badge-hover">
              <Filter className="w-5 h-5 text-red-300 icon-hover" />
              <span className="font-coke text-sm font-semibold text-red-200">Filters Active</span>
            </div>
          )}
        </div>
      </div>

      {/* Valuation Disclaimer */}
      <div className="fade-in fade-in-delay-1">
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
          <div className="flex items-center gap-3">
            <Info className="w-5 h-5 text-white/70 flex-shrink-0" />
            <p className="font-coke text-sm text-white/90">
              <strong>Note:</strong> Item valuations are estimates only. 
              <button 
                onClick={openValuationModal}
                className="text-white underline hover:text-red-200 transition-colors duration-200 ml-1"
              >
                Interested in how values are calculated?
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* Enhanced Items List */}
      <div className="space-y-2 fade-in fade-in-delay-2">
        {sortedItems.map((item, index) => {
          const possessions = getItemPossessions(item.prodId);
          const isExpanded = expandedItems.has(item.prodId);
          const imageUrl = getImageUrl(item.imageBase);
          const valuation = valuations.get(item.prodId);
          const showCC = shouldShowCCBadge(item, valuation);
          const displayValuation = getCustomCCValue(item, valuations);

          return (
            <div 
              key={item.prodId} 
              data-item-id={item.prodId}
              className={`bg-white/95 backdrop-blur-lg rounded-xl shadow-lg overflow-hidden card-hover border border-white/20 group ${!isSearching && index < 12 ? 'trade-reorder' : ''}`}
              style={{ animationDelay: index < 12 ? `${index * 0.06}s` : '0s' }}
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
                          className="w-12 h-12 object-contain transition-transform duration-300 group-hover:scale-110 image-hover"
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
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-semibold font-coke transition-all duration-300 group-hover:bg-red-200 group-hover:scale-105 badge-hover">
                            ID: {item.prodId}
                          </span>
                          {possessions.length > 0 && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-semibold font-coke transition-all duration-300 group-hover:bg-green-200 group-hover:scale-105 badge-hover">
                              {possessions.length} owned
                            </span>
                          )}
                          {showCC && (
                            <span className="flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold font-coke transition-all duration-300 group-hover:bg-purple-200 group-hover:scale-105 cc-badge-glow">
                              <TrendingUp className="w-3 h-3 icon-hover" />
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
                          <ChevronDown className="w-5 h-5 text-red-700 chevron-rotate" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-red-700 chevron-rotate" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {(isExpanded || collapsingItems.has(item.prodId)) && (
                <div className={`border-t border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100/50 expand-container ${
                  collapsingItems.has(item.prodId) ? 'animate-collapse-up' : 'animate-expand-down'
                }`}>
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
                                  className={`border-b border-gray-100 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50/30 transition-all duration-300 transform hover:scale-[1.01] fade-in ${!isSearching && possessionIndex < 4 ? 'trade-reorder' : ''}`}
                                  style={{ animationDelay: possessionIndex < 4 ? `${possessionIndex * 0.08}s` : '0s' }}
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

      {/* Valuation Modal */}
      <ValuationModal 
        showModal={showValuationModal} 
        closeModal={closeValuationModal}
        catalogData={catalogData}
        possessionData={possessionData}
        trades={trades}
        valuations={valuations}
      />
    </div>
  );
};

export default CatalogTab; 