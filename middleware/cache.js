const cache = new Map();

/**
 * Basic in-memory cache middleware for optimizing GET responses
 * @param {number} duration - Time to cache in seconds
 */
const apiCache = (duration) => {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }
    
    // Create a unique key based on URL
    // Including req.query automatically since it's part of originalUrl
    const urlKey = req.originalUrl || req.url;
    
    // Since this is multi-tenant, it's safer to cache per-teacher (tenant) 
    // to prevent mixing up data across different schools.
    const tenantId = req.CurrentTeacher ? req.CurrentTeacher.id : 'global';
    const key = `__express__${tenantId}__${urlKey}`;
    
    // Check if we have a cached response
    const cachedItem = cache.get(key);
    
    if (cachedItem) {
      // Check if it has expired
      if (Date.now() < cachedItem.expiry) {
        // Must send back with application/json if it was a JSON response originally
        res.setHeader('Content-Type', 'application/json');
        return res.send(cachedItem.data);
      } else {
        // Expired, delete from map
        cache.delete(key);
      }
    }
    
    // Override res.send to intercept the response and cache it
    const originalSend = res.send;
    res.send = function (body) {
      // Only cache strings (JSON strings)
      if (typeof body === 'string') {
        const expiry = Date.now() + (duration * 1000);
        cache.set(key, { data: body, expiry });
      } else if (Buffer.isBuffer(body)) {
        // Handle buffered JSON if passed direct buffer
        const expiry = Date.now() + (duration * 1000);
        cache.set(key, { data: body.toString(), expiry });
      }
      
      // Call original send
      originalSend.call(this, body);
    };
    
    next();
  };
};

/**
 * Helper to manually clear cache for a specific tenant or entirely
 * Useful for POST/PUT/DELETE requests to purge stale data
 */
const clearCache = (tenantId = null) => {
  if (tenantId) {
    for (const key of cache.keys()) {
      if (key.includes(`__${tenantId}__`)) {
        cache.delete(key);
      }
    }
  } else {
    cache.clear();
  }
};

module.exports = { apiCache, clearCache, cache };
