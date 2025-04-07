import { parentPort } from 'node:worker_threads';

if (!parentPort) {
  throw new Error('This script should be executed as a parent thread');
}

const updateMatch = async () => {
  parentPort?.postMessage(1);
};

setInterval(updateMatch, 1000);
