const asyncHandler = require("../utils/async-handler");
const { getDeepHealth } = require("../services/health.service");

const health = asyncHandler(async (req, res) => {
    res.status(200).json({ status: "ok", service: "url-shortener-service" });
});

const deepHealth = asyncHandler(async (req, res) => {
    const report = await getDeepHealth();
    const statusCode = report.status === "ok" ? 200 : 503;
    res.status(statusCode).json(report);
});

module.exports = {
    health,
    deepHealth
};
