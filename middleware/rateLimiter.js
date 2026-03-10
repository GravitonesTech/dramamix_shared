const { safeGet, safeSet } = require('../common/redis');

const BUCKET_TTL = 120;

async function getTokenBucket(key, maxTokens, refillRatePerMs) {
  const raw = await safeGet(key);
  if (raw) {
    try {
      const bucket = typeof raw === 'string' ? JSON.parse(raw) : raw;
      const now = Date.now();
      const elapsed = now - bucket.lastRefill;
      const tokensToAdd = elapsed * refillRatePerMs;
      bucket.tokens = Math.min(maxTokens, bucket.tokens + tokensToAdd);
      bucket.lastRefill = now;
      return bucket;
    } catch (e) {}
  }
  return { tokens: maxTokens, lastRefill: Date.now() };
}

async function saveTokenBucket(key, bucket) {
  await safeSet(key, JSON.stringify(bucket), { ex: BUCKET_TTL });
}

function rateLimiter(options = {}) {
  const {
    windowMs = 60000,
    maxRequests = 60,
    keyPrefix = 'lb',
    message = 'Too many requests, please try again later',
  } = options;

  const refillRatePerMs = maxRequests / windowMs;

  return async (req, res, next) => {
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
      || req.headers['x-real-ip']
      || req.connection?.remoteAddress
      || 'unknown';

    let userId = null;
    try {
      const authHeader = req.headers.authorization || req.headers.Authorization;
      if (authHeader) {
        const token = authHeader.split(' ')[1];
        if (token) {
          const parts = token.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
            if (payload?.userdata?.id) userId = payload.userdata.id;
          }
        }
      }
    } catch (e) {}

    const ipKey = `${keyPrefix}:ip:${ip}`;
    const ipBucket = await getTokenBucket(ipKey, maxRequests, refillRatePerMs);

    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, Math.floor(ipBucket.tokens - 1)));
    res.setHeader('X-RateLimit-Reset', Math.ceil((Date.now() + windowMs) / 1000));

    if (ipBucket.tokens < 1) {
      const retryAfter = Math.ceil((1 - ipBucket.tokens) / refillRatePerMs / 1000);
      return res.status(429).json({
        responseCode: 'RATE_LIMIT_EXCEEDED',
        responseMessage: message,
        responseData: { retryAfter },
      });
    }

    ipBucket.tokens -= 1;
    await saveTokenBucket(ipKey, ipBucket);

    if (userId) {
      const userKey = `${keyPrefix}:user:${userId}`;
      const userMaxRequests = maxRequests * 5;
      const userRefillRate = userMaxRequests / windowMs;
      const userBucket = await getTokenBucket(userKey, userMaxRequests, userRefillRate);

      if (userBucket.tokens < 1) {
        return res.status(429).json({
          responseCode: 'RATE_LIMIT_EXCEEDED',
          responseMessage: message,
          responseData: { retryAfter: Math.ceil((1 - userBucket.tokens) / userRefillRate / 1000) },
        });
      }

      userBucket.tokens -= 1;
      await saveTokenBucket(userKey, userBucket);
    }

    next();
  };
}

module.exports = { rateLimiter };
