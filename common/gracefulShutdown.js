const SHUTDOWN_TIMEOUT_MS = 25000;

async function closeDbConnections(serviceName) {
  const path = require('path');
  const sequelizePath = path.resolve(__dirname, './sequelize');
  if (!require.cache[sequelizePath]) {
    return;
  }
  try {
    const { sequelizeWrite, sequelizeRead } = require('./sequelize');
    await Promise.all([
      sequelizeWrite.close().catch(() => {}),
      sequelizeRead.close().catch(() => {}),
    ]);
    console.log(`[${serviceName}] DB connections closed.`);
  } catch (err) {
    console.error(`[${serviceName}] Error closing DB:`, err.message);
  }
}

function createGracefulShutdown(server, options = {}) {
  const serviceName = options.serviceName || process.env.SERVICE_NAME || 'service';
  const timeoutMs   = options.timeoutMs   || SHUTDOWN_TIMEOUT_MS;
  const onShutdownBegin = options.onShutdownBegin || null;
  const extraCleanup    = options.extraCleanup    || null;

  let isShuttingDown = false;

  const openSockets    = new Set();
  const activeRequests = new Set();

  server.on('connection', (socket) => {
    openSockets.add(socket);
    socket.on('close', () => openSockets.delete(socket));
  });

  server.on('request', (req, res) => {
    activeRequests.add(res);
    res.on('finish', () => activeRequests.delete(res));
    res.on('close',  () => activeRequests.delete(res));
    if (isShuttingDown) {
      res.setHeader('Connection', 'close');
    }
  });

  async function shutdown(signal = 'SIGTERM') {
    if (isShuttingDown) return;
    isShuttingDown = true;

    if (onShutdownBegin) onShutdownBegin();

    console.log(`[${serviceName}] Received ${signal}. Starting graceful shutdown...`);
    console.log(`[${serviceName}] Active requests: ${activeRequests.size}, Open sockets: ${openSockets.size}`);

    const forceExitTimer = setTimeout(() => {
      console.warn(`[${serviceName}] Graceful shutdown timed out after ${timeoutMs}ms — forcing exit`);
      process.exit(0);
    }, timeoutMs);
    if (forceExitTimer.unref) forceExitTimer.unref();

    for (const socket of openSockets) {
      if (activeRequests.size === 0) {
        socket.destroy();
      } else {
        socket.setTimeout(1);
      }
    }

    await new Promise((resolve) => {
      server.close((err) => {
        if (err && err.code !== 'ERR_SERVER_NOT_RUNNING') {
          console.error(`[${serviceName}] server.close() error:`, err.message);
        }
        resolve();
      });
    });

    console.log(`[${serviceName}] HTTP server closed.`);

    await closeDbConnections(serviceName);

    if (extraCleanup) {
      try {
        await extraCleanup();
      } catch (err) {
        console.error(`[${serviceName}] Extra cleanup error:`, err.message);
      }
    }

    clearTimeout(forceExitTimer);
    console.log(`[${serviceName}] Graceful shutdown complete.`);
    process.exit(0);
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));

  process.on('uncaughtException', (err) => {
    console.error(`[${serviceName}] Uncaught exception:`, err);
    shutdown('uncaughtException').catch(() => process.exit(1));
  });

  process.on('unhandledRejection', (reason) => {
    console.error(`[${serviceName}] Unhandled rejection:`, reason);
  });
}

module.exports = { createGracefulShutdown };
