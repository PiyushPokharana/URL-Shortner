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

const env = {
    appName: process.env.APP_NAME || "url-shortener-service",
    nodeEnv: process.env.NODE_ENV || "development",
    port: toNumber(process.env.PORT, 4000),
    corsOrigin: process.env.CORS_ORIGIN || "*",
    postgres: {
        host: process.env.POSTGRES_HOST || "localhost",
        port: toNumber(process.env.POSTGRES_PORT, 5432),
        user: process.env.POSTGRES_USER || "url_user",
        password: process.env.POSTGRES_PASSWORD || "url_password",
        database: process.env.POSTGRES_DB || "url_shortener",
        ssl: process.env.POSTGRES_SSL === "true"
    },
    redis: {
        host: process.env.REDIS_HOST || "localhost",
        port: toNumber(process.env.REDIS_PORT, 6379),
        password: process.env.REDIS_PASSWORD || "",
        db: toNumber(process.env.REDIS_DB, 0),
        cacheTtlSeconds: toNumber(process.env.REDIS_CACHE_TTL_SECONDS, 3600)
    },
    rateLimit: {
        enabled: toBoolean(process.env.RATE_LIMIT_ENABLED, true),
        requestsPerMinute: toNumber(process.env.RATE_LIMIT_REQUESTS_PER_MINUTE, 120),
        windowSeconds: toNumber(process.env.RATE_LIMIT_WINDOW_SECONDS, 60)
    }
};

module.exports = env;
