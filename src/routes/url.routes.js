const express = require("express");
const { shortenUrl, redirectShortUrl } = require("../controllers/url.controller");

const router = express.Router();

router.post("/shorten", shortenUrl);
router.get("/:shortCode", redirectShortUrl);

module.exports = router;