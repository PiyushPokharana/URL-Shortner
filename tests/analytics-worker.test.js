jest.mock("../src/models/click.model", () => ({
    createClickEvent: jest.fn()
}));

const { createClickEvent } = require("../src/models/click.model");
const { processAnalyticsJob } = require("../src/workers/analytics.worker");
const { buildVisitorFingerprint } = require("../src/utils/visitor");

describe("analytics worker", () => {
    test("processes click-event jobs and persists click record", async () => {
        createClickEvent.mockResolvedValue({ id: 10 });

        await processAnalyticsJob({
            name: "click-event",
            data: {
                shortCode: "abc123",
                ipAddress: "127.0.0.1",
                userAgent: "Mozilla/5.0",
                countryCode: "IN",
                countryName: "India",
                clickedAt: "2026-04-22T00:00:00.000Z"
            }
        });

        expect(createClickEvent).toHaveBeenCalledWith({
            shortCode: "abc123",
            ipAddress: "127.0.0.1",
            visitorFingerprint: buildVisitorFingerprint({
                shortCode: "abc123",
                ipAddress: "127.0.0.1",
                userAgent: "Mozilla/5.0"
            }),
            countryCode: "IN",
            countryName: "India",
            clickedAt: "2026-04-22T00:00:00.000Z"
        });
    });

    test("rejects unsupported job names", async () => {
        await expect(
            processAnalyticsJob({
                name: "unsupported",
                data: {
                    shortCode: "abc123",
                    ipAddress: "127.0.0.1"
                }
            })
        ).rejects.toThrow("Unsupported analytics job type");
    });
});
