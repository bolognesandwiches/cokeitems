import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { ChevronDown, ChevronRight, Loader2, Search, SortAsc, SortDesc, Filter, Package, TrendingUp, X, User, Calendar, Hash, Info } from 'lucide-react';
import ValuationModal from '../common/ValuationModal';
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
  
  // Trader Focus Modal State
  const [showTraderModal, setShowTraderModal] = useState(false);
  const [selectedTraderUID, setSelectedTraderUID] = useState(null);
  
  // Valuation Modal State
  const [showValuationModal, setShowValuationModal] = useState(false);

  const openTraderModal = (traderUID) => {
    console.log('Opening trader modal for:', traderUID);
    setSelectedTraderUID(traderUID);
    setShowTraderModal(true);
  };

  const closeTraderModal = () => {
    console.log('Closing trader modal');
    setShowTraderModal(false);
    setSelectedTraderUID(null);
  };

  const openValuationModal = () => setShowValuationModal(true);
  const closeValuationModal = () => setShowValuationModal(false);

  // Add escape key handler for modal
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape' && showTraderModal) {
        closeTraderModal();
      }
    };

    if (showTraderModal) {
      document.addEventListener('keydown', handleEscapeKey);
      // Prevent background scrolling when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'unset';
    };
  }, [showTraderModal]);

  // Trader Analytics Functions
  const getTraderHistory = (traderUID) => {
    if (!traderUID || !trades) return [];
    
    try {
      const validTrades = trades.filter(isTradeValid);
      const traderTrades = validTrades.filter(trade => 
        trade.traderPublicId === traderUID || trade.tradeePublicId === traderUID
      );

      return traderTrades
        .sort((a, b) => new Date(b.tradeDate) - new Date(a.tradeDate)) // Newest first
        .map(trade => {
          const isTrader = trade.traderPublicId === traderUID;
          const role = isTrader ? 'Trader' : 'Tradee';
          const itemsGiven = isTrader ? trade.traderItemIds : trade.tradeeItemIds;
          const itemsReceived = isTrader ? trade.tradeeItemIds : trade.traderItemIds;
          
          return {
            ...trade,
            role,
            itemsGiven: (itemsGiven || []).map(id => {
              try {
                return getItemDetailsByPossessionId(id);
              } catch (e) {
                console.warn('Error getting item details for ID:', id, e);
                return null;
              }
            }).filter(Boolean),
            itemsReceived: (itemsReceived || []).map(id => {
              try {
                return getItemDetailsByPossessionId(id);
              } catch (e) {
                console.warn('Error getting item details for ID:', id, e);
                return null;
              }
            }).filter(Boolean)
          };
        });
    } catch (error) {
      console.error('Error in getTraderHistory:', error);
      return [];
    }
  };

  const getTraderStats = (traderUID) => {
    try {
      const history = getTraderHistory(traderUID);
      const totalTrades = history.length;
      const totalItemsTraded = history.reduce((sum, trade) => 
        sum + trade.itemsGiven.length + trade.itemsReceived.length, 0
      );
      
      const uniqueItems = new Set();
      history.forEach(trade => {
        trade.itemsGiven.forEach(item => uniqueItems.add(item.prodId));
        trade.itemsReceived.forEach(item => uniqueItems.add(item.prodId));
      });

      let totalValue = 0;
      if (valuations) {
        totalValue = history.reduce((sum, trade) => {
          const givenValue = trade.itemsGiven
            .filter(item => {
              try {
                const valuation = valuations.get(item.prodId);
                return shouldShowCCBadge(item, valuation);
              } catch (e) {
                return false;
              }
            })
            .reduce((itemSum, item) => {
              try {
                return itemSum + getCustomCCValue(item, valuations);
              } catch (e) {
                return itemSum;
              }
            }, 0);
          
          const receivedValue = trade.itemsReceived
            .filter(item => {
              try {
                const valuation = valuations.get(item.prodId);
                return shouldShowCCBadge(item, valuation);
              } catch (e) {
                return false;
              }
            })
            .reduce((itemSum, item) => {
              try {
                return itemSum + getCustomCCValue(item, valuations);
              } catch (e) {
                return itemSum;
              }
            }, 0);
          
          return sum + givenValue + receivedValue;
        }, 0);
      }

      return {
        totalTrades,
        totalItemsTraded,
        uniqueItemsTraded: uniqueItems.size,
        totalValue,
        firstTradeDate: history.length > 0 ? history[history.length - 1].tradeDate : null,
        lastTradeDate: history.length > 0 ? history[0].tradeDate : null
      };
    } catch (error) {
      console.error('Error in getTraderStats:', error);
      return {
        totalTrades: 0,
        totalItemsTraded: 0,
        uniqueItemsTraded: 0,
        totalValue: 0,
        firstTradeDate: null,
        lastTradeDate: null
      };
    }
  };

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
          {sortedTrades.map((trade, tradeIndex) => {
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
            
            // Generate unique key to prevent React key conflicts
            const uniqueKey = `trade-${tradeIndex}-${trade.tradeId}`;
            
            return (
              <div
                key={uniqueKey}
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
                      <div className="flex flex-col">
                        <span>Trader gave:</span>
                        <button 
                          className="text-xs text-blue-600 font-mono hover:text-blue-800 hover:underline cursor-pointer text-left transition-colors duration-200"
                          onClick={(e) => {
                            e.stopPropagation();
                            openTraderModal(trade.traderPublicId);
                          }}
                        >
                          {trade.traderPublicId}
                        </button>
                      </div>
                      <span className={`font-coke text-base font-bold rounded-full px-3 py-1 ml-2 flex items-center gap-2 shadow-lg cc-badge-glow ${traderBadgeColor}`}>
                        <TrendingUp className="w-3 h-3 icon-hover" />
                        {traderTotal.toFixed(2)} CC
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {trade.traderItemIds.length === 0 && <span className="text-gray-400 font-coke">Nothing</span>}
                      {trade.traderItemIds.map((pid, itemIndex) => {
                        const item = getItemDetailsByPossessionId(pid);
                        const valuation = item ? valuations.get(item.prodId) : undefined;
                        const showBadge = item && shouldShowCCBadge(item, valuation);
                        return item ? (
                          <div key={`${uniqueKey}-trader-${pid}-${itemIndex}`} className="flex items-center gap-2 bg-white/40 rounded-lg px-3 py-1 shadow border border-white/30">
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
                          <span key={`${uniqueKey}-trader-unknown-${pid}-${itemIndex}`} className="text-gray-400 font-coke">Unknown Item</span>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="font-coke text-sm text-gray-600 mb-1 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span>Tradee gave:</span>
                        <button 
                          className="text-xs text-blue-600 font-mono hover:text-blue-800 hover:underline cursor-pointer text-left transition-colors duration-200"
                          onClick={(e) => {
                            e.stopPropagation();
                            openTraderModal(trade.tradeePublicId);
                          }}
                        >
                          {trade.tradeePublicId}
                        </button>
                      </div>
                      <span className={`font-coke text-base font-bold rounded-full px-3 py-1 ml-2 flex items-center gap-2 shadow-lg cc-badge-glow ${tradeeBadgeColor}`}>
                        <TrendingUp className="w-3 h-3 icon-hover" />
                        {tradeeTotal.toFixed(2)} CC
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {trade.tradeeItemIds.length === 0 && <span className="text-gray-400 font-coke">Nothing</span>}
                      {trade.tradeeItemIds.map((pid, itemIndex) => {
                        const item = getItemDetailsByPossessionId(pid);
                        const valuation = item ? valuations.get(item.prodId) : undefined;
                        const showBadge = item && shouldShowCCBadge(item, valuation);
                        return item ? (
                          <div key={`${uniqueKey}-tradee-${pid}-${itemIndex}`} className="flex items-center gap-2 bg-white/40 rounded-lg px-3 py-1 shadow border border-white/30">
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
                          <span key={`${uniqueKey}-tradee-unknown-${pid}-${itemIndex}`} className="text-gray-400 font-coke">Unknown Item</span>
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
                      {subTrades.map((sub, subIndex) => {
                        // Generate unique key for sub-trades to prevent conflicts
                        const subUniqueKey = `sub-trade-${tradeIndex}-${sub.tradeId}-${subIndex}`;
                        return (
                          <div key={subUniqueKey} className={`bg-white/80 rounded-xl p-3 border border-gray-200 ${!isTradesSearching && subIndex < 4 ? 'item-reorder' : ''}`} style={{ animationDelay: subIndex < 4 ? `${subIndex * 0.08}s` : '0s' }}>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-coke font-bold text-red-700">Trade #{sub.tradeId}</span>
                              <span className="text-gray-500 font-coke text-xs">{new Date(sub.tradeDate).toLocaleString()}</span>
                            </div>
                            <div className="flex flex-col md:flex-row gap-4">
                              <div className="flex-1">
                                <div className="font-coke text-xs text-gray-600 mb-1">
                                  <div className="flex flex-col">
                                    <span>Trader gave:</span>
                                    <button 
                                      className="text-xs text-blue-600 font-mono hover:text-blue-800 hover:underline cursor-pointer text-left transition-colors duration-200"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openTraderModal(sub.traderPublicId);
                                      }}
                                    >
                                      {sub.traderPublicId}
                                    </button>
                                  </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {sub.traderItemIds.length === 0 && <span className="text-gray-400 font-coke">Nothing</span>}
                                  {sub.traderItemIds.map((pid, subItemIndex) => {
                                    const item = getItemDetailsByPossessionId(pid);
                                    const valuation = item ? valuations.get(item.prodId) : undefined;
                                    const showBadge = item && shouldShowCCBadge(item, valuation);
                                    return item ? (
                                      <div key={`${subUniqueKey}-trader-${pid}-${subItemIndex}`} className="flex items-center gap-2 bg-white/60 rounded-lg px-2 py-1 border border-white/30">
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
                                      <span key={`${subUniqueKey}-trader-unknown-${pid}-${subItemIndex}`} className="text-gray-400 font-coke">Unknown Item</span>
                                    );
                                  })}
                                </div>
                              </div>
                              <div className="flex-1">
                                <div className="font-coke text-xs text-gray-600 mb-1">
                                  <div className="flex flex-col">
                                    <span>Tradee gave:</span>
                                    <button 
                                      className="text-xs text-blue-600 font-mono hover:text-blue-800 hover:underline cursor-pointer text-left transition-colors duration-200"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openTraderModal(sub.tradeePublicId);
                                      }}
                                    >
                                      {sub.tradeePublicId}
                                    </button>
                                  </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {sub.tradeeItemIds.length === 0 && <span className="text-gray-400 font-coke">Nothing</span>}
                                  {sub.tradeeItemIds.map((pid, subItemIndex) => {
                                    const item = getItemDetailsByPossessionId(pid);
                                    const valuation = item ? valuations.get(item.prodId) : undefined;
                                    const showBadge = item && shouldShowCCBadge(item, valuation);
                                    return item ? (
                                      <div key={`${subUniqueKey}-tradee-${pid}-${subItemIndex}`} className="flex items-center gap-2 bg-white/60 rounded-lg px-2 py-1 border border-white/30">
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
                                      <span key={`${subUniqueKey}-tradee-unknown-${pid}-${subItemIndex}`} className="text-gray-400 font-coke">Unknown Item</span>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Trader Focus Modal - Using Portal to render at body level */}
      {showTraderModal && selectedTraderUID && ReactDOM.createPortal(
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 animate-fade-in-modal-backdrop"
          style={{ zIndex: 10000 }}
          onClick={closeTraderModal}
        >
          <div 
            className="bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 max-w-4xl w-full max-h-[90vh] overflow-hidden animate-slide-up-modal"
            style={{ zIndex: 10001 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/20">
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-3 rounded-xl">
                  <User className="w-6 h-6 text-blue-700" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent font-coke">
                    Trader Profile
                  </h2>
                  <p className="text-sm text-gray-600 font-mono">
                    {selectedTraderUID}
                  </p>
                </div>
              </div>
              <button
                onClick={closeTraderModal}
                className="p-2 rounded-xl hover:bg-white/50 transition-colors duration-200 font-coke"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
              {(() => {
                console.log('Rendering modal content for trader:', selectedTraderUID);
                console.log('Modal should be visible now with portal approach');
                
                try {
                  return (
                    <TraderModalContent 
                      selectedTraderUID={selectedTraderUID}
                      getTraderStats={getTraderStats}
                      getTraderHistory={getTraderHistory}
                      valuations={valuations}
                      getImageUrl={getImageUrl}
                      shouldShowCCBadge={shouldShowCCBadge}
                      getCustomCCValue={getCustomCCValue}
                    />
                  );
                } catch (error) {
                  console.error('Error rendering modal content:', error);
                  return (
                    <div className="p-6">
                      <div className="text-center py-8 text-red-500">
                        <p className="font-bold text-xl font-coke">Error loading trader data</p>
                        <p className="text-sm mt-2 font-coke">{error.message}</p>
                      </div>
                    </div>
                  );
                }
              })()}
            </div>
          </div>
        </div>,
        document.body
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

// Separate component for modal content to prevent rendering issues
const TraderModalContent = ({ 
  selectedTraderUID, 
  getTraderStats, 
  getTraderHistory,
  valuations,
  getImageUrl,
  shouldShowCCBadge,
  getCustomCCValue
}) => {
  console.log('TraderModalContent rendering for:', selectedTraderUID);
  
  const stats = getTraderStats(selectedTraderUID);
  const history = getTraderHistory(selectedTraderUID);
  
  console.log('Stats:', stats);
  console.log('History length:', history.length);

  return (
    <div className="p-6 space-y-6">
      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/50 backdrop-blur-lg rounded-xl p-4 border border-gray-200">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600 font-coke mb-1">Total Trades</p>
            <p className="text-2xl font-bold bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent font-coke">
              {stats.totalTrades}
            </p>
          </div>
        </div>
        <div className="bg-white/50 backdrop-blur-lg rounded-xl p-4 border border-gray-200">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600 font-coke mb-1">Items Traded</p>
            <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent font-coke">
              {stats.totalItemsTraded}
            </p>
          </div>
        </div>
        <div className="bg-white/50 backdrop-blur-lg rounded-xl p-4 border border-gray-200">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600 font-coke mb-1">Unique Items</p>
            <p className="text-2xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent font-coke">
              {stats.uniqueItemsTraded}
            </p>
          </div>
        </div>
        <div className="bg-white/50 backdrop-blur-lg rounded-xl p-4 border border-gray-200">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600 font-coke mb-1">Total Value</p>
            <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent font-coke">
              {stats.totalValue.toFixed(2)} <span className="text-sm">CC</span>
            </p>
          </div>
        </div>
      </div>

      {/* Trading History */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-gray-600" />
          <h3 className="text-xl font-bold text-gray-800 font-coke">Trading History</h3>
          <span className="text-sm text-gray-500 font-coke">({history.length} trades)</span>
        </div>

        {history.length > 0 ? (
          <div className="space-y-4">
            {history.map((trade, index) => (
              <div key={`${trade.tradeId}-${index}`} className="bg-white/40 backdrop-blur-lg rounded-xl p-4 border border-gray-200">
                {/* Trade Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Hash className="w-4 h-4 text-gray-500" />
                      <span className="font-coke font-bold text-red-700">Trade #{trade.tradeId}</span>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold font-coke ${
                      trade.role === 'Trader' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {trade.role}
                    </span>
                  </div>
                  <span className="text-gray-500 font-coke text-sm">
                    {new Date(trade.tradeDate).toLocaleString()}
                  </span>
                </div>

                {/* Trade Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Items Given */}
                  <div>
                    <h4 className="font-coke text-sm font-semibold text-gray-700 mb-2">Items Given:</h4>
                    {trade.itemsGiven.length > 0 ? (
                      <div className="space-y-2">
                        {trade.itemsGiven.map((item, itemIndex) => {
                          const valuation = valuations ? valuations.get(item.prodId) : null;
                          const showBadge = item && valuation && shouldShowCCBadge(item, valuation);
                          return (
                            <div key={`given-${itemIndex}`} className="flex items-center gap-2 bg-white/60 rounded-lg px-3 py-2 border border-gray-200">
                              {item.imageBase && (
                                <img src={getImageUrl(item.imageBase)} alt={item.name} className="w-6 h-6 object-contain" />
                              )}
                              <div className="flex-1">
                                <span className="font-coke text-sm">{item.name?.replace(/"/g, '') || 'Unknown'}</span>
                                <span className="text-xs text-gray-500 ml-2">ID: {item.prodId}</span>
                              </div>
                              {showBadge && (
                                <span className="flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold font-coke">
                                  <TrendingUp className="w-3 h-3" />
                                  {getCustomCCValue(item, valuations).toFixed(2)} CC
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-gray-400 font-coke text-sm">Nothing given</p>
                    )}
                  </div>

                  {/* Items Received */}
                  <div>
                    <h4 className="font-coke text-sm font-semibold text-gray-700 mb-2">Items Received:</h4>
                    {trade.itemsReceived.length > 0 ? (
                      <div className="space-y-2">
                        {trade.itemsReceived.map((item, itemIndex) => {
                          const valuation = valuations ? valuations.get(item.prodId) : null;
                          const showBadge = item && valuation && shouldShowCCBadge(item, valuation);
                          return (
                            <div key={`received-${itemIndex}`} className="flex items-center gap-2 bg-white/60 rounded-lg px-3 py-2 border border-gray-200">
                              {item.imageBase && (
                                <img src={getImageUrl(item.imageBase)} alt={item.name} className="w-6 h-6 object-contain" />
                              )}
                              <div className="flex-1">
                                <span className="font-coke text-sm">{item.name?.replace(/"/g, '') || 'Unknown'}</span>
                                <span className="text-xs text-gray-500 ml-2">ID: {item.prodId}</span>
                              </div>
                              {showBadge && (
                                <span className="flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold font-coke">
                                  <TrendingUp className="w-3 h-3" />
                                  {getCustomCCValue(item, valuations).toFixed(2)} CC
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-gray-400 font-coke text-sm">Nothing received</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="font-coke">No trading history found for this trader.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TradesTab; 