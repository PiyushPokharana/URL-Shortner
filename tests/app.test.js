const request = require("supertest");

jest.mock("../src/middleware/rate-limit", () => {
    return (req, res, next) => next();
});

jest.mock("../src/services/url.service", () => ({
    createShortUrl: jest.fn(),
    resolveRedirectTarget: jest.fn()
}));

jest.mock("../src/services/analytics.service", () => ({
    getShortCodeAnalytics: jest.fn()
}));

jest.mock("../src/queues/analytics.queue", () => ({
    enqueueClickAnalyticsJob: jest.fn()
}));

const { createShortUrl, resolveRedirectTarget } = require("../src/services/url.service");
const { getShortCodeAnalytics } = require("../src/services/analytics.service");
const { enqueueClickAnalyticsJob } = require("../src/queues/analytics.queue");
const app = require("../src/app");

describe("API routes", () => {
    test("POST /api/shorten returns 201 with generated short URL data", async () => {
        createShortUrl.mockResolvedValue({
            id: 42,
            original_url: "https://example.com",
            short_code: "abc123",
            created_at: "2026-04-22T12:00:00.000Z",
            expiry_at: null
        });

        const response = await request(app).post("/api/shorten").send({
            url: "https://example.com"
        });

        expect(response.statusCode).toBe(201);
        expect(response.body.message).toBe("Short URL created");
        expect(response.body.data.shortCode).toBe("abc123");
        expect(createShortUrl).toHaveBeenCalledWith({
            url: "https://example.com"
        });
    });

    test("GET /:shortCode redirects and triggers analytics tracking", async () => {
        resolveRedirectTarget.mockResolvedValue({
            originalUrl: "https://example.com",
            source: "cache"
        });
        enqueueClickAnalyticsJob.mockResolvedValue({ id: "job-1" });

        const response = await request(app)
            .get("/abc123")
            .set("cf-ipcountry", "IN")
            .set("x-vercel-ip-country-name", "India");

        expect(response.statusCode).toBe(302);
        expect(response.headers.location).toBe("https://example.com");
        expect(enqueueClickAnalyticsJob).toHaveBeenCalledWith(
            expect.objectContaining({
                shortCode: "abc123",
                ipAddress: expect.any(String),
                countryCode: "IN",
                countryName: "India",
                clickedAt: expect.any(String)
            })
        );
    });

    test("GET /api/analytics/:shortCode returns analytics summary", async () => {
        getShortCodeAnalytics.mockResolvedValue({
            shortCode: "abc123",
            totalClicks: 9,
            uniqueUsers: 4,
            firstClickedAt: "2026-04-22T08:00:00.000Z",
            lastClickedAt: "2026-04-22T10:00:00.000Z",
            recentEvents: []
        });

        const response = await request(app).get("/api/analytics/abc123");

        expect(response.statusCode).toBe(200);
        expect(response.body.message).toBe("Analytics fetched");
        expect(response.body.data.totalClicks).toBe(9);
        expect(getShortCodeAnalytics).toHaveBeenCalledWith("abc123");
    });
});
