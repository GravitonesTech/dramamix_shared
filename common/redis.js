const { Redis } = require('@upstash/redis');

let redis = null;
let isConnected = false;
let connectionError = null;

function getRedisClient() {
  if (redis) return redis;

  let url = process.env.UPSTASH_REDIS_REST_URL;
  let token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.warn('[Redis] UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN not set - Redis disabled');
    return null;
  }

  if (!url.startsWith('https://') && token.startsWith('https://')) {
    const temp = url;
    url = token;
    token = temp;
  }

  try {
    redis = new Redis({ url, token });
    isConnected = true;
    console.log('[Redis] Upstash Redis client initialized');
    return redis;
  } catch (err) {
    connectionError = err.message;
    console.error('[Redis] Failed to initialize:', err.message);
    return null;
  }
}

async function safeGet(key) {
  try {
    const client = getRedisClient();
    if (!client) return null;
    return await client.get(key);
  } catch (err) {
    console.error('[Redis] GET error:', err.message);
    return null;
  }
}

async function safeSet(key, value, options = {}) {
  try {
    const client = getRedisClient();
    if (!client) return false;
    if (options.ex) {
      await client.set(key, value, { ex: options.ex });
    } else {
      await client.set(key, value);
    }
    return true;
  } catch (err) {
    console.error('[Redis] SET error:', err.message);
    return false;
  }
}

async function safeDel(key) {
  try {
    const client = getRedisClient();
    if (!client) return false;
    await client.del(key);
    return true;
  } catch (err) {
    console.error('[Redis] DEL error:', err.message);
    return false;
  }
}

async function safeIncr(key) {
  try {
    const client = getRedisClient();
    if (!client) return null;
    return await client.incr(key);
  } catch (err) {
    console.error('[Redis] INCR error:', err.message);
    return null;
  }
}

async function safeExpire(key, seconds) {
  try {
    const client = getRedisClient();
    if (!client) return false;
    await client.expire(key, seconds);
    return true;
  } catch (err) {
    console.error('[Redis] EXPIRE error:', err.message);
    return false;
  }
}

async function safeSadd(key, ...members) {
  try {
    const client = getRedisClient();
    if (!client) return false;
    await client.sadd(key, ...members);
    return true;
  } catch (err) {
    console.error('[Redis] SADD error:', err.message);
    return false;
  }
}

async function safeScard(key) {
  try {
    const client = getRedisClient();
    if (!client) return 0;
    return await client.scard(key);
  } catch (err) {
    console.error('[Redis] SCARD error:', err.message);
    return 0;
  }
}

async function safeSrem(key, ...members) {
  try {
    const client = getRedisClient();
    if (!client) return false;
    await client.srem(key, ...members);
    return true;
  } catch (err) {
    console.error('[Redis] SREM error:', err.message);
    return false;
  }
}

async function safeSmembers(key) {
  try {
    const client = getRedisClient();
    if (!client) return [];
    return await client.smembers(key);
  } catch (err) {
    console.error('[Redis] SMEMBERS error:', err.message);
    return [];
  }
}

async function safeTtl(key) {
  try {
    const client = getRedisClient();
    if (!client) return -1;
    return await client.ttl(key);
  } catch (err) {
    console.error('[Redis] TTL error:', err.message);
    return -1;
  }
}

async function safeDelPattern(pattern) {
  try {
    const client = getRedisClient();
    if (!client) return 0;
    let cursor = 0;
    let deleted = 0;
    do {
      const [nextCursor, keys] = await client.scan(cursor, { match: pattern, count: 200 });
      cursor = parseInt(nextCursor, 10);
      if (keys && keys.length > 0) {
        await client.del(...keys);
        deleted += keys.length;
      }
    } while (cursor !== 0);
    if (deleted > 0) {
      console.log(`[Redis] DEL pattern "${pattern}" — removed ${deleted} key(s)`);
    }
    return deleted;
  } catch (err) {
    console.error('[Redis] DEL pattern error:', err.message);
    return 0;
  }
}

async function testConnection() {
  try {
    const client = getRedisClient();
    if (!client) return { connected: false, error: 'Client not initialized' };
    const pong = await client.ping();
    return { connected: pong === 'PONG', latency: 'ok' };
  } catch (err) {
    return { connected: false, error: err.message };
  }
}

module.exports = {
  getRedisClient,
  safeGet,
  safeSet,
  safeDel,
  safeDelPattern,
  safeIncr,
  safeExpire,
  safeSadd,
  safeScard,
  safeSrem,
  safeSmembers,
  safeTtl,
  testConnection,
};
