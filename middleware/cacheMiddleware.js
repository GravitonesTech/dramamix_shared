const { safeGet, safeSet, safeDelPattern } = require('../common/redis');

function cacheMiddleware(options = {}) {
  const {
    ttl = 60,
    keyPrefix = 'cache',
    keyBuilder = null,
    personalized = false,
  } = options;

  return async (req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'POST') {
      return next();
    }

    let cacheKey;
    if (keyBuilder) {
      cacheKey = keyBuilder(req);
    } else {
      const userId = personalized && req.requestContext?.authorizer?.id
        ? `:u${req.requestContext.authorizer.id}`
        : '';
      const queryString = Object.keys(req.query).length > 0
        ? ':' + Buffer.from(JSON.stringify(req.query)).toString('base64').substring(0, 40)
        : '';
      const bodyString = req.method === 'POST' && req.body
        ? ':' + Buffer.from(JSON.stringify(req.body)).toString('base64').substring(0, 40)
        : '';
      cacheKey = `${keyPrefix}:${req.originalUrl.split('?')[0]}${userId}${queryString}${bodyString}`;
    }

    const cached = await safeGet(cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(cached);
    }

    const originalJson = res.json.bind(res);
    res.json = (data) => {
      if (res.statusCode >= 200 && res.statusCode < 300 && data) {
        safeSet(cacheKey, data, { ex: ttl }).catch(() => {});
      }
      res.setHeader('X-Cache', 'MISS');
      return originalJson(data);
    };

    next();
  };
}

function invalidateCache(...prefixes) {
  const prefixList = prefixes.flat();
  return (req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = (data) => {
      const result = originalJson(data);
      if (res.statusCode >= 200 && res.statusCode < 300) {
        Promise.allSettled(
          prefixList.map(p => safeDelPattern(`${p}:*`))
        ).catch(() => {});
      }
      return result;
    };
    next();
  };
}

module.exports = { cacheMiddleware, invalidateCache };
