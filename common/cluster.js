const cluster = require('cluster');

function runWithCluster(workerCount, startFn) {
  if (cluster.isPrimary) {
    console.log(`Primary process ${process.pid} starting ${workerCount} workers...`);

    for (let i = 0; i < workerCount; i++) {
      cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
      if (signal !== 'SIGTERM' && signal !== 'SIGINT') {
        console.log(`Worker ${worker.process.pid} died (${signal || code}), restarting...`);
        cluster.fork();
      }
    });

    process.on('SIGTERM', () => {
      console.log('Primary received SIGTERM, stopping workers...');
      for (const id in cluster.workers) {
        cluster.workers[id].process.kill('SIGTERM');
      }
    });
  } else {
    console.log(`Worker ${process.pid} started`);
    startFn();
  }
}

module.exports = { runWithCluster };
