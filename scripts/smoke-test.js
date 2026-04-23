/* eslint-disable no-console */

const deployedBaseUrl = process.argv[2] || process.env.DEPLOYED_BASE_URL;

if (!deployedBaseUrl) {
    console.error("Usage: node scripts/smoke-test.js <base-url>");
    console.error("Or set DEPLOYED_BASE_URL env variable.");
    process.exit(1);
}

const baseUrl = deployedBaseUrl.replace(/\/+$/, "");

async function assertJsonGet(path) {
    const res = await fetch(`${baseUrl}${path}`);
    if (!res.ok) {
        throw new Error(`GET ${path} failed with status ${res.status}`);
    }

    const body = await res.json();
    return { res, body };
}

async function run() {
    console.log(`Running smoke test against ${baseUrl}`);

    const health = await assertJsonGet("/api/health");
    if (health.body.status !== "ok") {
        throw new Error("/api/health returned unexpected payload");
    }

    const deepHealth = await fetch(`${baseUrl}/api/health/deep`);
    if (deepHealth.status !== 200) {
        throw new Error(`/api/health/deep failed with status ${deepHealth.status}`);
    }

    const uniqueAlias = `smoke-${Date.now()}`;
    const shortenRes = await fetch(`${baseUrl}/api/shorten`, {
        method: "POST",
        headers: {
            "content-type": "application/json"
        },
        body: JSON.stringify({
            url: "https://example.com/smoke-test",
            customAlias: uniqueAlias
        })
    });

    if (shortenRes.status !== 201) {
        throw new Error(`POST /api/shorten failed with status ${shortenRes.status}`);
    }

    const shortenBody = await shortenRes.json();
    const shortCode = shortenBody?.data?.shortCode;
    if (!shortCode) {
        throw new Error("Shorten response did not include shortCode");
    }

    const redirectRes = await fetch(`${baseUrl}/${shortCode}`, {
        redirect: "manual"
    });
    if (redirectRes.status !== 302) {
        throw new Error(`GET /${shortCode} expected 302, got ${redirectRes.status}`);
    }

    const analyticsRes = await fetch(`${baseUrl}/api/analytics/${shortCode}`);
    if (!analyticsRes.ok) {
        throw new Error(`GET /api/analytics/${shortCode} failed with status ${analyticsRes.status}`);
    }

    console.log("Smoke test passed");
    console.log(`Validated shortCode: ${shortCode}`);
}

run().catch((error) => {
    console.error(error.message);
    process.exit(1);
});
