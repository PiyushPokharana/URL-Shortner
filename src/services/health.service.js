const { pool } = require("../config/database");
const { redis } = require("../config/redis");

async function getDeepHealth() {
    const startedAt = Date.now();

    const [dbResult, redisResult] = await Promise.allSettled([
        pool.query("SELECT NOW() AS server_time"),
        redis.ping()
    ]);

    const dbHealthy = dbResult.status === "fulfilled";
    const redisHealthy = redisResult.status === "fulfilled";

    return {
        status: dbHealthy && redisHealthy ? "ok" : "degraded",
        checks: {
            database: dbHealthy ? "up" : "down",
            redis: redisHealthy ? "up" : "down"
        },
        durationMs: Date.now() - startedAt
    };
}

module.exports = {
    getDeepHealth
};
