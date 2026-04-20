// Global serial request queue — one request at a time, with retry on 429
const DELAY_MS = 150;
const sleep = ms => new Promise(r => setTimeout(r, ms));

let queue = Promise.resolve();

async function runWithRetry(fn, retries = 5, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (e) {
      const is429 = e?.message?.includes('Rate limit') || e?.status === 429 || String(e).includes('429');
      if (!is429 || i === retries - 1) throw e;
      await sleep(delay * Math.pow(2, i));
    }
  }
}

export function queued(fn) {
  const result = queue.then(() => runWithRetry(fn));
  queue = result.then(() => sleep(DELAY_MS)).catch(() => sleep(DELAY_MS));
  return result;
}