import { useMemo } from 'react';

// --- Constants ---
// The name of our baseline currency item.
const COKE_COUCH_NAME = '"Coke Couch"'; 
// Weights for our hybrid valuation formula. w₁ for scarcity, w₂ for trade frequency.
const WEIGHT_SCARCITY = 0.7;
const WEIGHT_TRADE_FREQ = 0.3;

/**
 * A custom React hook to calculate item valuations based on a hybrid model.
 * It considers both item scarcity and trade frequency against a baseline item (Coke Couch).
 * * V(Item) = (Reference_Count / Item_Count) * [w₁ + w₂ * (Trade_Frequency_Ratio)]
 *
 * @param {Array} catalogData - The list of all catalog items.
 * @param {Array} possessionData - The list of all owned items (possessions).
 * @param {Array} trades - The list of all trade history.
 * @returns {Map<number, number>} A map where the key is the item's prodId 
 * and the value is its calculated valuation in Coke Couches (CC).
 */
export const useItemValuation = (catalogData, possessionData, trades) => {
  const valuations = useMemo(() => {
    // Guard clause: Don't run calculations if essential data is missing.
    if (!catalogData?.length || !possessionData?.length || !trades) {
      return new Map();
    }

    // --- Step 1: Find the baseline item (Coke Couch) ---
    const cokeCouchCatalogItem = catalogData.find(item => item.name === COKE_COUCH_NAME);
    if (!cokeCouchCatalogItem) {
      console.warn('Valuation Error: Coke Couch not found in catalog. Cannot calculate values.');
      return new Map();
    }
    const COKE_COUCH_PROD_ID = cokeCouchCatalogItem.prodId;

    // --- Step 2: Calculate item counts from possession data ---
    const itemCounts = new Map();
    possessionData.forEach(p => {
      itemCounts.set(p.catalogItemId, (itemCounts.get(p.catalogItemId) || 0) + 1);
    });
    const cokeCouchCount = itemCounts.get(COKE_COUCH_PROD_ID) || 1; // Default to 1 to prevent division by zero

    // --- Step 3: Calculate trade frequencies ---
    // Create a quick lookup map for possessionId -> catalogItemId
    const possessionIdToCatalogIdMap = new Map();
    possessionData.forEach(p => possessionIdToCatalogIdMap.set(p.id, p.catalogItemId));
    
    const tradeCounts = new Map();
    const validTrades = trades.filter(trade => 
        [...(trade.traderItemIds || []), ...(trade.tradeeItemIds || [])]
        .every(pid => possessionIdToCatalogIdMap.has(pid))
    );
    const totalValidTrades = validTrades.length;

    validTrades.forEach(trade => {
      const allItemIdsInTrade = new Set();
      const allPossessionIds = [...(trade.traderItemIds || []), ...(trade.tradeeItemIds || [])];
      
      allPossessionIds.forEach(pid => {
        const catalogId = possessionIdToCatalogIdMap.get(pid);
        if (catalogId) allItemIdsInTrade.add(catalogId);
      });
      
      allItemIdsInTrade.forEach(catalogId => {
        tradeCounts.set(catalogId, (tradeCounts.get(catalogId) || 0) + 1);
      });
    });

    // --- Step 4: Calculate final valuation for each item ---
    const calculatedValuations = new Map();
    catalogData.forEach(item => {
      if (item.prodId === COKE_COUCH_PROD_ID) {
        calculatedValuations.set(item.prodId, 1); // Coke Couch is always 1 CC
        return;
      }

      const itemCount = itemCounts.get(item.prodId) || 0;
      if (itemCount === 0) {
        calculatedValuations.set(item.prodId, null); // Cannot value items with zero count
        return;
      }

      // Scarcity component
      const scarcityRatio = cokeCouchCount / itemCount;

      // Trade frequency component
      const itemTradeCount = tradeCounts.get(item.prodId) || 0;
      const tradeFrequencyRatio = totalValidTrades > 0 ? itemTradeCount / totalValidTrades : 0;
      
      // Hybrid formula
      const value = scarcityRatio * (WEIGHT_SCARCITY + (WEIGHT_TRADE_FREQ * tradeFrequencyRatio));
      
      calculatedValuations.set(item.prodId, value);
    });
    
    console.log('✅ Item valuations calculated.', calculatedValuations);
    return calculatedValuations;

  }, [catalogData, possessionData, trades]);

  return valuations;
};