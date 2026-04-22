const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const pinoHttp = require("pino-http");
const healthRoutes = require("./routes/health.routes");
const urlRoutes = require("./routes/url.routes");
const { redirectShortUrl } = require("./controllers/url.controller");
const logger = require("./config/logger");
const env = require("./config/env");
const notFoundHandler = require("./middleware/not-found");
const errorHandler = require("./middleware/error-handler");
const rateLimitMiddleware = require("./middleware/rate-limit");

const app = express();

app.use(helmet());
app.use(
    cors({
        origin: env.corsOrigin === "*" ? true : env.corsOrigin
    })
);
app.use(express.json());
app.use(pinoHttp({ logger }));
app.use(rateLimitMiddleware);

app.use("/api", healthRoutes);
app.use("/api", urlRoutes);
app.get("/:shortCode", redirectShortUrl);

app.get("/", (req, res) => {
    res.status(200).json({
        service: env.appName,
        status: "running",
        docs: "/api/health"
    });
});

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
