const asyncHandler = require("../utils/async-handler");
const { createShortUrl, resolveRedirectTarget } = require("../services/url.service");

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

    try {
        const redirectTarget = await resolveRedirectTarget(shortCode);
        redirectSource = redirectTarget.source;

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

module.exports = {
    shortenUrl,
    redirectShortUrl
};