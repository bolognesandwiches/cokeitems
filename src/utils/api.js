import { parseCatalogData } from './parsers';

const CATALOG_ENDPOINT = '/api/proxy?endpoint=/client2/Catalogue_English.txt?r=86';
const POSSESSION_ENDPOINT = '/api/proxy?endpoint=/api/possession';
const TRADES_ENDPOINT = '/api/proxy?endpoint=/api/trading';

const EXCLUDED_CATEGORIES = ['"Coke Studios Online Catalog"', '"Walls and Floors"'];

export const fetchCatalogAndPossessionData = async () => {
  // Fetch primary catalog data. This is critical, so we throw if it fails.
  const catalogResponse = await fetch(CATALOG_ENDPOINT);
  if (!catalogResponse.ok) {
    throw new Error(`Failed to fetch catalog data: ${catalogResponse.statusText}`);
  }
  const catalogText = await catalogResponse.text();
  const catalogItems = parseCatalogData(catalogText);
  const filteredCatalogItems = catalogItems.filter(item => !EXCLUDED_CATEGORIES.includes(item.catName));

  // Fetch optional possession data. If it fails, we log it but don't crash the app.
  let possessionData = [];
  try {
    const possessionResponse = await fetch(POSSESSION_ENDPOINT);
    if (possessionResponse.ok) {
      possessionData = await possessionResponse.json();
    } else {
      console.warn(`Could not fetch possession data: ${possessionResponse.statusText}. Continuing without it.`);
    }
  } catch (error) {
    console.warn(`An error occurred while fetching possession data: ${error.message}. Continuing without it.`);
  }

  return { catalogData: filteredCatalogItems, possessionData };
};

export const fetchTradesData = async () => {
  const response = await fetch(TRADES_ENDPOINT);
  if (!response.ok) {
    throw new Error('Failed to fetch trades');
  }
  return await response.json();
}; 