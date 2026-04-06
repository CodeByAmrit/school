const redis = require("../config/redis");
const logger = require("../config/logger");

/**
 * Distributed Redis-based cache middleware for optimizing GET responses
 * @param {number} duration - Time to cache in seconds
 */
const apiCache = (duration) => {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== "GET") {
      return next();
    }

    const urlKey = req.originalUrl || req.url;
    const tenantId = req.user && req.user._id ? req.user._id : (req.CurrentTeacher ? req.CurrentTeacher.id : "global");
    const key = `__express__${tenantId}__${urlKey}`;

    try {
      // Check if we have a cached response in Redis
      const cachedData = await redis.get(key);

      if (cachedData) {
        res.setHeader("Content-Type", "application/json");
        res.setHeader("X-Cache", "HIT");
        return res.send(cachedData);
      }

      // Override res.send to intercept and cache the response
      const originalSend = res.send;
      res.send = function (body) {
        if (typeof body === "string" || Buffer.isBuffer(body)) {
          const cacheValue = Buffer.isBuffer(body) ? body.toString() : body;
          // Store in Redis with expiration (SETEX equivalent)
          redis.setex(key, duration, cacheValue).catch((err) => {
            logger.error("❌ Redis Cache SET Error:", err);
          });
        }
        res.setHeader("X-Cache", "MISS");
        originalSend.call(this, body);
      };

      next();
    } catch (error) {
      logger.error("❌ Redis Cache Error:", error);
      next(); // Fail gracefully and proceed without cache
    }
  };
};

/**
 * Helper to manually clear cache for a specific tenant in the Redis cluster
 */
const clearCache = async (tenantId = null) => {
  if (!tenantId) {
    logger.info("🧹 Purging entire Redis cache");
    await redis.flushdb().catch((err) => logger.error("❌ Redis Flush Error:", err));
    return;
  }

  const pattern = `*__${tenantId}__*`;
  let cursor = "0";
  let count = 0;

  try {
    // Use SCAN to avoid blocking Redis like KEYS * would
    do {
      const [newCursor, keys] = await redis.scan(cursor, "MATCH", pattern, "COUNT", 100);
      cursor = newCursor;
      if (keys.length > 0) {
        await redis.del(...keys);
        count += keys.length;
      }
    } while (cursor !== "0");

    logger.info(`🧹 Purged ${count} cache keys for tenant: ${tenantId}`);
  } catch (error) {
    logger.error("❌ Redis Cache Purge Error:", error);
  }
};

module.exports = { apiCache, clearCache };
