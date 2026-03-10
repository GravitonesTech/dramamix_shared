const https = require('https');
const http = require('http');

const LOKI_URL = process.env.GRAFANA_LOKI_URL;
const LOKI_USER = process.env.GRAFANA_LOKI_USER;
const LOKI_API_KEY = process.env.GRAFANA_LOKI_API_KEY;
const SERVICE_NAME = process.env.SERVICE_NAME || 'unknown';
const NODE_ENV = process.env.NODE_ENV || 'development';

let lokiEnabled = !!(LOKI_URL && LOKI_USER && LOKI_API_KEY);

const LOG_BATCH = [];
const BATCH_SIZE = 20;
const FLUSH_INTERVAL_MS = 5000;

function pushToLoki(streams) {
  if (!lokiEnabled) return;

  const body = JSON.stringify({ streams });
  const url = new URL(LOKI_URL);
  const auth = Buffer.from(`${LOKI_USER}:${LOKI_API_KEY}`).toString('base64');

  const options = {
    hostname: url.hostname,
    port: url.port || (url.protocol === 'https:' ? 443 : 80),
    path: url.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
      'Authorization': `Basic ${auth}`,
    },
  };

  const transport = url.protocol === 'https:' ? https : http;
  const req = transport.request(options, (res) => {
    if (res.statusCode >= 400) {
      res.resume();
      lokiEnabled = false;
      console.error(`[logger] Loki push failed: HTTP ${res.statusCode} — disabling Loki`);
    } else {
      res.resume();
    }
  });

  req.on('error', (err) => {
    console.error(`[logger] Loki push error: ${err.message}`);
  });

  req.setTimeout(5000, () => req.destroy());
  req.write(body);
  req.end();
}

function flushBatch() {
  if (LOG_BATCH.length === 0) return;

  const lines = LOG_BATCH.splice(0, LOG_BATCH.length);

  const streams = [{
    stream: {
      app: 'dramamix',
      service: SERVICE_NAME,
      env: NODE_ENV,
    },
    values: lines.map(entry => [
      String(Date.now() * 1_000_000),
      JSON.stringify(entry),
    ]),
  }];

  pushToLoki(streams);
}

if (lokiEnabled) {
  const interval = setInterval(flushBatch, FLUSH_INTERVAL_MS);
  if (interval.unref) interval.unref();
}

function log(level, message, meta = {}) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    service: SERVICE_NAME,
    env: NODE_ENV,
    msg: message,
    ...meta,
  };

  if (NODE_ENV !== 'test') {
    const out = level === 'error' || level === 'warn' ? 'error' : 'log';
    console[out](JSON.stringify(entry));
  }

  if (lokiEnabled) {
    LOG_BATCH.push(entry);
    if (LOG_BATCH.length >= BATCH_SIZE) flushBatch();
  }
}

const logger = {
  info:  (msg, meta) => log('info', msg, meta),
  warn:  (msg, meta) => log('warn', msg, meta),
  error: (msg, meta) => log('error', msg, meta),
  debug: (msg, meta) => log('debug', msg, meta),
  http:  (msg, meta) => log('http', msg, meta),
  flush: flushBatch,
};

function morganStreamMiddleware() {
  return function(req, res, next) {
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;
      logger.http('http request', {
        method: req.method,
        url: req.originalUrl || req.url,
        status: res.statusCode,
        duration_ms: duration,
        request_id: req.requestId,
        user_agent: req.headers['user-agent'],
        ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress,
      });
    });

    next();
  };
}

module.exports = { logger, morganStreamMiddleware };
