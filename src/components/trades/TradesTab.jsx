import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Loader2, Search, SortAsc, SortDesc, Filter, Package, TrendingUp, X } from 'lucide-react';
import { getImageUrl, shouldShowCCBadge, getCustomCCValue } from '../../utils/helpers';

const TradesTab = ({
  trades,
  tradesLoading,
  tradesError,
  catalogData,
  possessionData,
  valuations,
  getItemDetailsByPossessionId,
  isTradeValid,
}) => {
  const [tradesSearchTerm, setTradesSearchTerm] = useState('');
  const [tradesSelectedCategories, setTradesSelectedCategories] = useState(['all']);
  const [tradesSortBy, setTradesSortBy] = useState('date');
  const [tradesSortOrder, setTradesSortOrder] = useState('desc');
  const [tradesShowFilters, setTradesShowFilters] = useState(false);
  const [expandedTradeIds, setExpandedTradeIds] = useState(new Set());
  const [collapsingTradeIds, setCollapsingTradeIds] = useState(new Set());
  const [isTradesSearching, setIsTradesSearching] = useState(false);

  // Track when animations should be enabled (not during search typing)
  useEffect(() => {
    if (tradesSearchTerm) {
      setIsTradesSearching(true);
    } else {
      // Small delay to allow animations on filter changes when search is cleared
      const timer = setTimeout(() => setIsTradesSearching(false), 50);
      return () => clearTimeout(timer);
    }
  }, [tradesSearchTerm]);

  // Enable animations on non-search filter changes
  useEffect(() => {
    setIsTradesSearching(false);
    
    // Remove reorder classes after animations complete to restore hover effects
    const timer = setTimeout(() => {
      document.querySelectorAll('.trade-reorder').forEach(element => {
        element.classList.remove('trade-reorder');
      });
    }, 1800); // After staggered animations complete (trades take longer)
    
    return () => clearTimeout(timer);
  }, [tradesSelectedCategories, tradesSortBy, tradesSortOrder]);

  // Also remove reorder classes on initial page load
  useEffect(() => {
    const timer = setTimeout(() => {
      document.querySelectorAll('.trade-reorder').forEach(element => {
        element.classList.remove('trade-reorder');
      });
    }, 1800);
    
    return () => clearTimeout(timer);
  }, []); // Run once on mount

  const getTradeItems = (trade) => {
    const traderItems = (trade.traderItemIds || []).map(getItemDetailsByPossessionId).filter(Boolean);
    const tradeeItems = (trade.tradeeItemIds || []).map(getItemDetailsByPossessionId).filter(Boolean);
    return [...traderItems, ...tradeeItems];
  };
  
  const getTradeCCSum = (possessionIds) => {
    return (possessionIds || [])
      .map(pid => getItemDetailsByPossessionId(pid))
      .filter(item => {
        const valuation = item ? valuations.get(item.prodId) : undefined;
        return item && shouldShowCCBadge(item, valuation);
      })
      .reduce((sum, item) => sum + getCustomCCValue(item, valuations), 0);
  };

  const getUniqueTradeCategories = () => {
    const categories = new Set(['all']);
    trades.forEach(trade => {
      getTradeItems(trade).forEach(item => {
        if (item.catName) categories.add(item.catName);
      });
    });
    return Array.from(categories).sort();
  };

  const doesTradeMatchFilters = (trade) => {
    const items = getTradeItems(trade);
    const matchesSearch = tradesSearchTerm.trim() === '' || items.some(item =>
      (item.name?.toLowerCase().includes(tradesSearchTerm.toLowerCase()) ||
       item.catName?.toLowerCase().includes(tradesSearchTerm.toLowerCase()) ||
       item.catDesc?.toLowerCase().includes(tradesSearchTerm.toLowerCase()))
    );
    const matchesCategory = tradesSelectedCategories.includes('all') ||
      items.some(item => tradesSelectedCategories.includes(item.catName));
    return matchesSearch && matchesCategory;
  };

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

  const clearAllTradesFilters = () => {
    setTradesSearchTerm('');
    setTradesSelectedCategories(['all']);
    setTradesSortBy('date');
    setTradesSortOrder('desc');
    setTradesShowFilters(false);
  };

  const hasActiveTradesFilters = () => {
    return tradesSearchTerm ||
      !tradesSelectedCategories.includes('all') ||
      tradesSortBy !== 'date' ||
      tradesSortOrder !== 'desc';
  };

  const toggleTradeExpand = (tradeId) => {
    if (expandedTradeIds.has(tradeId)) {
      // Start collapse animation
      setCollapsingTradeIds(prev => new Set(prev).add(tradeId));
      
      // After animation completes, remove from expanded
      setTimeout(() => {
        setExpandedTradeIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(tradeId);
          return newSet;
        });
        setCollapsingTradeIds(prev => {
          const newCollapsing = new Set(prev);
          newCollapsing.delete(tradeId);
          return newCollapsing;
        });
      }, 500); // Slightly longer than collapse animation for smoother removal
    } else {
      // Expand immediately
      setExpandedTradeIds(prev => new Set(prev).add(tradeId));
      
      // Scroll to top of the expanded trade card after a brief delay
      setTimeout(() => {
        const cardElement = document.querySelector(`[data-trade-id="${tradeId}"]`);
        if (cardElement) {
          // Custom smooth scroll for better control
          const targetPosition = cardElement.offsetTop - 30; // 30px offset from top for trade cards
          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });
        }
      }, 200); // Slightly longer delay for smoother coordination
    }
  };
  
  const validTrades = trades.filter(isTradeValid);

  const getTradePairKey = (trade) => {
    const ids = [trade.traderPublicId, trade.tradeePublicId].sort();
    return ids.join('::');
  };

  const sortedByDate = [...validTrades].sort((a, b) => new Date(a.tradeDate) - new Date(b.tradeDate));

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
    if (group.length === 1) {
      mergedTrades.push(baseTrade);
    } else {
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

  const filteredTrades = mergedTrades.filter(doesTradeMatchFilters);
  const sortedTrades = [...filteredTrades].sort(sortTrades);

  return (
    <div className="space-y-4">
      <div className="fade-in">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70 w-5 h-5 search-icon-hover" />
                <input
                  type="text"
                  placeholder="Search items, categories, descriptions..."
                  value={tradesSearchTerm}
                  onChange={(e) => setTradesSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-white/30 bg-white/20 backdrop-blur-lg text-white placeholder-white/70 focus:outline-none focus:border-white/60 focus:bg-white/25 font-coke transition-all duration-300 shadow-lg hover:shadow-xl focus:shadow-glow input-focus-glow"
                />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-red-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </div>
            </div>
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
                className="px-4 py-3 rounded-xl border-2 border-white/30 bg-white/20 backdrop-blur-lg text-white hover:bg-white/25 focus:outline-none focus:border-white/60 font-coke transition-all duration-300 shadow-lg hover:shadow-xl focus:shadow-glow button-press"
              >
                {tradesSortOrder === 'asc' ? <SortAsc className="w-5 h-5 icon-hover" /> : <SortDesc className="w-5 h-5 icon-hover" />}
              </button>
            </div>
            <button
              onClick={() => setTradesShowFilters(!tradesShowFilters)}
              className={`px-4 py-3 rounded-xl border-2 backdrop-blur-lg font-coke transition-all duration-300 shadow-lg hover:shadow-xl focus:shadow-glow flex items-center gap-2 button-press ${
                tradesShowFilters || hasActiveTradesFilters()
                  ? 'border-red-400 bg-red-500/30 text-white'
                  : 'border-white/30 bg-white/20 text-white hover:bg-white/25 focus:border-white/60'
              }`}
            >
              <Filter className="w-5 h-5 icon-hover" />
              Filters
              {hasActiveTradesFilters() && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full filter-count-pop badge-hover">
                  {[
                    tradesSearchTerm && 1,
                    !tradesSelectedCategories.includes('all') && tradesSelectedCategories.length
                  ].filter(Boolean).reduce((a, b) => a + b, 0)}
                </span>
              )}
            </button>
          </div>
          {tradesShowFilters && (
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20 animate-slide-in-down">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
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
                              const newCategories = tradesSelectedCategories.filter(c => c !== category);
                              setTradesSelectedCategories(newCategories.length === 0 ? ['all'] : newCategories);
                            }
                          }}
                          className="rounded border-white/30 bg-white/20"
                        />
                        <span className="font-coke text-sm">{category === 'all' ? 'All Categories' : category.replace(/"/g, '')}</span>
                      </label>
                    ))}
                  </div>
                </div>
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
      </div>

      {/* Enhanced Stats */}
      <div className="fade-in fade-in-delay-1">
        <div className="flex flex-wrap gap-2 text-white/90">
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-lg px-4 py-2 rounded-full border border-white/20 hover:bg-white/15 transition-all duration-300 transform hover:scale-105 badge-hover">
            <Package className="w-5 h-5 icon-hover" />
            <span className="font-coke text-sm font-semibold">{sortedTrades.length} trades</span>
          </div>
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-lg px-4 py-2 rounded-full border border-white/20 hover:bg-white/15 transition-all duration-300 transform hover:scale-105 badge-hover">
            <TrendingUp className="w-5 h-5 icon-hover" />
            <span className="font-coke text-sm font-semibold">
              {sortedTrades.reduce((total, trade) => {
                return total + (trade.traderItemIds?.length || 0) + (trade.tradeeItemIds?.length || 0);
              }, 0)} items traded
            </span>
          </div>
          {hasActiveTradesFilters() && (
            <div className="flex items-center gap-2 bg-red-500/20 backdrop-blur-lg px-4 py-2 rounded-full border border-red-400/30 hover:bg-red-500/30 transition-all duration-300 transform hover:scale-105 badge-hover">
              <Filter className="w-5 h-5 text-red-300 icon-hover" />
              <span className="font-coke text-sm font-semibold text-red-200">Filters Active</span>
            </div>
          )}
        </div>
      </div>

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
        <div className="grid grid-cols-1 gap-4 fade-in fade-in-delay-2">
          {sortedTrades.map(trade => {
            const traderTotal = getTradeCCSum(trade.traderItemIds);
            const tradeeTotal = getTradeCCSum(trade.tradeeItemIds);
            const traderBadgeColor = 'bg-purple-100 text-purple-700';
            const tradeeBadgeColor = 'bg-purple-100 text-purple-700';
            const isMerged = trade.mergedCount && trade.mergedCount > 1;
            const isExpanded = expandedTradeIds.has(trade.tradeId);
            let subTrades = [];
            if (isMerged) {
              const tradeIds = trade.tradeId.split(',').map(id => id.trim());
              subTrades = validTrades.filter(t => tradeIds.includes(String(t.tradeId)));
            }
            return (
              <div
                key={trade.tradeId}
                data-trade-id={trade.tradeId}
                className={`bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-white/20 trade-card-hover ${!isTradesSearching && sortedTrades.indexOf(trade) < 6 ? 'trade-reorder' : ''} ${isMerged ? 'cursor-pointer' : ''}`}
                style={{ animationDelay: sortedTrades.indexOf(trade) < 6 ? `${sortedTrades.indexOf(trade) * 0.06}s` : '0s' }}
                onClick={isMerged ? () => toggleTradeExpand(trade.tradeId) : undefined}
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-coke font-bold text-lg text-red-700 flex items-center">
                      {isMerged && (
                        <span className="mr-2">
                          {isExpanded ? <ChevronDown className="inline w-5 h-5 text-red-700 chevron-rotate" /> : <ChevronRight className="inline w-5 h-5 text-red-700 chevron-rotate" />}
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
                      <span className={`font-coke text-base font-bold rounded-full px-3 py-1 ml-2 flex items-center gap-2 shadow-lg cc-badge-glow ${traderBadgeColor}`}>
                        <TrendingUp className="w-3 h-3 icon-hover" />
                        {traderTotal.toFixed(2)} CC
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {trade.traderItemIds.length === 0 && <span className="text-gray-400 font-coke">Nothing</span>}
                      {trade.traderItemIds.map(pid => {
                        const item = getItemDetailsByPossessionId(pid);
                        const valuation = item ? valuations.get(item.prodId) : undefined;
                        const showBadge = item && shouldShowCCBadge(item, valuation);
                        return item ? (
                          <div key={`${trade.tradeId}-${pid}`} className="flex items-center gap-2 bg-white/40 rounded-lg px-3 py-1 shadow border border-white/30">
                            {item.imageBase && (
                              <img src={getImageUrl(item.imageBase)} alt={item.name} className="w-8 h-8 object-contain image-hover" />
                            )}
                            <span className="font-coke text-sm">{item.name?.replace(/"/g, '') || 'Unknown'}</span>
                            {showBadge && (
                              <span className="ml-1 flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold font-coke">
                                <TrendingUp className="w-3 h-3" />
                                {(() => {
                                  let displayValuation = getCustomCCValue(item, valuations);
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
                      <span className={`font-coke text-base font-bold rounded-full px-3 py-1 ml-2 flex items-center gap-2 shadow-lg cc-badge-glow ${tradeeBadgeColor}`}>
                        <TrendingUp className="w-3 h-3 icon-hover" />
                        {tradeeTotal.toFixed(2)} CC
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {trade.tradeeItemIds.length === 0 && <span className="text-gray-400 font-coke">Nothing</span>}
                      {trade.tradeeItemIds.map(pid => {
                        const item = getItemDetailsByPossessionId(pid);
                        const valuation = item ? valuations.get(item.prodId) : undefined;
                        const showBadge = item && shouldShowCCBadge(item, valuation);
                        return item ? (
                          <div key={`${trade.tradeId}-${pid}`} className="flex items-center gap-2 bg-white/40 rounded-lg px-3 py-1 shadow border border-white/30">
                            {item.imageBase && (
                              <img src={getImageUrl(item.imageBase)} alt={item.name} className="w-8 h-8 object-contain image-hover" />
                            )}
                            <span className="font-coke text-sm">{item.name?.replace(/"/g, '') || 'Unknown'}</span>
                            {showBadge && (
                              <span className="ml-1 flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold font-coke">
                                <TrendingUp className="w-3 h-3" />
                                {(() => {
                                  let displayValuation = getCustomCCValue(item, valuations);
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
                {isMerged && (isExpanded || collapsingTradeIds.has(trade.tradeId)) && (
                  <div className={`mt-4 border-t border-gray-200 pt-4 expand-container ${
                    collapsingTradeIds.has(trade.tradeId) ? 'animate-collapse-up' : 'animate-expand-down'
                  }`}>
                    <div className="font-coke text-xs text-gray-500 mb-2">Breakdown of {trade.mergedCount} grouped trades:</div>
                    <div className="space-y-4">
                      {subTrades.map((sub, subIndex) => (
                        <div key={sub.tradeId} className={`bg-white/80 rounded-xl p-3 border border-gray-200 ${!isTradesSearching && subIndex < 4 ? 'item-reorder' : ''}`} style={{ animationDelay: subIndex < 4 ? `${subIndex * 0.08}s` : '0s' }}>
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
                                            let displayValuation = getCustomCCValue(item, valuations);
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
                                            let displayValuation = getCustomCCValue(item, valuations);
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

export default TradesTab; 