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
      return res.status(400).json({ error: 'Endpoint parameter is required' });
    }

    const baseUrl = 'https://decibel.fun';
    const targetUrl = `${baseUrl}${endpoint}`;

    const response = await fetch(targetUrl);

    if (!response.ok) {
      // Forward the status from the target server
      return res.status(response.status).json({
        error: `API request failed with status ${response.status}`,
        details: await response.text(),
      });
    }

    // Pass through the headers from the target response
    const contentType = response.headers.get('content-type');
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }
    
    // Stream the response body back to the client
    res.status(200);
    response.body.pipe(res);

  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Failed to fetch data', details: error.message });
  }
} 