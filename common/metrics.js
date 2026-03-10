const client = require('prom-client');
const https = require('https');
const http = require('http');

const SERVICE_NAME = process.env.SERVICE_NAME || 'unknown';
const NODE_ENV = process.env.NODE_ENV || 'development';

const MIMIR_URL = process.env.GRAFANA_MIMIR_URL;
const MIMIR_USER = process.env.GRAFANA_MIMIR_USER;
const MIMIR_API_KEY = process.env.GRAFANA_MIMIR_API_KEY;

let mimirEnabled = !!(MIMIR_URL && MIMIR_USER && MIMIR_API_KEY);

const registry = new client.Registry();

registry.setDefaultLabels({
  app: 'dramamix',
  env: NODE_ENV,
  service: SERVICE_NAME,
});

client.collectDefaultMetrics({ register: registry });

const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code', 'service'],
  registers: [registry],
});

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code', 'service'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [registry],
});

const httpRequestErrors = new client.Counter({
  name: 'http_request_errors_total',
  help: 'Total number of HTTP requests that resulted in errors (4xx/5xx)',
  labelNames: ['method', 'route', 'status_code', 'service'],
  registers: [registry],
});

const activeConnections = new client.Gauge({
  name: 'http_active_connections',
  help: 'Number of active HTTP connections',
  labelNames: ['service'],
  registers: [registry],
});

const dbQueryDuration = new client.Histogram({
  name: 'db_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'service'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5],
  registers: [registry],
});

const dbQueryErrors = new client.Counter({
  name: 'db_query_errors_total',
  help: 'Total number of database query errors',
  labelNames: ['operation', 'service'],
  registers: [registry],
});

const cacheHits = new client.Counter({
  name: 'cache_hits_total',
  help: 'Total number of cache hits',
  labelNames: ['service'],
  registers: [registry],
});

const cacheMisses = new client.Counter({
  name: 'cache_misses_total',
  help: 'Total number of cache misses',
  labelNames: ['service'],
  registers: [registry],
});

function pushMetricsToMimir() {
  if (!mimirEnabled) return;

  registry.metrics().then((metricsText) => {
    const url = new URL(MIMIR_URL);
    const auth = Buffer.from(`${MIMIR_USER}:${MIMIR_API_KEY}`).toString('base64');
    const body = Buffer.from(metricsText);

    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain; version=0.0.4',
        'Content-Length': body.length,
        'Authorization': `Basic ${auth}`,
      },
    };

    const transport = url.protocol === 'https:' ? https : http;
    const req = transport.request(options, (res) => {
      if (res.statusCode >= 400) {
        res.resume();
        if (res.statusCode === 400 || res.statusCode === 401 || res.statusCode === 403) {
          mimirEnabled = false;
          console.error(`[metrics] Mimir push failed HTTP ${res.statusCode} — disabling`);
        }
      } else {
        res.resume();
      }
    });

    req.on('error', () => {});
    req.setTimeout(5000, () => req.destroy());
    req.write(body);
    req.end();
  }).catch(() => {});
}

const PUSH_INTERVAL_MS = 15000;
if (mimirEnabled && NODE_ENV !== 'test') {
  const interval = setInterval(pushMetricsToMimir, PUSH_INTERVAL_MS);
  if (interval.unref) interval.unref();
}

function normalizeRoute(req) {
  if (req.route && req.route.path) {
    const base = req.baseUrl || '';
    return base + req.route.path;
  }
  const path = req.path || req.url || '/';
  return path
    .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:id')
    .replace(/\/\d+/g, '/:id');
}

function metricsMiddleware(serviceName) {
  return (req, res, next) => {
    if (req.path === '/metrics' || req.path === '/health') {
      return next();
    }

    const start = process.hrtime.bigint();
    activeConnections.inc({ service: serviceName });

    res.on('finish', () => {
      activeConnections.dec({ service: serviceName });

      const durationNs = Number(process.hrtime.bigint() - start);
      const durationSec = durationNs / 1e9;
      const route = normalizeRoute(req);
      const labels = {
        method: req.method,
        route,
        status_code: String(res.statusCode),
        service: serviceName,
      };

      httpRequestsTotal.inc(labels);
      httpRequestDuration.observe(labels, durationSec);

      if (res.statusCode >= 400) {
        httpRequestErrors.inc(labels);
      }
    });

    next();
  };
}

function metricsEndpoint(app) {
  app.get('/metrics', async (req, res) => {
    try {
      res.set('Content-Type', registry.contentType);
      const metrics = await registry.metrics();
      res.end(metrics);
    } catch (err) {
      res.status(500).end(err.message);
    }
  });
}

module.exports = {
  registry,
  metricsMiddleware,
  metricsEndpoint,
  httpRequestsTotal,
  httpRequestDuration,
  httpRequestErrors,
  activeConnections,
  dbQueryDuration,
  dbQueryErrors,
  cacheHits,
  cacheMisses,
};
