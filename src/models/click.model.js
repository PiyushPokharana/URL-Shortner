const { pool } = require("../config/database");

async function initializeClickModel() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS clicks (
            id BIGSERIAL PRIMARY KEY,
            short_code VARCHAR(64) NOT NULL,
            ip_address INET NOT NULL,
            visitor_fingerprint VARCHAR(64) NULL,
            country_code VARCHAR(3) NULL,
            country_name VARCHAR(100) NULL,
            clicked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            CONSTRAINT fk_clicks_short_code
                FOREIGN KEY (short_code)
                REFERENCES urls(short_code)
                ON DELETE CASCADE
        );
    `);

    await pool.query(`
        ALTER TABLE clicks
        ADD COLUMN IF NOT EXISTS country_code VARCHAR(3) NULL;
    `);

    await pool.query(`
        ALTER TABLE clicks
        ADD COLUMN IF NOT EXISTS country_name VARCHAR(100) NULL;
    `);

    await pool.query(`
        ALTER TABLE clicks
        ADD COLUMN IF NOT EXISTS visitor_fingerprint VARCHAR(64) NULL;
    `);

    await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_clicks_short_code_clicked_at
        ON clicks (short_code, clicked_at DESC);
    `);

    await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_clicks_short_code_ip_address
        ON clicks (short_code, ip_address);
    `);

    await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_clicks_short_code_visitor_fingerprint
        ON clicks (short_code, visitor_fingerprint);
    `);
}

async function createClickEvent({
    shortCode,
    ipAddress,
    visitorFingerprint = null,
    countryCode = null,
    countryName = null,
    clickedAt = new Date()
}) {
    const result = await pool.query(
        `
            INSERT INTO clicks (short_code, ip_address, visitor_fingerprint, country_code, country_name, clicked_at)
            VALUES ($1, $2::inet, $3, $4, $5, $6)
            RETURNING
                id,
                short_code,
                ip_address::text AS ip_address,
                visitor_fingerprint,
                country_code,
                country_name,
                clicked_at
        `,
        [shortCode, ipAddress, visitorFingerprint, countryCode, countryName, clickedAt]
    );

    return result.rows[0];
}

async function getClickAnalyticsByShortCode(shortCode) {
    const aggregateResult = await pool.query(
        `
            SELECT
                COUNT(*)::BIGINT AS total_clicks,
                COUNT(DISTINCT COALESCE(visitor_fingerprint, ip_address::text))::BIGINT AS unique_users,
                MIN(clicked_at) AS first_clicked_at,
                MAX(clicked_at) AS last_clicked_at
            FROM clicks
            WHERE short_code = $1
        `,
        [shortCode]
    );

    const recentEventsResult = await pool.query(
        `
            SELECT ip_address::text AS ip_address, country_code, country_name, clicked_at
            FROM clicks
            WHERE short_code = $1
            ORDER BY clicked_at DESC
            LIMIT 20
        `,
        [shortCode]
    );

    return {
        totalClicks: Number(aggregateResult.rows[0].total_clicks || 0),
        uniqueUsers: Number(aggregateResult.rows[0].unique_users || 0),
        firstClickedAt: aggregateResult.rows[0].first_clicked_at || null,
        lastClickedAt: aggregateResult.rows[0].last_clicked_at || null,
        recentEvents: recentEventsResult.rows.map((row) => ({
            ipAddress: row.ip_address,
            countryCode: row.country_code || null,
            countryName: row.country_name || null,
            clickedAt: row.clicked_at
        }))
    };
}

module.exports = {
    initializeClickModel,
    createClickEvent,
    getClickAnalyticsByShortCode
};