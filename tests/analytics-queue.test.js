const {
    buildAnalyticsJobId,
    normalizeAnalyticsPayload
} = require("../src/queues/analytics.queue");

describe("analytics queue helpers", () => {
    test("normalizes payload and trims required fields", () => {
        const payload = normalizeAnalyticsPayload({
            shortCode: " abc123 ",
            ipAddress: " 127.0.0.1 ",
            countryCode: "IN",
            countryName: "India",
            clickedAt: "2026-04-22T00:00:00.000Z"
        });

        expect(payload).toEqual({
            shortCode: "abc123",
            ipAddress: "127.0.0.1",
            userAgent: "unknown",
            visitorFingerprint: expect.any(String),
            countryCode: "IN",
            countryName: "India",
            clickedAt: "2026-04-22T00:00:00.000Z"
        });
    });

    test("buildAnalyticsJobId is deterministic for the same event", () => {
        const payload = {
            shortCode: "abc123",
            ipAddress: "127.0.0.1",
            clickedAt: "2026-04-22T00:00:00.000Z"
        };

        const idOne = buildAnalyticsJobId(payload);
        const idTwo = buildAnalyticsJobId(payload);

        expect(idOne).toBe(idTwo);
        expect(idOne.startsWith("analytics:")).toBe(true);
    });
});
