const { pool } = require("../config/database");

async function initializeUrlModel() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS urls (
            id BIGSERIAL PRIMARY KEY,
            original_url TEXT NOT NULL,
            short_code VARCHAR(64) NOT NULL UNIQUE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            expiry_at TIMESTAMPTZ NULL
        );
    `);

    await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_urls_short_code
        ON urls (short_code);
    `);
}

async function getNextUrlId() {
    const result = await pool.query(
        "SELECT nextval(pg_get_serial_sequence('urls', 'id')) AS id"
    );

    return Number(result.rows[0].id);
}

async function findUrlByShortCode(shortCode) {
    const result = await pool.query(
        `
            SELECT id, original_url, short_code, created_at, expiry_at
            FROM urls
            WHERE short_code = $1
            LIMIT 1
        `,
        [shortCode]
    );

    return result.rows[0] || null;
}

async function findActiveUrlByShortCode(shortCode) {
    const result = await pool.query(
        `
            SELECT id, original_url, short_code, created_at, expiry_at
            FROM urls
            WHERE short_code = $1
              AND (expiry_at IS NULL OR expiry_at > NOW())
            LIMIT 1
        `,
        [shortCode]
    );

    return result.rows[0] || null;
}

async function createUrlRecord({ id, originalUrl, shortCode, expiryAt }) {
    const result = await pool.query(
        `
            INSERT INTO urls (id, original_url, short_code, expiry_at)
            VALUES ($1, $2, $3, $4)
            RETURNING id, original_url, short_code, created_at, expiry_at
        `,
        [id, originalUrl, shortCode, expiryAt]
    );

    return result.rows[0];
}

module.exports = {
    initializeUrlModel,
    getNextUrlId,
    findUrlByShortCode,
    findActiveUrlByShortCode,
    createUrlRecord
};