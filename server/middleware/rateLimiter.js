import rateLimit from 'express-rate-limit';

/**
 * Rate Limiter for Authentication endpoints (login, registration, demo auth)
 * Restricts brute force attacks by limiting attempts per IP
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 25 : 500, // 25 attempts per 15 mins in production, 500 in dev/test
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.',
  },
});

/**
 * Rate Limiter for Document and Proof Upload endpoints
 * Protects against disk exhaustion and upload denial-of-service
 */
export const uploadRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 35 : 500, // 35 uploads per 15 mins in production, 500 in dev/test
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Upload rate limit exceeded. Please try again after 15 minutes.',
  },
});

/**
 * General API Rate Limiter
 * Applied globally to prevent abusive scraping and request flooding
 */
export const generalApiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: process.env.NODE_ENV === 'test' ? 5000 : 400, // 400 requests per minute in production
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP. Please slow down.',
  },
});
