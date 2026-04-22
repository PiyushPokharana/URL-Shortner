const { findUrlByShortCode } = require("../models/url.model");
const { getClickAnalyticsByShortCode } = require("../models/click.model");
const HttpError = require("../utils/http-error");

function normalizeShortCode(shortCode) {
    if (!shortCode || typeof shortCode !== "string") {
        throw new HttpError(400, "shortCode is required");
    }

    const normalizedShortCode = shortCode.trim();

    if (!normalizedShortCode) {
        throw new HttpError(400, "shortCode is required");
    }

    return normalizedShortCode;
}

async function getShortCodeAnalytics(shortCode) {
    const normalizedShortCode = normalizeShortCode(shortCode);
    const urlRecord = await findUrlByShortCode(normalizedShortCode);

    if (!urlRecord) {
        throw new HttpError(404, "Short URL not found");
    }

    const analytics = await getClickAnalyticsByShortCode(normalizedShortCode);

    return {
        shortCode: normalizedShortCode,
        originalUrl: urlRecord.original_url,
        createdAt: urlRecord.created_at,
        expiryAt: urlRecord.expiry_at,
        ...analytics
    };
}

module.exports = {
    getShortCodeAnalytics
};
