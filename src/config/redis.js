const Redis = require("ioredis");
const env = require("./env");
const logger = require("./logger");

const redisConfig = {
    maxRetriesPerRequest: 3,
    lazyConnect: true
};

const redis = env.redis.url
    ? new Redis(env.redis.url, redisConfig)
    : new Redis({
        host: env.redis.host,
        port: env.redis.port,
        password: env.redis.password || undefined,
        db: env.redis.db,
        maxRetriesPerRequest: 3,
        lazyConnect: true
    });

redis.on("error", (error) => {
    logger.error({ err: error }, "Redis error");
});

async function connectRedis() {
    await redis.connect();
    await redis.ping();
    logger.info("Redis connection established");
}

async function disconnectRedis() {
    if (redis.status !== "end") {
        await redis.quit();
        logger.info("Redis connection closed");
    }
}

function getRedisCacheTtlSeconds(expiryAt) {
    const defaultTtlSeconds = env.redis.cacheTtlSeconds;

    if (!expiryAt) {
        return defaultTtlSeconds;
    }

    const expiryTimeMs = new Date(expiryAt).getTime();
    const remainingSeconds = Math.floor((expiryTimeMs - Date.now()) / 1000);

    if (remainingSeconds <= 0) {
        return 0;
    }

    return Math.min(defaultTtlSeconds, remainingSeconds);
}

module.exports = {
    redis,
    connectRedis,
    disconnectRedis,
    getRedisCacheTtlSeconds
};
