import { imageBaseMap } from '../data/imageBaseMap.js';

export const getImageUrl = (imageBase) => {
  if (!imageBase) return null;
  
  const key = imageBase.replace(/"/g, '').toLowerCase();
  const imageName = imageBaseMap[key];
  
  if (imageName) {
    return `/icons/${imageName}`;
  }
  
  if (key) {
    console.warn(`No image mapping found for imageBase: "${key}"`);
  }
  return null;
};

export const shouldShowCCBadge = (item, valuation) => {
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

export const getCustomCCValue = (item, valuations) => {
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