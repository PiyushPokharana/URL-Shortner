const dotenv = require("dotenv");

dotenv.config();

function toNumber(value, fallback) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function toBoolean(value, fallback) {
    if (value === undefined) {
        return fallback;
    }

    if (typeof value === "boolean") {
        return value;
    }

    const normalized = String(value).trim().toLowerCase();
    if (normalized === "true") {
        return true;
    }

    if (normalized === "false") {
        return false;
    }

    return fallback;
}

function toTrustProxy(value) {
    if (value === undefined || value === "") {
        return false;
    }

    const normalized = String(value).trim().toLowerCase();
    if (normalized === "true") {
        return true;
    }

    if (normalized === "false") {
        return false;
    }

    const parsed = Number(normalized);
    if (Number.isInteger(parsed) && parsed >= 0) {
        return parsed;
    }

    return value;
}

const env = {
    appName: process.env.APP_NAME || "url-shortener-service",
    nodeEnv: process.env.NODE_ENV || "development",
    port: toNumber(process.env.PORT, 4000),
    trustProxy: toTrustProxy(process.env.TRUST_PROXY),
    corsOrigin: process.env.CORS_ORIGIN || "*",
    postgres: {
        url: process.env.DATABASE_URL,
        host: process.env.POSTGRES_HOST,
        port: toNumber(process.env.POSTGRES_PORT, 5432),
        user: process.env.POSTGRES_USER,
        password: process.env.POSTGRES_PASSWORD,
        database: process.env.POSTGRES_DB,
        ssl: process.env.POSTGRES_SSL === "true"
    },
    redis: {
        url: process.env.REDIS_URL,
        host: process.env.REDIS_HOST,
        port: toNumber(process.env.REDIS_PORT, 6379),
        password: process.env.REDIS_PASSWORD || "",
        db: toNumber(process.env.REDIS_DB, 0),
        cacheTtlSeconds: toNumber(process.env.REDIS_CACHE_TTL_SECONDS, 3600)
    },
    urlFilter: {
        enabled: toBoolean(process.env.URL_FILTER_ENABLED, true),
        bloomBits: toNumber(process.env.URL_FILTER_BLOOM_BITS, 8192),
        bloomHashes: toNumber(process.env.URL_FILTER_BLOOM_HASHES, 4)
    },
    cleanup: {
        enabled: toBoolean(process.env.URL_CLEANUP_ENABLED, true),
        intervalSeconds: toNumber(process.env.URL_CLEANUP_INTERVAL_SECONDS, 300),
        batchSize: toNumber(process.env.URL_CLEANUP_BATCH_SIZE, 1000),
        runOnStartup: toBoolean(process.env.URL_CLEANUP_RUN_ON_STARTUP, true)
    },
    rateLimit: {
        enabled: toBoolean(process.env.RATE_LIMIT_ENABLED, true),
        requestsPerMinute: toNumber(process.env.RATE_LIMIT_REQUESTS_PER_MINUTE, 120),
        windowSeconds: toNumber(process.env.RATE_LIMIT_WINDOW_SECONDS, 60)
    },
    queue: {
        analyticsName: process.env.ANALYTICS_QUEUE_NAME || "analytics-clicks",
        analyticsAttempts: Math.max(1, toNumber(process.env.ANALYTICS_QUEUE_ATTEMPTS, 5)),
        analyticsBackoffMs: Math.max(100, toNumber(process.env.ANALYTICS_QUEUE_BACKOFF_MS, 1000)),
        analyticsConcurrency: Math.max(1, toNumber(process.env.ANALYTICS_WORKER_CONCURRENCY, 5)),
        removeOnComplete: Math.max(0, toNumber(process.env.ANALYTICS_QUEUE_REMOVE_ON_COMPLETE, 1000)),
        removeOnFail: Math.max(0, toNumber(process.env.ANALYTICS_QUEUE_REMOVE_ON_FAIL, 5000))
    }
};

module.exports = env;
