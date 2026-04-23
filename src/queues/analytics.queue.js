const crypto = require("crypto");
const { Queue } = require("bullmq");
const env = require("../config/env");
const { createBullConnection } = require("../config/bullmq");
const HttpError = require("../utils/http-error");
const { buildVisitorFingerprint, normalizeUserAgent } = require("../utils/visitor");

const ANALYTICS_JOB_NAME = "click-event";

let connection;
let analyticsQueue;

function getAnalyticsQueue() {
    if (!connection) {
        connection = createBullConnection();
    }

    if (!analyticsQueue) {
        analyticsQueue = new Queue(env.queue.analyticsName, {
            connection,
            defaultJobOptions: {
                attempts: env.queue.analyticsAttempts,
                backoff: {
                    type: "exponential",
                    delay: env.queue.analyticsBackoffMs
                },
                removeOnComplete: env.queue.removeOnComplete,
                removeOnFail: env.queue.removeOnFail
            }
        });
    }

    return analyticsQueue;
}

function normalizeAnalyticsPayload(payload) {
    const shortCode = payload?.shortCode?.trim();
    const ipAddress = payload?.ipAddress?.trim();
    const userAgent = normalizeUserAgent(payload?.userAgent);

    if (!shortCode) {
        throw new HttpError(400, "shortCode is required for analytics event");
    }

    if (!ipAddress) {
        throw new HttpError(400, "ipAddress is required for analytics event");
    }

    return {
        shortCode,
        ipAddress,
        userAgent,
        visitorFingerprint: buildVisitorFingerprint({ shortCode, ipAddress, userAgent }),
        countryCode: payload?.countryCode || null,
        countryName: payload?.countryName || null,
        clickedAt: payload?.clickedAt || new Date().toISOString()
    };
}

function buildAnalyticsJobId(payload) {
    const rawKey = `${payload.shortCode}|${payload.ipAddress}|${payload.clickedAt}`;
    return `analytics:${crypto.createHash("sha1").update(rawKey).digest("hex")}`;
}

async function enqueueClickAnalyticsJob(payload) {
    const normalizedPayload = normalizeAnalyticsPayload(payload);
    const jobId = buildAnalyticsJobId(normalizedPayload);
    const queue = getAnalyticsQueue();

    return queue.add(ANALYTICS_JOB_NAME, normalizedPayload, { jobId });
}

async function closeAnalyticsQueue() {
    if (analyticsQueue) {
        await analyticsQueue.close();
        analyticsQueue = null;
    }

    if (connection) {
        await connection.quit();
        connection = null;
    }
}

module.exports = {
    ANALYTICS_JOB_NAME,
    enqueueClickAnalyticsJob,
    closeAnalyticsQueue,
    buildAnalyticsJobId,
    normalizeAnalyticsPayload
};
