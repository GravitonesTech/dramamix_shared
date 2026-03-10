const { GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const crypto = require('crypto');
const { s3Client, BUCKET, getS3KeyFromUrl } = require('./s3');

const DEFAULT_TTL_SECONDS = 1800;

/**
 * Determines whether a URL points to content we control (Cloudflare CDN or S3).
 */
function isOwnedUrl(url) {
  if (!url) return false;
  const cdnBase = (process.env.CLOUDFLARE_CDN_URL || '').replace(/\/+$/, '');
  const s3Bucket = process.env.AWS_S3_BUCKET || '';

  if (cdnBase && url.startsWith(cdnBase)) return true;
  if (s3Bucket && url.includes(`${s3Bucket}.s3`)) return true;
  if (s3Bucket && url.includes(`s3.amazonaws.com/${s3Bucket}`)) return true;
  return false;
}

/**
 * Generate a Cloudflare CDN signed URL.
 * Requires CLOUDFLARE_CDN_SECRET to be set in environment.
 *
 * Format: ?token=HMAC-SHA256(secret, pathname+expires)&expires=UNIX_TIMESTAMP
 * Validated by the Cloudflare Worker at infrastructure/cloudflare-worker/signed-url.js
 */
function signCloudflareUrl(rawUrl, ttlSeconds) {
  const secret = process.env.CLOUDFLARE_CDN_SECRET;
  if (!secret) return null;

  const expires = Math.floor(Date.now() / 1000) + ttlSeconds;
  const urlObj = new URL(rawUrl);
  const message = urlObj.pathname + expires;

  const token = crypto
    .createHmac('sha256', secret)
    .update(message)
    .digest('hex');

  urlObj.searchParams.set('token', token);
  urlObj.searchParams.set('expires', String(expires));
  return urlObj.toString();
}

/**
 * Generate an AWS S3 pre-signed GET URL from a CDN or S3 URL.
 * @param {string} rawUrl - The raw CDN or S3 URL stored in the DB
 * @param {number} ttlSeconds - Expiry in seconds (default 1800 = 30 min)
 * @returns {Promise<string>} - Pre-signed URL
 */
async function signS3Url(rawUrl, ttlSeconds) {
  const s3Key = getS3KeyFromUrl(rawUrl);
  if (!s3Key || s3Key === rawUrl) {
    return null;
  }

  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: s3Key,
  });

  return getSignedUrl(s3Client, command, { expiresIn: ttlSeconds });
}

/**
 * Get a time-limited signed URL for a video asset.
 *
 * Priority:
 * 1. If CLOUDFLARE_CDN_SECRET is set → Cloudflare signed URL (served via CDN edge, fast)
 * 2. Otherwise → AWS S3 pre-signed URL (direct from S3, bypasses CDN)
 * 3. If URL is not one we control → return as-is
 *
 * @param {string} rawUrl - Raw URL from the database
 * @param {number} [ttlSeconds=1800] - TTL in seconds
 * @returns {Promise<{ signedUrl: string, method: string, expiresAt: Date }>}
 */
async function getSignedVideoUrl(rawUrl, ttlSeconds = DEFAULT_TTL_SECONDS) {
  if (!rawUrl) {
    return { signedUrl: rawUrl, method: 'passthrough', expiresAt: null };
  }

  if (!isOwnedUrl(rawUrl)) {
    return { signedUrl: rawUrl, method: 'passthrough', expiresAt: null };
  }

  const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

  if (process.env.CLOUDFLARE_CDN_SECRET) {
    const signedUrl = signCloudflareUrl(rawUrl, ttlSeconds);
    if (signedUrl) {
      return { signedUrl, method: 'cloudflare', expiresAt };
    }
  }

  const signedUrl = await signS3Url(rawUrl, ttlSeconds);
  if (!signedUrl) {
    return { signedUrl: rawUrl, method: 'passthrough', expiresAt: null };
  }
  return { signedUrl, method: 's3-presigned', expiresAt };
}

module.exports = { getSignedVideoUrl, isOwnedUrl, signCloudflareUrl };
