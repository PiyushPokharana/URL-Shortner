const logger = require("../config/logger");

function errorHandler(error, req, res, next) {
    logger.error(
        {
            err: error,
            route: req.originalUrl,
            method: req.method
        },
        "Unhandled request error"
    );

    const statusCode = error.statusCode || 500;
    const message = statusCode === 500 ? "Internal server error" : error.message;

    res.status(statusCode).json({ message });
}

module.exports = errorHandler;
