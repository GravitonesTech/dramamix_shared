const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const { v4: uuidv4 } = require("uuid");
const globalErrorHandler = require("./middleware/globalErrorHandle");
const { metricsMiddleware, metricsEndpoint } = require("./common/metrics");
const { logger, morganStreamMiddleware } = require("./common/logger");
const { createGracefulShutdown } = require("./common/gracefulShutdown");

function createServiceApp(options = {}) {
  const app = express();

  const jsonLimit = options.jsonLimit || '10mb';
  const urlLimit = options.urlLimit || '10mb';
  const serviceName = options.serviceName || process.env.SERVICE_NAME || 'unknown';

  const appState = { isShuttingDown: false };
  app.set('appState', appState);

  app.use(compression({
    level: 6,
    threshold: 1024,
    filter: (req, res) => {
      if (req.headers['x-no-compression']) return false;
      return compression.filter(req, res);
    },
  }));

  app.use(express.json({ limit: jsonLimit }));
  app.use(express.urlencoded({ limit: urlLimit, extended: true }));
  app.use(helmet());

  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : ['https://shortsdrama.online', 'https://www.shortsdrama.online', 'https://dramamix.app'];

  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    optionsSuccessStatus: 204,
    credentials: true,
  }));

  app.use(morgan("dev"));
  app.use(morganStreamMiddleware());
  app.use(metricsMiddleware(serviceName));
  metricsEndpoint(app);

  app.get('/health', (req, res) => {
    if (appState.isShuttingDown) {
      return res.status(503).json({
        status: 'draining',
        message: 'Service is shutting down — no longer accepting traffic',
        uptime: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
      });
    }
    res.status(200).json({
      status: 'ok',
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    });
  });

  app.use((req, res, next) => {
    req.requestId = req.headers['x-request-id'] || uuidv4();
    res.setHeader('X-Request-Id', req.requestId);

    if (appState.isShuttingDown) {
      res.setHeader('Connection', 'close');
    }

    const originalSend = res.send.bind(res);
    const originalJson = res.json.bind(res);
    res.send = function(body) {
      if (res.headersSent) return res;
      return originalSend(body);
    };
    res.json = function(body) {
      if (res.headersSent) return res;
      return originalJson(body);
    };

    req.setTimeout(120000);
    next();
  });

  return app;
}

function startService(app, port, serviceName) {
  app.use((req, res) => {
    res.status(404).json({ status: 404, message: "pages not found" });
  });

  app.use(globalErrorHandler);

  const server = app.listen(port, "0.0.0.0", () => {
    console.log(`${serviceName} is running on port ${port}`);
  });

  server.keepAliveTimeout = 65000;
  server.headersTimeout = 66000;
  server.maxHeadersCount = 100;
  server.timeout = 120000;

  const appState = app.get('appState') || {};

  createGracefulShutdown(server, {
    serviceName,
    onShutdownBegin: () => {
      appState.isShuttingDown = true;
    },
  });

  return server;
}

module.exports = { createServiceApp, startService };
