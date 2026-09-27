const BACKENDS = [
  'https://ai-business-1orz.onrender.com',
  'https://ai-business-1-ok3x.onrender.com',
  'https://ai-business-90n6.onrender.com'
];

// Skip memory: don't retry a dead backend for 5 minutes
const skipUntil = {};

export default async (req, res) => {
  const url = new URL(req.url, `https://${req.headers.host}`);
  const path = url.pathname + url.search;

  for (const backend of BACKENDS) {
    // Skip if we know this backend is dead
    if (skipUntil[backend] && Date.now() < skipUntil[backend]) {
      continue;
    }

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
        redirect: 'manual',
        signal: AbortSignal.timeout(45000) // 45s timeout (Render cold start takes 30-50s)
      });

      const text = await response.text();

      // Check if this is a suspension page
      const isSuspended = 
        text.includes('This service has been suspended') ||
        text.includes('Service Unavailable') ||
        text.includes('Application Error') ||
        response.status === 503;

      if (isSuspended) {
        console.log(`Backend ${backend} suspended for ${path}, skipping for 5min`);
        skipUntil[backend] = Date.now() + 5 * 60 * 1000; // skip for 5 minutes
        continue;
      }

      // Forward response headers (excluding problematic ones)
      const responseHeaders = {};
      response.headers.forEach((value, key) => {
        if (!['transfer-encoding', 'connection', 'content-encoding', 'content-length'].includes(key.toLowerCase())) {
          responseHeaders[key] = value;
        }
      });

      Object.entries(responseHeaders).forEach(([key, value]) => {
        res.setHeader(key, value);
      });

      res.status(response.status).send(text);
      return;

    } catch (error) {
      console.error(`Backend ${backend} failed for ${path}:`, error.message);
      skipUntil[backend] = Date.now() + 5 * 60 * 1000; // skip for 5 minutes
      continue;
    }
  }

  // All backends dead — show a clean error page
  res.status(503).send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>AI Business - Warming Up</title>
      <style>
        body{font-family:Arial,sans-serif;background:#080c14;color:#f1f5f9;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:20px;text-align:center}
        .box{max-width:400px}
        h1{font-size:24px;margin:0 0 12px}
        p{color:#94a3b8;font-size:14px;line-height:1.6}
        button{margin-top:20px;padding:12px 24px;background:#2563eb;border:none;border-radius:8px;color:white;font-size:14px;cursor:pointer}
      </style>
    </head>
    <body>
      <div class="box">
        <h1>🔥 Warming up...</h1>
        <p>We're spinning up our engines. This takes about 30 seconds. Try again in a moment.</p>
        <button onclick="location.reload()">Try Again</button>
      </div>
    </body>
    </html>
  `);
};
