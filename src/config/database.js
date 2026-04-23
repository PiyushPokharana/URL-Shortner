const { Pool } = require("pg");
const env = require("./env");
const logger = require("./logger");

const poolConfig = {
    max: 10,
    idleTimeoutMillis: 30000
};

if (env.postgres.url) {
    poolConfig.connectionString = env.postgres.url;
    poolConfig.ssl = { rejectUnauthorized: false };
} else {
    poolConfig.host = env.postgres.host;
    poolConfig.port = env.postgres.port;
    poolConfig.user = env.postgres.user;
    poolConfig.password = env.postgres.password;
    poolConfig.database = env.postgres.database;
    poolConfig.ssl = env.postgres.ssl ? { rejectUnauthorized: false } : false;
}

const pool = new Pool(poolConfig);

async function connectDatabase() {
    await pool.query("SELECT 1");
    logger.info("PostgreSQL connection established");
}

async function disconnectDatabase() {
    await pool.end();
    logger.info("PostgreSQL connection closed");
}

module.exports = {
    pool,
    connectDatabase,
    disconnectDatabase
};
