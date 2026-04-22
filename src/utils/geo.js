function normalizeCountryCode(value) {
    if (!value || typeof value !== "string") {
        return null;
    }

    const trimmed = value.trim().toUpperCase();
    if (!trimmed || trimmed.length > 3 || trimmed === "XX") {
        return null;
    }

    return trimmed;
}

function normalizeCountryName(value) {
    if (!value || typeof value !== "string") {
        return null;
    }

    const trimmed = value.trim();
    return trimmed ? trimmed.slice(0, 100) : null;
}

function extractGeoDataFromHeaders(headers = {}) {
    const countryCode =
        normalizeCountryCode(headers["cf-ipcountry"]) ||
        normalizeCountryCode(headers["x-vercel-ip-country"]) ||
        normalizeCountryCode(headers["x-country-code"]) ||
        normalizeCountryCode(headers["x-appengine-country"]);

    const countryName =
        normalizeCountryName(headers["x-vercel-ip-country-name"]) ||
        normalizeCountryName(headers["x-country-name"]);

    return {
        countryCode,
        countryName
    };
}

module.exports = {
    extractGeoDataFromHeaders
};