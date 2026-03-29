const rateLimit = require('express-rate-limit');

// ─── General API limiter ──────────────────────────────────────────────────────
// 100 requests per 15 minutes per IP
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    const retryAfter = Math.ceil(req.rateLimit.resetTime / 1000 - Date.now() / 1000);
    res.set('Retry-After', retryAfter);
    res.status(429).json({
      error: 'Çok fazla istek. Lütfen bekleyin.',
      retryAfter,
    });
  },
});

// ─── Auth limiter ─────────────────────────────────────────────────────────────
// 10 requests per 15 minutes per IP (brute-force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    const retryAfter = Math.ceil(req.rateLimit.resetTime / 1000 - Date.now() / 1000);
    res.set('Retry-After', retryAfter);
    res.status(429).json({
      error: 'Çok fazla istek. Lütfen bekleyin.',
      retryAfter,
    });
  },
});

// ─── Diagram save limiter ─────────────────────────────────────────────────────
// 30 requests per minute per IP
const diagramSaveLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    const retryAfter = Math.ceil(req.rateLimit.resetTime / 1000 - Date.now() / 1000);
    res.set('Retry-After', retryAfter);
    res.status(429).json({
      error: 'Çok fazla istek. Lütfen bekleyin.',
      retryAfter,
    });
  },
});

module.exports = { generalLimiter, authLimiter, diagramSaveLimiter };
