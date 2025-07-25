export default async function handler(req, res) {
  // Set CORS headers for all responses
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  try {
    const { endpoint } = req.query;

    if (!endpoint) {
      console.error('Proxy: Missing endpoint parameter');
      return res.status(400).json({ error: 'Endpoint parameter is required' });
    }

    const baseUrl = 'https://decibel.fun';
    const targetUrl = `${baseUrl}${endpoint}`;
    
    console.log(`Proxy: Fetching ${targetUrl}`);

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Vercel-Proxy/1.0)',
      },
    });

    console.log(`Proxy: Response status ${response.status} for ${targetUrl}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Proxy: API request failed with status ${response.status}:`, errorText);
      
      return res.status(response.status).json({
        error: `API request failed with status ${response.status}`,
        details: errorText,
        targetUrl: targetUrl
      });
    }

    // Get the content type from the target response
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    
    // Handle different content types properly
    if (contentType.includes('application/json')) {
      // For JSON responses, parse and re-stringify to ensure proper handling
      const jsonData = await response.json();
      res.status(200).json(jsonData);
    } else if (contentType.includes('text/')) {
      // For text responses (like your catalog data), get as text
      const textData = await response.text();
      res.status(200).send(textData);
    } else {
      // For other content types, get as buffer
      const buffer = await response.arrayBuffer();
      res.status(200).send(Buffer.from(buffer));
    }

  } catch (error) {
    console.error('Proxy error:', error);
    console.error('Proxy error stack:', error.stack);
    
    res.status(500).json({ 
      error: 'Failed to fetch data', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
} 