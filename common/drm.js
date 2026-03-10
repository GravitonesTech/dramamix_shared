const crypto = require('crypto');
const { safeGet, safeSet } = require('./redis');

const KEY_TTL = 365 * 24 * 60 * 60;

function generateAesKey() {
  return crypto.randomBytes(16);
}

function generateKeyId() {
  return crypto.randomBytes(16).toString('hex');
}

async function getOrCreateEpisodeKey(episodeId) {
  const redisKey = `drm:key:${episodeId}`;
  const existing = await safeGet(redisKey);

  if (existing) {
    const parsed = typeof existing === 'string' ? JSON.parse(existing) : existing;
    return {
      keyHex: parsed.keyHex,
      keyId: parsed.keyId,
      iv: parsed.iv,
      keyBytes: Buffer.from(parsed.keyHex, 'hex'),
    };
  }

  const keyBytes = generateAesKey();
  const keyHex = keyBytes.toString('hex');
  const keyId = generateKeyId();
  const iv = crypto.randomBytes(16).toString('hex');

  await safeSet(redisKey, JSON.stringify({ keyHex, keyId, iv }), { ex: KEY_TTL });

  return { keyHex, keyId, iv, keyBytes };
}

async function getEpisodeKey(episodeId) {
  const redisKey = `drm:key:${episodeId}`;
  const existing = await safeGet(redisKey);
  if (!existing) return null;
  const parsed = typeof existing === 'string' ? JSON.parse(existing) : existing;
  return {
    keyHex: parsed.keyHex,
    keyId: parsed.keyId,
    iv: parsed.iv,
    keyBytes: Buffer.from(parsed.keyHex, 'hex'),
  };
}

async function revokeEpisodeKey(episodeId) {
  const { safeDel } = require('./redis');
  await safeDel(`drm:key:${episodeId}`);
}

async function proxyWidevine(licenseRequestBuffer, token) {
  const licenseUrl = process.env.WIDEVINE_LICENSE_URL;
  const apiKey = process.env.WIDEVINE_API_KEY;

  if (!licenseUrl) {
    throw new Error('WIDEVINE_LICENSE_URL is not configured');
  }

  const https = require('https');
  const url = new URL(licenseUrl);

  const options = {
    hostname: url.hostname,
    port: url.port || 443,
    path: url.pathname + url.search,
    method: 'POST',
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Length': licenseRequestBuffer.length,
      ...(apiKey ? { 'X-Goog-Api-Key': apiKey } : {}),
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve({ statusCode: res.statusCode, body: Buffer.concat(chunks) }));
    });
    req.on('error', reject);
    req.write(licenseRequestBuffer);
    req.end();
  });
}

async function proxyFairPlay(spcBuffer) {
  const licenseUrl = process.env.FAIRPLAY_LICENSE_URL;

  if (!licenseUrl) {
    throw new Error('FAIRPLAY_LICENSE_URL is not configured');
  }

  const https = require('https');
  const url = new URL(licenseUrl);

  const options = {
    hostname: url.hostname,
    port: url.port || 443,
    path: url.pathname + url.search,
    method: 'POST',
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Length': spcBuffer.length,
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve({ statusCode: res.statusCode, body: Buffer.concat(chunks) }));
    });
    req.on('error', reject);
    req.write(spcBuffer);
    req.end();
  });
}

function getFairPlayCertificate() {
  const certPath = process.env.FAIRPLAY_CERTIFICATE_PATH;
  const certBase64 = process.env.FAIRPLAY_CERTIFICATE_BASE64;

  if (certBase64) {
    return Buffer.from(certBase64, 'base64');
  }

  if (certPath) {
    const fs = require('fs');
    return fs.readFileSync(certPath);
  }

  return null;
}

module.exports = {
  getOrCreateEpisodeKey,
  getEpisodeKey,
  revokeEpisodeKey,
  proxyWidevine,
  proxyFairPlay,
  getFairPlayCertificate,
};
