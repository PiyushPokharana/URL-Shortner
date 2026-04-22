const { Pool } = require("pg");
const env = require("./env");
const logger = require("./logger");

const pool = new Pool({
    host: env.postgres.host,
    port: env.postgres.port,
    user: env.postgres.user,
    password: env.postgres.password,
    database: env.postgres.database,
    ssl: env.postgres.ssl ? { rejectUnauthorized: false } : false,
    max: 10,
    idleTimeoutMillis: 30000
});

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
