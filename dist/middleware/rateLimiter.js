"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimit = void 0;
const rate_limiter_flexible_1 = require("rate-limiter-flexible");
const rateLimiter = new rate_limiter_flexible_1.RateLimiterMemory({
    points: 100,
    duration: 15 * 60
});
const rateLimit = (req, res, next) => {
    var _a, _b;
    rateLimiter
        .consume((_b = (_a = req.ip) !== null && _a !== void 0 ? _a : req.socket.remoteAddress) !== null && _b !== void 0 ? _b : "unknown")
        .then(() => {
        next();
    })
        .catch(() => {
        res.status(429).send("Too Many Requests");
    });
};
exports.rateLimit = rateLimit;
