const Redis = require("ioredis");
const logger = require("./logger");

const redisConfig = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: null, // Critical for rate-limit-redis
};

const redis = new Redis(redisConfig);

redis.on("connect", () => {
  logger.info(`✅ Connected to Redis at ${redisConfig.host}:${redisConfig.port}`);
});

redis.on("error", (err) => {
  logger.error("❌ Redis Connection Error:", err);
});

module.exports = redis;
