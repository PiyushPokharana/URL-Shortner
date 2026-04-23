jest.mock("../src/models/url.model", () => ({
    deleteExpiredUrls: jest.fn().mockResolvedValue(["abc123", "xyz789"])
}));

jest.mock("../src/config/redis", () => ({
    redis: {
        pipeline: jest.fn(() => {
            const calls = [];
            return {
                del: jest.fn((key) => calls.push(key)),
                exec: jest.fn().mockResolvedValue(calls.map(() => [null, 1]))
            };
        })
    }
}));

jest.mock("../src/config/env", () => ({
    cleanup: {
        enabled: true,
        intervalSeconds: 300,
        batchSize: 1000,
        runOnStartup: false
    }
}));

const { deleteExpiredUrls } = require("../src/models/url.model");
const { redis } = require("../src/config/redis");
const { runExpiredUrlCleanup } = require("../src/services/cleanup.service");

describe("cleanup service", () => {
    test("deletes expired urls and clears redirect cache", async () => {
        const result = await runExpiredUrlCleanup();

        expect(result).toEqual({ deletedCount: 2, skipped: false });
        expect(deleteExpiredUrls).toHaveBeenCalledWith(1000);
        expect(redis.pipeline).toHaveBeenCalled();
    });
});