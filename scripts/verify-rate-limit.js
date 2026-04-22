/* eslint-disable no-console */
process.env.RATE_LIMIT_REQUESTS_PER_MINUTE = "5";
process.env.RATE_LIMIT_WINDOW_SECONDS = "20";

const { redis } = require("../src/config/redis");
const env = require("../src/config/env");
const rateLimitMiddleware = require("../src/middleware/rate-limit");

const originalRedis = {
    incr: redis.incr.bind(redis),
    expire: redis.expire.bind(redis),
    ttl: redis.ttl.bind(redis)
};

let fakeNowMs = Date.now();
const rateLimitStore = new Map();

function getEntry(key) {
    const existing = rateLimitStore.get(key);

    if (!existing) {
        return null;
    }

    if (existing.expiresAtMs <= fakeNowMs) {
        rateLimitStore.delete(key);
        return null;
    }

    return existing;
}

redis.incr = async (key) => {
    const entry = getEntry(key);

    if (!entry) {
        const newEntry = {
            value: 1,
            expiresAtMs: fakeNowMs + env.rateLimit.windowSeconds * 1000
        };
        rateLimitStore.set(key, newEntry);
        return newEntry.value;
    }

    entry.value += 1;
    return entry.value;
};

redis.expire = async (key, seconds) => {
    const entry = getEntry(key);
    if (!entry) {
        return 0;
    }

    entry.expiresAtMs = fakeNowMs + Number(seconds) * 1000;
    return 1;
};

redis.ttl = async (key) => {
    const entry = getEntry(key);
    if (!entry) {
        return -2;
    }

    return Math.max(0, Math.ceil((entry.expiresAtMs - fakeNowMs) / 1000));
};

function buildReq(path = "/", ip = "127.0.0.1") {
    return {
        path,
        ip,
        socket: { remoteAddress: ip },
        log: {
            warn: () => undefined
        }
    };
}

function buildRes() {
    return {
        statusCode: 200,
        headers: {},
        body: null,
        setHeader(name, value) {
            this.headers[name] = String(value);
        },
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(payload) {
            this.body = payload;
            return this;
        }
    };
}

async function invoke(path = "/", ip = "127.0.0.1") {
    const req = buildReq(path, ip);
    const res = buildRes();
    let nextCalled = false;

    await rateLimitMiddleware(req, res, () => {
        nextCalled = true;
    });

    return {
        nextCalled,
        statusCode: res.statusCode,
        jsonBody: res.body,
        headers: {
            "X-RateLimit-Limit": res.headers["X-RateLimit-Limit"],
            "X-RateLimit-Remaining": res.headers["X-RateLimit-Remaining"],
            "X-RateLimit-Reset": res.headers["X-RateLimit-Reset"],
            "Retry-After": res.headers["Retry-After"]
        }
    };
}

async function main() {
    try {
        const normalTraffic = [];
        for (let i = 0; i < 3; i += 1) {
            normalTraffic.push(await invoke("/"));
        }

        const burstTraffic = [];
        for (let i = 0; i < 5; i += 1) {
            burstTraffic.push(await invoke("/"));
        }

        const firstBlockedSample = burstTraffic.find((sample) => sample.statusCode === 429);

        fakeNowMs += (env.rateLimit.windowSeconds + 1) * 1000;
        const afterReset = await invoke("/");
        const healthBypass = await invoke("/api/health");

        const report = {
            config: {
                limitPerMinute: env.rateLimit.requestsPerMinute,
                windowSeconds: env.rateLimit.windowSeconds
            },
            normalTrafficStatuses: normalTraffic.map((sample) => sample.statusCode),
            burstTrafficStatuses: burstTraffic.map((sample) => sample.statusCode),
            firstBlockedSample,
            afterResetStatus: afterReset.statusCode,
            healthBypassStatus: healthBypass.statusCode
        };

        console.log(JSON.stringify(report, null, 2));

        const pass =
            report.normalTrafficStatuses.every((status) => status !== 429) &&
            report.burstTrafficStatuses.filter((status) => status === 429).length >= 1 &&
            report.firstBlockedSample &&
            report.firstBlockedSample.jsonBody?.message === "Too Many Requests" &&
            report.firstBlockedSample.headers["Retry-After"] &&
            report.afterResetStatus !== 429;

        if (!pass) {
            console.log("RATE_LIMIT_VERIFICATION: FAIL");
            process.exitCode = 1;
            return;
        }

        console.log("RATE_LIMIT_VERIFICATION: PASS");
    } finally {
        redis.incr = originalRedis.incr;
        redis.expire = originalRedis.expire;
        redis.ttl = originalRedis.ttl;
    }
}

main().catch((error) => {
    console.error(error);
    redis.incr = originalRedis.incr;
    redis.expire = originalRedis.expire;
    redis.ttl = originalRedis.ttl;
    process.exit(1);
});
