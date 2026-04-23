const { Worker } = require("bullmq");
const env = require("../config/env");
const logger = require("../config/logger");
const { createBullConnection } = require("../config/bullmq");
const { createClickEvent } = require("../models/click.model");
const { ANALYTICS_JOB_NAME, normalizeAnalyticsPayload } = require("../queues/analytics.queue");

let worker;
let workerConnection;

async function processAnalyticsJob(job) {
    if (job.name !== ANALYTICS_JOB_NAME) {
        throw new Error(`Unsupported analytics job type: ${job.name}`);
    }

    const payload = normalizeAnalyticsPayload(job.data);

    return createClickEvent({
        shortCode: payload.shortCode,
        ipAddress: payload.ipAddress,
        visitorFingerprint: payload.visitorFingerprint,
        countryCode: payload.countryCode,
        countryName: payload.countryName,
        clickedAt: payload.clickedAt
    });
}

function startAnalyticsWorker() {
    if (worker) {
        return worker;
    }

    workerConnection = createBullConnection();

    worker = new Worker(env.queue.analyticsName, processAnalyticsJob, {
        connection: workerConnection,
        concurrency: env.queue.analyticsConcurrency
    });

    worker.on("completed", (job) => {
        logger.info({ jobId: job.id, queue: env.queue.analyticsName }, "Analytics job completed");
    });

    worker.on("failed", (job, error) => {
        logger.error(
            {
                err: error,
                jobId: job?.id,
                attemptsMade: job?.attemptsMade,
                queue: env.queue.analyticsName
            },
            "Analytics job failed"
        );
    });

    return worker;
}

async function stopAnalyticsWorker() {
    if (worker) {
        await worker.close();
        worker = null;
    }

    if (workerConnection) {
        await workerConnection.quit();
        workerConnection = null;
    }
}

module.exports = {
    processAnalyticsJob,
    startAnalyticsWorker,
    stopAnalyticsWorker
};
