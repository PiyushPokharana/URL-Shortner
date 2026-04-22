/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");
const autocannon = require("autocannon");

process.env.RATE_LIMIT_ENABLED = "false";
process.env.LOG_LEVEL = "fatal";

const app = require("../src/app");

function getMetricValue(metricObject, keys, fallback = null) {
    for (const key of keys) {
        const value = metricObject?.[key];
        if (typeof value === "number") {
            return value;
        }
    }

    return fallback;
}

function runAutocannon(options) {
    return new Promise((resolve, reject) => {
        autocannon(options, (error, result) => {
            if (error) {
                reject(error);
                return;
            }

            resolve(result);
        });
    });
}

async function main() {
    const server = app.listen(0);

    await new Promise((resolve) => {
        server.once("listening", resolve);
    });

    const port = server.address().port;
    const duration = 10;
    const connections = 30;
    const targetUrl = `http://127.0.0.1:${port}/api/health`;

    try {
        console.log(`Running load test against ${targetUrl}`);

        const result = await runAutocannon({
            url: targetUrl,
            method: "GET",
            duration,
            connections,
            pipelining: 1
        });

        const report = {
            generatedAt: new Date().toISOString(),
            targetUrl,
            durationSeconds: duration,
            connections,
            requests: {
                averagePerSecond: result.requests.average,
                p95PerSecond: getMetricValue(result.requests, ["p95", "p99"]),
                total: result.requests.total
            },
            latency: {
                averageMs: result.latency.average,
                p50Ms: result.latency.p50,
                p95Ms: getMetricValue(result.latency, ["p95", "p97_5", "p99"]),
                p99Ms: result.latency.p99,
                maxMs: result.latency.max
            },
            throughput: {
                averageBytesPerSecond: result.throughput.average,
                totalBytes: result.throughput.total
            },
            non2xxResponses: result.non2xx || 0,
            errors: result.errors || 0,
            timeouts: result.timeouts || 0
        };

        const docsDir = path.join(__dirname, "..", "docs");
        fs.mkdirSync(docsDir, { recursive: true });

        const jsonPath = path.join(docsDir, "load-test-report.json");
        const mdPath = path.join(docsDir, "load-test-report.md");

        fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

        const markdown = [
            "# Load Test Evidence",
            "",
            `- Generated: ${report.generatedAt}`,
            `- Target: ${report.targetUrl}`,
            `- Duration: ${report.durationSeconds}s`,
            `- Connections: ${report.connections}`,
            "",
            "## Results",
            "",
            `- Requests/sec (avg): ${report.requests.averagePerSecond}`,
            `- Requests/sec (p95): ${report.requests.p95PerSecond}`,
            `- Total requests: ${report.requests.total}`,
            `- Latency p50: ${report.latency.p50Ms} ms`,
            `- Latency p95: ${report.latency.p95Ms} ms`,
            `- Latency p99: ${report.latency.p99Ms} ms`,
            `- Non-2xx responses: ${report.non2xxResponses}`,
            `- Errors: ${report.errors}`,
            `- Timeouts: ${report.timeouts}`,
            ""
        ].join("\n");

        fs.writeFileSync(mdPath, markdown, "utf8");

        console.log("Load test report generated:");
        console.log(`- ${jsonPath}`);
        console.log(`- ${mdPath}`);
    } finally {
        await new Promise((resolve) => {
            server.close(resolve);
        });
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
