const { extractGeoDataFromHeaders } = require("../src/utils/geo");

describe("extractGeoDataFromHeaders", () => {
    test("extracts normalized geo values when supported headers exist", () => {
        const result = extractGeoDataFromHeaders({
            "cf-ipcountry": "in",
            "x-vercel-ip-country-name": "India"
        });

        expect(result).toEqual({
            countryCode: "IN",
            countryName: "India"
        });
    });

    test("returns null values when headers are absent", () => {
        const result = extractGeoDataFromHeaders({});

        expect(result).toEqual({
            countryCode: null,
            countryName: null
        });
    });
});
