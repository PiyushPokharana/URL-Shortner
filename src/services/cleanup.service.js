const env = require("../config/env");
const logger = require("../config/logger");
const { redis } = require("../config/redis");
const { deleteExpiredUrls } = require("../models/url.model");

const REDIRECT_CACHE_PREFIX = "redirect:";

let cleanupTimer = null;
let cleanupInProgress = false;

function buildRedirectCacheKey(shortCode) {
    return `${REDIRECT_CACHE_PREFIX}${shortCode}`;
}

async function clearRedirectCache(shortCodes) {
    if (!shortCodes.length) {
        return;
    }

    const pipeline = redis.pipeline();

    for (const shortCode of shortCodes) {
        pipeline.del(buildRedirectCacheKey(shortCode));
    }

    await pipeline.exec();
}

async function runExpiredUrlCleanup() {
    if (cleanupInProgress) {
        return { deletedCount: 0, skipped: true };
    }

    cleanupInProgress = true;

    try {
        const deletedShortCodes = await deleteExpiredUrls(env.cleanup.batchSize);
        await clearRedirectCache(deletedShortCodes);

        if (deletedShortCodes.length > 0) {
            logger.info(
                {
                    deletedCount: deletedShortCodes.length
                },
                "Expired URL cleanup finished"
            );
        }

        return { deletedCount: deletedShortCodes.length, skipped: false };
    } catch (error) {
        logger.error({ err: error }, "Expired URL cleanup failed");
        return { deletedCount: 0, skipped: false };
    } finally {
        cleanupInProgress = false;
    }
}

function startExpiredUrlCleanupJob() {
    if (!env.cleanup.enabled || cleanupTimer) {
        return;
    }

    const intervalMs = Math.max(15_000, env.cleanup.intervalSeconds * 1000);
    cleanupTimer = setInterval(() => {
        void runExpiredUrlCleanup();
    }, intervalMs);

    if (env.cleanup.runOnStartup) {
        void runExpiredUrlCleanup();
    }

    logger.info(
        {
            intervalSeconds: env.cleanup.intervalSeconds,
            batchSize: env.cleanup.batchSize
        },
        "Expired URL cleanup scheduler started"
    );
}

function stopExpiredUrlCleanupJob() {
    if (!cleanupTimer) {
        return;
    }

    clearInterval(cleanupTimer);
    cleanupTimer = null;
    logger.info("Expired URL cleanup scheduler stopped");
}

module.exports = {
    startExpiredUrlCleanupJob,
    stopExpiredUrlCleanupJob,
    runExpiredUrlCleanup
};