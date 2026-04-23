const crypto = require("crypto");

function normalizeUserAgent(userAgent) {
    if (!userAgent || typeof userAgent !== "string") {
        return "unknown";
    }

    const normalized = userAgent.trim().toLowerCase();
    return normalized || "unknown";
}

function buildVisitorFingerprint({ shortCode, ipAddress, userAgent }) {
    const normalizedUserAgent = normalizeUserAgent(userAgent);
    const raw = `${shortCode}|${ipAddress}|${normalizedUserAgent}`;

    return crypto.createHash("sha256").update(raw).digest("hex");
}

module.exports = {
    buildVisitorFingerprint,
    normalizeUserAgent
};