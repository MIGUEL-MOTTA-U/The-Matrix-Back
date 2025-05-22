import { parentPort, workerData } from 'node:worker_threads';

if (!parentPort) {
  throw new Error('Este script debe ejecutarse como un worker thread');
}
const { enemiesSpeed } = workerData as { enemiesSpeed: number };

const main = async () => {
  parentPort?.postMessage(1);
};

setInterval(main, enemiesSpeed);
