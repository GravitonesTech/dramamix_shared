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
  const serviceName     = options.serviceName     || process.env.SERVICE_NAME || 'service';
  const timeoutMs       = options.timeoutMs       || SHUTDOWN_TIMEOUT_MS;
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

    // Hard deadline — ECS SIGTERM→SIGKILL window is 30s.
    // We use timeoutMs (25s default) leaving a 5s safety margin.
    const forceExitTimer = setTimeout(() => {
      console.warn(`[${serviceName}] Graceful shutdown timed out after ${timeoutMs}ms — forcing exit`);
      process.exit(0);
    }, timeoutMs);
    if (forceExitTimer.unref) forceExitTimer.unref();

    // 1. Stop accepting new TCP connections.
    //    Existing keep-alive sockets stay open until their requests finish.
    server.close();

    // 2. Drain in-flight requests before touching sockets.
    //    Poll every 100ms until all responses have been sent or the drain
    //    window expires (timeoutMs minus 3s for cleanup headroom).
    const drainDeadline = Date.now() + timeoutMs - 3000;

    if (activeRequests.size > 0) {
      console.log(`[${serviceName}] Draining ${activeRequests.size} in-flight request(s)...`);
      while (activeRequests.size > 0 && Date.now() < drainDeadline) {
        await new Promise(r => setTimeout(r, 100));
      }
    }

    if (activeRequests.size > 0) {
      console.warn(`[${serviceName}] ${activeRequests.size} request(s) still active after drain window — closing sockets now`);
    } else {
      console.log(`[${serviceName}] All in-flight requests drained cleanly.`);
    }

    // 3. Destroy remaining sockets — idle keep-alives and any that didn't
    //    finish in time. server.close() already prevents new connections.
    for (const socket of openSockets) {
      socket.destroy();
    }

    console.log(`[${serviceName}] HTTP server closed.`);

    // 4. Close DB connection pools.
    await closeDbConnections(serviceName);

    // 5. Service-specific cleanup (Redis, file handles, etc.).
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
