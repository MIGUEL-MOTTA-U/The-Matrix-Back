import { parentPort, workerData } from 'node:worker_threads';

if (!parentPort) {
  throw new Error('This script should be executed as a parent thread');
}
const { timerSpeed } = workerData as { timerSpeed: number };

const updateMatch = async () => {
  parentPort?.postMessage(1);
};

setInterval(updateMatch, timerSpeed);
