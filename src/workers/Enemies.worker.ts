import { parentPort } from 'node:worker_threads';

if (!parentPort) {
  throw new Error('Este script debe ejecutarse como un worker thread');
}

const main = async () => {
  parentPort?.postMessage(1);
}


setInterval(main, 1000);
