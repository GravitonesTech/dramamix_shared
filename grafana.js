'use strict';

/**
 * Standalone Grafana observability module.
 * No external dependencies — uses only Node.js built-ins.
 *
 * Provides:
 *   - Loki log push  (batched, every 5 s)
 *   - httpLogMiddleware (express middleware for request logging to Loki)
 *
 * Usage (at the TOP of app.js, before any other require):
 *   const { httpLogMiddleware } = require('./grafana');
 *   app.use(httpLogMiddleware());
 */

const https = require('https');
const http  = require('http');

const LOKI_URL    = process.env.GRAFANA_LOKI_URL;
const LOKI_USER   = process.env.GRAFANA_LOKI_USER;
const LOKI_KEY    = process.env.GRAFANA_LOKI_API_KEY;
const SERVICE     = process.env.SERVICE_NAME || process.env.npm_package_name || 'unknown';
const ENV         = process.env.NODE_ENV     || 'production';

const enabled = !!(LOKI_URL && LOKI_USER && LOKI_KEY);

if (!enabled) {
  console.warn('[grafana] Loki env vars missing — log forwarding disabled');
}

// ─── batch ───────────────────────────────────────────────────────────────────

const batch = [];
const BATCH_SIZE   = 30;
const FLUSH_MS     = 5000;

function flush() {
  if (!enabled || batch.length === 0) return;
  const lines = batch.splice(0);
  const streams = [{
    stream: { app: 'dramamix', service: SERVICE, env: ENV },
    values: lines,
  }];
  _post(JSON.stringify({ streams }));
}

function _post(body) {
  try {
    const url  = new URL(LOKI_URL);
    const auth = Buffer.from(`${LOKI_USER}:${LOKI_KEY}`).toString('base64');
    const buf  = Buffer.from(body, 'utf8');
    const opts = {
      hostname: url.hostname,
      port:     url.port || (url.protocol === 'https:' ? 443 : 80),
      path:     url.pathname,
      method:   'POST',
      headers: {
        'Content-Type':   'application/json',
        'Content-Length': buf.length,
        Authorization:    `Basic ${auth}`,
      },
    };
    const transport = url.protocol === 'https:' ? https : http;
    const req = transport.request(opts, (res) => { res.resume(); });
    req.on('error', () => {});
    req.setTimeout(6000, () => req.destroy());
    req.write(buf);
    req.end();
  } catch (_) {}
}

function _ns() {
  return String(BigInt(Date.now()) * 1_000_000n);
}

function enqueue(level, obj) {
  if (!enabled) return;
  batch.push([_ns(), JSON.stringify(obj)]);
  if (batch.length >= BATCH_SIZE) flush();
}

const flushTimer = setInterval(flush, FLUSH_MS);
if (flushTimer.unref) flushTimer.unref();

process.on('SIGTERM', () => { flush(); });
process.on('beforeExit',  () => { flush(); });

// ─── console intercept ───────────────────────────────────────────────────────

const _origLog   = console.log.bind(console);
const _origWarn  = console.warn.bind(console);
const _origError = console.error.bind(console);

function _patchConsole(level, orig) {
  return function (...args) {
    orig(...args);
    if (!enabled) return;
    const msg = args.map(a =>
      typeof a === 'object' ? JSON.stringify(a) : String(a)
    ).join(' ');
    if (msg.includes('[grafana]')) return;
    enqueue(level, { ts: new Date().toISOString(), level, service: SERVICE, env: ENV, msg });
  };
}

console.log   = _patchConsole('info',  _origLog);
console.warn  = _patchConsole('warn',  _origWarn);
console.error = _patchConsole('error', _origError);
console.info  = _patchConsole('info',  _origLog);

// ─── http middleware ─────────────────────────────────────────────────────────

function httpLogMiddleware() {
  return function grafanaHttpLog(req, res, next) {
    const start = Date.now();
    res.on('finish', () => {
      enqueue('http', {
        ts:         new Date().toISOString(),
        level:      res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info',
        service:    SERVICE,
        env:        ENV,
        msg:        `${req.method} ${req.originalUrl || req.url} ${res.statusCode}`,
        method:     req.method,
        url:        req.originalUrl || req.url,
        status:     res.statusCode,
        duration_ms: Date.now() - start,
        request_id: req.requestId || req.headers['x-request-id'],
        ip:         req.headers['x-forwarded-for'] || req.socket?.remoteAddress,
      });
    });
    next();
  };
}

module.exports = { httpLogMiddleware, flush };
