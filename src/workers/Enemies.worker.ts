import { parentPort } from 'node:worker_threads';
import { config } from '../server.js';

if (!parentPort) {
  throw new Error('Este script debe ejecutarse como un worker thread');
}

const main = async () => {
  parentPort?.postMessage(1);
};

setInterval(main, config.ENEMIES_SPEED_MS);
