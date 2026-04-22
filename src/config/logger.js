const pino = require("pino");
const env = require("./env");

const logger = pino({
    name: env.appName,
    level: process.env.LOG_LEVEL || "info",
    base: {
        env: env.nodeEnv
    }
});

module.exports = logger;
