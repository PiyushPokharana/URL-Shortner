const express = require("express");
const { shortenUrl, redirectShortUrl, getAnalytics } = require("../controllers/url.controller");

const router = express.Router();

router.post("/shorten", shortenUrl);
router.get("/analytics/:shortCode", getAnalytics);
router.get("/:shortCode", redirectShortUrl);

module.exports = router;