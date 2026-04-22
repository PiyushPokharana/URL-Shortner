const { redis } = require("../config/redis");
const env = require("../config/env");

const RATE_LIMIT_DEFAULT_MESSAGE = "Too Many Requests";

function getClientIp(req) {
    return req.ip || req.socket?.remoteAddress || "unknown";
}

function isHealthRoute(req) {
    return req.path === "/api/health" || req.path === "/api/health/deep";
}

async function rateLimitMiddleware(req, res, next) {
    if (!env.rateLimit.enabled) {
        return next();
    }

    if (isHealthRoute(req)) {
        return next();
    }

    const windowSeconds = Math.max(1, env.rateLimit.windowSeconds);
    const maxRequests = Math.max(1, env.rateLimit.requestsPerMinute);
    const clientIp = getClientIp(req);
    const rateLimitKey = clientIp;

    try {
        const requestCount = await redis.incr(rateLimitKey);

        if (requestCount === 1) {
            await redis.expire(rateLimitKey, windowSeconds);
        }

        const ttlSeconds = await redis.ttl(rateLimitKey);
        const resetAfterSeconds = ttlSeconds > 0 ? ttlSeconds : windowSeconds;
        const remaining = Math.max(0, maxRequests - requestCount);

        res.setHeader("X-RateLimit-Limit", String(maxRequests));
        res.setHeader("X-RateLimit-Remaining", String(remaining));
        res.setHeader("X-RateLimit-Reset", String(resetAfterSeconds));

        if (requestCount > maxRequests) {
            res.setHeader("Retry-After", String(resetAfterSeconds));

            req.log.warn(
                {
                    clientIp,
                    requestCount,
                    maxRequests,
                    windowSeconds
                },
                "Rate limit exceeded"
            );

            return res.status(429).json({ message: RATE_LIMIT_DEFAULT_MESSAGE });
        }
    } catch (error) {
        req.log.warn(
            {
                err: error,
                clientIp,
                windowSeconds,
                maxRequests
            },
            "Rate limiting unavailable, allowing request"
        );
    }

    return next();
}

module.exports = rateLimitMiddleware;
