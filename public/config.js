// AI Business backend config — single source of truth for all frontend files
window.BACKENDS = [
  "https://ai-business-1-ok3x.onrender.com",
  "https://ai-business-1orz.onrender.com",
  "https://ai-business-90n6.onrender.com"
];

// Try each backend in order, return the first that responds
window.tryBackends = function(path, options) {
  options = options || {};
  var attempt = function(i) {
    if (i >= BACKENDS.length) {
      return Promise.reject(new Error("All backends unreachable"));
    }
    var url = BACKENDS[i] + path;
    return fetch(url, options)
      .then(function(r) {
        if (r.ok || r.status === 401 || r.status === 403) {
          // 401/403 = backend alive but auth failed (still counts as "reachable")
          return r;
        }
        // 5xx = backend down, try next
        throw new Error("Backend " + i + " returned " + r.status);
      })
      .catch(function() {
        return attempt(i + 1);
      });
  };
  return attempt(0);
};

// Get the first working backend URL (for display/debugging)
window.getActiveBackend = function() {
  return Promise.all(BACKENDS.map(function(url) {
    return fetch(url + "/api/me", { method: "HEAD" })
      .then(function() { return url; })
      .catch(function() { return null; });
  })).then(function(results) {
    return results.find(function(u) { return u; }) || BACKENDS[0];
  });
};
