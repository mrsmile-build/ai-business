const BACKENDS = [
  'https://ai-business-90n6.onrender.com',
  'https://ai-business-1orz.onrender.com',
  'https://ai-business-1-ok3x.onrender.com'
];

const skipUntil = {};

export default async (req, res) => {
  const url = new URL(req.url, `https://${req.headers.host}`);
  const path = url.pathname + url.search;

  // Debug endpoint: shows which backend is first + skip memory
  if (path === '/api/debug-backends') {
    res.setHeader('content-type', 'application/json');
    return res.status(200).send(JSON.stringify({
      backends: BACKENDS,
      first: BACKENDS[0],
      skipUntil,
      now: new Date().toISOString()
    }));
  }

  // Ping endpoint: confirms proxy is alive
  if (path === '/api/ping') {
    res.setHeader('content-type', 'application/json');
    return res.status(200).send(JSON.stringify({ ok: true, proxy: 'alive', time: new Date().toISOString() }));
  }

  // Proxy logic: try each backend in order
  for (const backend of BACKENDS) {
    if (skipUntil[backend] && Date.now() < skipUntil[backend]) continue;

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
        signal: AbortSignal.timeout(4000)
      });

      const text = await response.text();

      // Skip suspended backends
      const isSuspended =
        text.includes('This service has been suspended') ||
        text.includes('Service Unavailable') ||
        text.includes('Application Error') ||
        response.status === 503;

      if (isSuspended) {
        skipUntil[backend] = Date.now() + 5 * 60 * 1000;
        continue;
      }

      // Forward response (no caching)
      res.setHeader('cache-control', 'no-store, max-age=0');
      response.headers.forEach((value, key) => {
        if (!['transfer-encoding', 'connection', 'content-encoding', 'content-length', 'cache-control', 'etag', 'age'].includes(key.toLowerCase())) {
          res.setHeader(key, value);
        }
      });

      return res.status(response.status).send(text);
    } catch (error) {
      console.error(`Backend ${backend} failed:`, error.message);
      skipUntil[backend] = Date.now() + 5 * 60 * 1000;
      continue;
    }
  }

  // All backends failed
  res.setHeader('cache-control', 'no-store');
  return res.status(503).send(`<!DOCTYPE html><html><head><title>Warming Up</title></head><body style="background:#080c14;color:#f1f5f9;display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:system-ui"><div style="text-align:center"><h1>🔥 Warming up...</h1><p>Try again in 30 seconds.</p><button onclick="location.reload()">Retry</button></div></body></html>`);
};
