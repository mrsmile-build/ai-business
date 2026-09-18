const BACKENDS = [
  'https://ai-business-90n6.onrender.com',
  'https://ai-business-1-ok3x.onrender.com',
  'https://ai-business-1orz.onrender.com'
];

export default async (req, res) => {
  const url = new URL(req.url, `https://${req.headers.host}`);
  const path = url.pathname + url.search;
  
  for (const backend of BACKENDS) {
    try {
      const targetUrl = backend + path;
      
      const headers = Object.fromEntries(
        Object.entries(req.headers).filter(([k]) => 
          !['host', 'connection', 'content-length'].includes(k.toLowerCase())
        )
      );
      
      const response = await fetch(targetUrl, {
        method: req.method,
        headers,
        body: req.method !== 'GET' && req.method !== 'HEAD' ? req.body : undefined,
        redirect: 'manual'
      });
      
      // Forward response headers (excluding problematic ones)
      const responseHeaders = {};
      response.headers.forEach((value, key) => {
        if (!['transfer-encoding', 'connection'].includes(key.toLowerCase())) {
          responseHeaders[key] = value;
        }
      });
      
      const text = await response.text();
      
      Object.entries(responseHeaders).forEach(([key, value]) => {
        res.setHeader(key, value);
      });
      
      res.status(response.status).send(text);
      return;
      
    } catch (error) {
      console.error(`Backend ${backend} failed for ${path}:`, error.message);
      continue;
    }
  }
  
  res.status(503).send('All backends unavailable. Please try again later.');
};
