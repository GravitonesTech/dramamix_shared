const cluster = require('cluster');

function runWithCluster(workerCount, startFn) {
  if (cluster.isPrimary) {
    const serviceName = process.env.SERVICE_NAME || 'service';
    console.log(`[${serviceName}] Primary process ${process.pid} starting ${workerCount} workers...`);

    for (let i = 0; i < workerCount; i++) {
      cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
      if (signal !== 'SIGTERM' && signal !== 'SIGINT') {
        console.log(`[${serviceName}] Worker ${worker.process.pid} died (${signal || code}), restarting...`);
        cluster.fork();
      } else {
        const remaining = Object.keys(cluster.workers).length;
        console.log(`[${serviceName}] Worker ${worker.process.pid} exited cleanly. Workers remaining: ${remaining}`);
      }
    });

    function shutdownPrimary(signal) {
      console.log(`[${serviceName}] Primary received ${signal}. Forwarding to workers...`);

      const workers = Object.values(cluster.workers).filter(Boolean);
      if (workers.length === 0) {
        console.log(`[${serviceName}] No workers running. Primary exiting.`);
        process.exit(0);
        return;
      }

      let exited = 0;
      const total = workers.length;

      cluster.on('exit', () => {
        exited++;
        if (exited >= total) {
          console.log(`[${serviceName}] All ${total} workers exited cleanly. Primary exiting.`);
          process.exit(0);
        }
      });

      workers.forEach((worker) => {
        worker.process.kill('SIGTERM');
      });

      setTimeout(() => {
        console.warn(`[${serviceName}] Primary force-exiting after 28s`);
        process.exit(0);
      }, 28000);
    }

    process.on('SIGTERM', () => shutdownPrimary('SIGTERM'));
    process.on('SIGINT',  () => shutdownPrimary('SIGINT'));
  } else {
    console.log(`[Worker ${process.pid}] started`);
    startFn();
  }
}

module.exports = { runWithCluster };
