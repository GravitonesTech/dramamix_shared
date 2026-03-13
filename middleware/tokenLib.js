const crypto = require('crypto');
const ALGO = 'sha256';
const jwt = require('jsonwebtoken');
const jwkToPem = require('jwk-to-pem');

// ---------------------------------------------------------------------------
// Key loading — runs once at module startup.
// Services that sign tokens (user-service, admin-service) must set JWT_PRIVATE_KEY_JSON.
// All services must set JWT_PUBLIC_KEY_JSON (or set JWT_PRIVATE_KEY_JSON, from which
// the public key is derived automatically).
// REFRESH_TOKEN_SECRET is required — no fallback. Set it in AWS Secrets Manager.
// ---------------------------------------------------------------------------

let _privateJwk = null;
let _publicJwk  = null;

function _loadKeys() {
  if (process.env.JWT_PRIVATE_KEY_JSON) {
    try {
      _privateJwk = JSON.parse(process.env.JWT_PRIVATE_KEY_JSON);
    } catch (e) {
      console.error('[tokenLib] FATAL: JWT_PRIVATE_KEY_JSON is set but is not valid JSON — cannot start.');
      process.exit(1);
    }
  }

  if (process.env.JWT_PUBLIC_KEY_JSON) {
    try {
      _publicJwk = JSON.parse(process.env.JWT_PUBLIC_KEY_JSON);
    } catch (e) {
      console.error('[tokenLib] FATAL: JWT_PUBLIC_KEY_JSON is set but is not valid JSON — cannot start.');
      process.exit(1);
    }
  } else if (_privateJwk) {
    const { d, p, q, dp, dq, qi, ...pub } = _privateJwk;
    _publicJwk = pub;
  }

  if (!_publicJwk) {
    if (process.env.NODE_ENV === 'test') {
      console.warn('[tokenLib] JWT keys not set — running in test mode with null keys. Mock this module in tests that use token functions.');
    } else {
      console.error('[tokenLib] FATAL: Neither JWT_PUBLIC_KEY_JSON nor JWT_PRIVATE_KEY_JSON is set. Cannot validate tokens.');
      process.exit(1);
    }
  }
}

_loadKeys();

// ---------------------------------------------------------------------------
// Refresh token secret — required, no fallback.
// ---------------------------------------------------------------------------
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
if (!REFRESH_TOKEN_SECRET) {
  if (process.env.NODE_ENV === 'test') {
    console.warn('[tokenLib] REFRESH_TOKEN_SECRET not set — running in test mode. Mock this module in tests that use refresh tokens.');
  } else {
    console.error('[tokenLib] FATAL: REFRESH_TOKEN_SECRET environment variable is not set — cannot start.');
    process.exit(1);
  }
}
const REFRESH_TOKEN_EXPIRY = '7d';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const log = async (message, level, source, context, request, response) => {
  try {
    let log = {
      epoc: Math.floor(+new Date()),
      message: message,
      level: level,
      source: source,
      context: context,
      request: JSON.stringify(request),
      response: JSON.stringify(response),
    };
    console.log(log);
  } catch (error) {
    let errorLog = error.stack
      ? error.stack
      : error.message
      ? error.message
      : "";
    console.log("Error in log", "error", "get log", null, null, errorLog);
  }
};

const encrypt = (textString, salt) => {
  const hashedPassword = crypto.createHmac(ALGO, salt)
    .update(textString)
    .digest('hex');
  return hashedPassword;
};

const validateToken = function (token) {
  try {
    const pem = jwkToPem(_publicJwk);
    let decoded = jwt.verify(token, pem, { algorithms: ['RS256'] });
    return decoded;
  } catch (error) {
    return false;
  }
};

const generateToken = (userdata) => {
  if (!_privateJwk) {
    throw new Error('[tokenLib] generateToken requires JWT_PRIVATE_KEY_JSON — this service is not configured to issue tokens.');
  }
  try {
    const pem = jwkToPem(_privateJwk, { private: true });
    const token = jwt.sign(
      { userdata },
      pem,
      { algorithm: 'RS256', expiresIn: `${process.env.TOKEN_EXPIRATION || '3600'}s` }
    );
    return { accessToken: token, expiresIn: process.env.TOKEN_EXPIRATION };
  } catch (error) {
    let errorLog = error.stack ? error.stack : (error.message ? error.message : '');
    console.log('Error calling generate token', 'error', 'generate token', errorLog);
    throw error;
  }
};

const generateRefreshToken = (userId) => {
  try {
    const jti = crypto.randomBytes(16).toString('hex');
    const token = jwt.sign(
      { userId, jti, type: 'refresh' },
      REFRESH_TOKEN_SECRET,
      { algorithm: 'HS256', expiresIn: REFRESH_TOKEN_EXPIRY }
    );
    return { refreshToken: token, jti, expiresIn: 7 * 24 * 60 * 60 };
  } catch (error) {
    throw error;
  }
};

const validateRefreshToken = (token) => {
  try {
    const decoded = jwt.verify(token, REFRESH_TOKEN_SECRET, { algorithms: ['HS256'] });
    if (decoded.type !== 'refresh') return false;
    return decoded;
  } catch (error) {
    return false;
  }
};

module.exports = {
  encrypt,
  generateToken,
  validateToken,
  generateRefreshToken,
  validateRefreshToken,
};
