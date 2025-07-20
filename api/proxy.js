export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { endpoint } = req.query;
    
    if (!endpoint) {
      return res.status(400).json({ error: 'Endpoint parameter is required' });
    }

    // Check if we're running locally (Vercel sets VERCEL environment variable)
    const isLocalhost = !process.env.VERCEL;
    
    if (isLocalhost) {
      console.log('Running locally - using mock data for:', endpoint);
      
      // Return mock data for local development
      if (endpoint.includes('Catalogue_English.txt')) {
        // Mock catalog data
        const mockCatalog = `ITEM=[ #prodId: "1" #name: "Mock Studio Chair" #catName: "Furniture" #type: "Chair" #catDesc: "A comfortable studio chair" #imageBase: "6_chair_studio_small.png" ]
ITEM=[ #prodId: "2" #name: "Mock Microphone" #catName: "Audio Equipment" #type: "Microphone" #catDesc: "Professional studio microphone" #imageBase: "13_microphone_small.png" ]
ITEM=[ #prodId: "3" #name: "Mock Rug" #catName: "Decor" #type: "Rug" #catDesc: "Stylish studio rug" #imageBase: "10_rug1_small.png" ]`;
        
        res.status(200).send(mockCatalog);
        return;
      }
      
      if (endpoint.includes('/api/possession')) {
        // Mock possession data
        const mockPossessions = [
          {
            id: 1,
            catalogItemId: 1,
            datePurchased: "2024-01-15T10:30:00Z",
            purchasePrice: 150
          },
          {
            id: 2,
            catalogItemId: 2,
            datePurchased: "2024-01-20T14:45:00Z",
            purchasePrice: 300
          },
          {
            id: 3,
            catalogItemId: 3,
            datePurchased: "2024-02-01T09:15:00Z",
            purchasePrice: 75
          },
          {
            id: 4,
            catalogItemId: 1,
            datePurchased: "2024-02-10T16:20:00Z",
            purchasePrice: 150
          }
        ];
        
        res.status(200).json(mockPossessions);
        return;
      }
    }

    // Construct the full URL
    const baseUrl = 'https://decibel.fun';
    const url = `${baseUrl}${endpoint}`;

    // Make the request to the actual API
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Get the content type
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      res.status(200).json(data);
    } else {
      const text = await response.text();
      res.status(200).send(text);
    }

  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Failed to fetch data', details: error.message });
  }
} 