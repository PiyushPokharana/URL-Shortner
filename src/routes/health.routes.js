const express = require("express");
const { health, deepHealth } = require("../controllers/health.controller");

const router = express.Router();

router.get("/health", health);
router.get("/health/deep", deepHealth);

module.exports = router;
