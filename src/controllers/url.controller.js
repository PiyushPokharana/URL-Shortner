const asyncHandler = require("../utils/async-handler");
const { createShortUrl, resolveRedirectTarget } = require("../services/url.service");
const { getShortCodeAnalytics } = require("../services/analytics.service");
const { extractGeoDataFromHeaders } = require("../utils/geo");
const { enqueueClickAnalyticsJob } = require("../queues/analytics.queue");

function getRequestDurationMs(startTime) {
    return Number(process.hrtime.bigint() - startTime) / 1e6;
}

const shortenUrl = asyncHandler(async (req, res) => {
    const record = await createShortUrl(req.body);
    const baseUrl = `${req.protocol}://${req.get("host")}`;

    res.status(201).json({
        message: "Short URL created",
        data: {
            id: record.id,
            originalUrl: record.original_url,
            shortCode: record.short_code,
            shortUrl: `${baseUrl}/${record.short_code}`,
            createdAt: record.created_at,
            expiryAt: record.expiry_at
        }
    });
});

const redirectShortUrl = asyncHandler(async (req, res) => {
    const startTime = process.hrtime.bigint();
    const shortCode = req.params.shortCode;
    let redirectSource = "unknown";
    const requestIp = req.ip;
    const userAgent = req.get("user-agent") || null;
    const geoData = extractGeoDataFromHeaders(req.headers);

    try {
        const redirectTarget = await resolveRedirectTarget(shortCode);
        redirectSource = redirectTarget.source;

        // Queue analytics without blocking redirect latency.
        void enqueueClickAnalyticsJob({
            shortCode,
            ipAddress: requestIp,
            userAgent,
            countryCode: geoData.countryCode,
            countryName: geoData.countryName,
            clickedAt: new Date().toISOString()
        }).catch((error) => {
            req.log.warn(
                {
                    err: error,
                    shortCode,
                    ipAddress: requestIp,
                    userAgent,
                    countryCode: geoData.countryCode,
                    countryName: geoData.countryName
                },
                "Failed to enqueue click analytics"
            );
        });

        res.redirect(302, redirectTarget.originalUrl);
    } finally {
        req.log.info(
            {
                shortCode,
                source: redirectSource,
                responseTimeMs: getRequestDurationMs(startTime)
            },
            "Redirect request finished"
        );
    }
});

const getAnalytics = asyncHandler(async (req, res) => {
    const analytics = await getShortCodeAnalytics(req.params.shortCode);

    res.status(200).json({
        message: "Analytics fetched",
        data: analytics
    });
});

module.exports = {
    shortenUrl,
    redirectShortUrl,
    getAnalytics
};