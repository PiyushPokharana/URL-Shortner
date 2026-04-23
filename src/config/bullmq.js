const Redis = require("ioredis");
const env = require("./env");

function createBullConnection() {
    return new Redis({
        host: env.redis.host,
        port: env.redis.port,
        password: env.redis.password || undefined,
        db: env.redis.db,
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
        lazyConnect: false
    });
}

module.exports = {
    createBullConnection
};
