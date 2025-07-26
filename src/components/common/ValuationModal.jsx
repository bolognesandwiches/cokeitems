import React from 'react';
import ReactDOM from 'react-dom';
import { X, TrendingUp, Calculator, BarChart3, Star, Zap, ChevronDown, ChevronUp } from 'lucide-react';

const ValuationModal = ({ showModal, closeModal, catalogData, possessionData, trades, valuations }) => {
  const [isAdjustmentsExpanded, setIsAdjustmentsExpanded] = React.useState(false);

  if (!showModal) return null;

  // Calculate real Gong example
  const calculateRealGongExample = () => {
    if (!catalogData?.length || !possessionData?.length || !trades) {
      return {
        cokeCouchCount: '?',
        gongCount: '?',
        scarcityRatio: '?',
        tradeFrequencyRatio: '?',
        finalValue: '?',
        hasData: false
      };
    }

    // Find Gong and Coke Couch in catalog
    const gongItem = catalogData.find(item => item.name === '"Gong"');
    const cokeCouchItem = catalogData.find(item => item.name === '"Coke Couch"');
    
    if (!gongItem || !cokeCouchItem) {
      return {
        cokeCouchCount: 'N/A',
        gongCount: 'N/A',
        scarcityRatio: 'N/A',
        tradeFrequencyRatio: 'N/A',
        finalValue: 'N/A',
        hasData: false
      };
    }

    // Calculate item counts
    const itemCounts = new Map();
    possessionData.forEach(p => {
      itemCounts.set(p.catalogItemId, (itemCounts.get(p.catalogItemId) || 0) + 1);
    });

    const cokeCouchCount = itemCounts.get(cokeCouchItem.prodId) || 0;
    const gongCount = itemCounts.get(gongItem.prodId) || 0;

    if (cokeCouchCount === 0 || gongCount === 0) {
      return {
        cokeCouchCount: cokeCouchCount || 'N/A',
        gongCount: gongCount || 'N/A',
        scarcityRatio: 'N/A',
        tradeFrequencyRatio: 'N/A',
        finalValue: 'N/A',
        hasData: false
      };
    }

    // Calculate trade frequencies
    const possessionIdToCatalogIdMap = new Map();
    possessionData.forEach(p => possessionIdToCatalogIdMap.set(p.id, p.catalogItemId));
    
    const validTrades = trades.filter(trade => 
      [...(trade.traderItemIds || []), ...(trade.tradeeItemIds || [])]
      .every(pid => possessionIdToCatalogIdMap.has(pid))
    );
    const totalValidTrades = validTrades.length;

    let gongTradeCount = 0;
    validTrades.forEach(trade => {
      const allItemIdsInTrade = new Set();
      const allPossessionIds = [...(trade.traderItemIds || []), ...(trade.tradeeItemIds || [])];
      
      allPossessionIds.forEach(pid => {
        const catalogId = possessionIdToCatalogIdMap.get(pid);
        if (catalogId) allItemIdsInTrade.add(catalogId);
      });
      
      if (allItemIdsInTrade.has(gongItem.prodId)) {
        gongTradeCount++;
      }
    });

    // Calculate final values
    const scarcityRatio = cokeCouchCount / gongCount;
    const tradeFrequencyRatio = totalValidTrades > 0 ? gongTradeCount / totalValidTrades : 0;
    const finalValue = scarcityRatio * (0.7 + (0.3 * tradeFrequencyRatio));

    return {
      cokeCouchCount,
      gongCount,
      scarcityRatio: scarcityRatio.toFixed(1),
      tradeFrequencyRatio: tradeFrequencyRatio.toFixed(3),
      finalValue: finalValue.toFixed(2),
      gongTradeCount,
      totalValidTrades,
      hasData: true
    };
  };

  const gongExample = calculateRealGongExample();

  // Special item adjustments data - flattened into single table
  const specialAdjustments = [
    { name: "Coca-Cola Pinball Machine", adjustment: "×30" },
    { name: "V-Ball Machine", adjustment: "×2" },
    { name: "Gold Record", adjustment: "÷3" },
    { name: "Platinum Record", adjustment: "÷3" },
    { name: "Cushion", adjustment: "÷3" },
    { name: "Robot Dog", adjustment: "÷3" },
    { name: "Victorian Chair", adjustment: "÷3" },
    { name: "Victorian Table", adjustment: "÷3" },
    { name: "Dryer", adjustment: "÷2" },
    { name: "Washer", adjustment: "÷2" },
    { name: "Gear Table", adjustment: "÷2" },
    { name: "Robot Sculpture", adjustment: "÷2" },
    { name: "Scrap Metal Carpet", adjustment: "÷2" },
    { name: "Tatami Mat", adjustment: "÷2" },
    { name: "Tire Chair", adjustment: "÷2" },
    { name: "Rice Paper Divider", adjustment: "÷2" },
    { name: "Recycling Bin", adjustment: "÷2" }
  ];

  return ReactDOM.createPortal(
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 animate-fade-in-modal-backdrop"
      style={{ zIndex: 10000 }}
      onClick={closeModal}
    >
      <div 
        className="bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 max-w-5xl w-full max-h-[90vh] overflow-hidden animate-slide-up-modal"
        style={{ zIndex: 10001 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-purple-100 to-purple-200 p-3 rounded-xl">
              <Calculator className="w-6 h-6 text-purple-700" />
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent font-coke">
                How Item Valuations Work
              </h2>
              <p className="text-sm text-gray-600 font-coke">
                Transparent pricing based on rarity and trading activity
              </p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="p-2 rounded-xl hover:bg-white/50 transition-colors duration-200 font-coke"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)] p-6 space-y-6">
          {/* Disclaimer - Moved to top */}
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm font-coke text-yellow-800">
                  <strong>Important:</strong> These valuations are estimates based on supply, demand, and community trading patterns. 
                  Actual trade values may vary based on personal preferences, negotiation, and market conditions.
                </p>
              </div>
            </div>
          </div>

          {/* Overview */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-6 h-6 text-blue-600" />
              <h3 className="text-xl font-bold text-gray-800 font-coke">Valuation System Overview</h3>
            </div>
            <p className="font-coke text-gray-700 leading-relaxed">
              Item values are calculated using a <strong>hybrid model</strong> that considers both how <strong>rare</strong> an item is 
              and how <strong>actively traded</strong> it is in the community. All values are expressed in <strong>Coke Couches (CC)</strong>, 
              with the Coke Couch serving as our baseline currency at <strong>1.0 CC</strong>.
            </p>
          </div>

          {/* Core Formula with Real Example */}
          <div className="bg-white/60 backdrop-blur rounded-xl p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <Calculator className="w-6 h-6 text-purple-600" />
              <h3 className="text-xl font-bold text-gray-800 font-coke">The Core Formula</h3>
            </div>
            <div className="bg-gray-100 rounded-lg p-4 font-mono text-sm mb-4">
              <strong className="text-purple-700">V(Item) = (Coke_Couch_Count / Item_Count) × [0.7 + 0.3 × Trade_Frequency_Ratio]</strong>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-coke font-bold text-blue-800 mb-2">Scarcity Component (70%)</h4>
                <p className="font-coke text-sm text-blue-700">
                  Items with fewer copies in circulation get higher values. 
                  If only 5 people own an item vs 50 people owning Coke Couches, that item gets a 10x scarcity multiplier.
                </p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="font-coke font-bold text-green-800 mb-2">Trading Activity (30%)</h4>
                <p className="font-coke text-sm text-green-700">
                  Items that are actively traded get a small premium. 
                  This reflects real market demand and helps identify "hot" items in the community.
                </p>
              </div>
            </div>

            {/* Real Example with Gong */}
            <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg p-4 border border-orange-200">
              <div className="flex items-center gap-3 mb-3">
                <img 
                  src="/icons/Gong small.gif" 
                  alt="Gong" 
                  className="w-8 h-8 pixelated"
                />
                <h4 className="font-coke font-bold text-orange-800">
                  Live Example: Gong Calculation {!gongExample.hasData && <span className="text-red-600">(Data Loading...)</span>}
                </h4>
              </div>
              
              {gongExample.hasData ? (
                <div className="space-y-2 text-sm font-coke">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Coke Couches owned by community:</span>
                    <span className="font-bold">{gongExample.cokeCouchCount} items</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Gongs owned by community:</span>
                    <span className="font-bold">{gongExample.gongCount} items</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Scarcity ratio ({gongExample.cokeCouchCount} ÷ {gongExample.gongCount}):</span>
                    <span className="font-bold">{gongExample.scarcityRatio}x</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Gong trades ({gongExample.gongTradeCount} of {gongExample.totalValidTrades}):</span>
                    <span className="font-bold">{gongExample.tradeFrequencyRatio}</span>
                  </div>
                  <hr className="border-orange-200" />
                  <div className="flex justify-between">
                    <span className="text-gray-700">Final calculation:</span>
                    <span className="font-mono text-xs">{gongExample.scarcityRatio} × [0.7 + 0.3 × {gongExample.tradeFrequencyRatio}]</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-orange-800 font-bold">Live Gong Value:</span>
                    <span className="font-bold text-orange-600">{gongExample.finalValue} CC</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="text-gray-500 font-coke text-sm">
                    {gongExample.cokeCouchCount === '?' ? 
                      'Loading live data from APIs...' : 
                      'Live data not available - please ensure catalog and possession data is loaded.'
                    }
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Special Adjustments - Now Expandable */}
          <div className="bg-white/60 backdrop-blur rounded-xl border border-gray-200 overflow-hidden">
            <button
              onClick={() => setIsAdjustmentsExpanded(!isAdjustmentsExpanded)}
              className="w-full p-6 flex items-center justify-between hover:bg-white/30 transition-colors duration-200"
            >
              <div className="flex items-center gap-3">
                <Star className="w-6 h-6 text-yellow-600" />
                <h3 className="text-xl font-bold text-gray-800 font-coke">Special Item Adjustments</h3>
                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-coke">
                  {specialAdjustments.length} items
                </span>
              </div>
              {isAdjustmentsExpanded ? (
                <ChevronUp className="w-5 h-5 text-gray-600" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-600" />
              )}
            </button>
            
            {isAdjustmentsExpanded && (
              <div className="px-6 pb-6">
                <p className="font-coke text-gray-700 mb-4 leading-relaxed">
                  Some items require manual adjustments to their calculated base values due to <strong>inconsistent historical data</strong> 
                  or <strong>unique market conditions</strong>. These multipliers and divisions help ensure valuations better reflect 
                  actual trading patterns and community consensus.
                </p>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {specialAdjustments.map((item, idx) => (
                    <div key={idx} className="bg-white/60 rounded-lg p-3 border border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="font-coke font-medium text-gray-800 text-sm">{item.name}</span>
                        <span className="font-bold text-gray-600 text-sm">{item.adjustment}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ValuationModal; 