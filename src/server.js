const app = require("./app");
const env = require("./config/env");
const logger = require("./config/logger");
const { connectDatabase, disconnectDatabase } = require("./config/database");
const { connectRedis, disconnectRedis } = require("./config/redis");
const { initializeUrlModel } = require("./models/url.model");
const { initializeClickModel } = require("./models/click.model");

async function bootstrap() {
    await connectDatabase();
    await initializeUrlModel();
    await initializeClickModel();
    await connectRedis();

    const server = app.listen(env.port, () => {
        logger.info({ port: env.port }, "Server is running");
    });

    const shutdown = async (signal) => {
        logger.info({ signal }, "Graceful shutdown started");

        server.close(async () => {
            await Promise.allSettled([disconnectDatabase(), disconnectRedis()]);
            logger.info("Graceful shutdown complete");
            process.exit(0);
        });
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
}

bootstrap().catch((error) => {
    logger.fatal({ err: error }, "Failed to bootstrap application");
    process.exit(1);
});
