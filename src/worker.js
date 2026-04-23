const logger = require("./config/logger");
const { connectDatabase, disconnectDatabase } = require("./config/database");
const { initializeUrlModel } = require("./models/url.model");
const { initializeClickModel } = require("./models/click.model");
const { startAnalyticsWorker, stopAnalyticsWorker } = require("./workers/analytics.worker");

async function bootstrapWorker() {
    await connectDatabase();
    await initializeUrlModel();
    await initializeClickModel();

    startAnalyticsWorker();
    logger.info("Analytics worker started");

    const shutdown = async (signal) => {
        logger.info({ signal }, "Worker graceful shutdown started");
        await Promise.allSettled([stopAnalyticsWorker(), disconnectDatabase()]);
        logger.info("Worker graceful shutdown complete");
        process.exit(0);
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
}

bootstrapWorker().catch((error) => {
    logger.fatal({ err: error }, "Failed to bootstrap analytics worker");
    process.exit(1);
});