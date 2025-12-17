/**
 * Callback Server for SPDCI Async Testing
 *
 * Receives and records callbacks from registries for async workflow testing.
 * Used when testing client implementations or async response handling.
 */

import http from 'node:http';

let server = null;
let callbacks = [];
let waitResolvers = [];

const port = Number(process.env.CALLBACK_SERVER_PORT || 3336);
const host = process.env.CALLBACK_SERVER_HOST || '0.0.0.0';

/**
 * Parse JSON body from request
 */
function readJson(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.setEncoding('utf8');
    req.on('data', chunk => (data += chunk));
    req.on('end', () => {
      if (!data) return resolve(null);
      try {
        resolve(JSON.parse(data));
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

/**
 * Start the callback server
 */
export async function startCallbackServer() {
  if (server) return getCallbackUrl();

  return new Promise((resolve, reject) => {
    server = http.createServer(async (req, res) => {
      const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      const path = url.pathname;

      console.log(`[callback-server] ${req.method} ${path}`);

      if (req.method === 'GET' && path === '/healthcheck') {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ status: 'ok', callbackCount: callbacks.length }));
        return;
      }

      if (req.method === 'POST') {
        try {
          const body = await readJson(req);
          const callback = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            timestamp: new Date().toISOString(),
            path,
            headers: req.headers,
            body,
            action: body?.header?.action,
            transactionId: body?.message?.transaction_id,
            correlationId: body?.message?.correlation_id,
          };

          callbacks.push(callback);
          console.log(`[callback-server] Recorded callback: ${callback.action || 'unknown'}`);

          // Resolve any waiters
          while (waitResolvers.length > 0) {
            const resolver = waitResolvers.shift();
            resolver(callback);
          }

          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ ack_status: 'ACK' }));
        } catch (e) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'Invalid JSON' }));
        }
        return;
      }

      res.statusCode = 404;
      res.end();
    });

    server.on('error', reject);
    server.listen(port, host, () => {
      console.log(`[callback-server] Listening on ${host}:${port}`);
      resolve(getCallbackUrl());
    });
  });
}

/**
 * Stop the callback server
 */
export async function stopCallbackServer() {
  if (!server) return;

  return new Promise((resolve) => {
    server.close(() => {
      server = null;
      console.log('[callback-server] Stopped');
      resolve();
    });
  });
}

/**
 * Get the callback URL to provide to registries
 */
export function getCallbackUrl(path = '/callback') {
  const callbackHost = process.env.CALLBACK_HOST || 'localhost';
  return `http://${callbackHost}:${port}${path}`;
}

/**
 * Get all recorded callbacks
 */
export function getCallbacks() {
  return [...callbacks];
}

/**
 * Get callbacks filtered by action
 */
export function getCallbacksByAction(action) {
  return callbacks.filter(c => c.action === action);
}

/**
 * Get the most recent callback
 */
export function getLastCallback() {
  return callbacks[callbacks.length - 1] || null;
}

/**
 * Clear all recorded callbacks
 */
export function clearCallbacks() {
  const count = callbacks.length;
  callbacks = [];
  return count;
}

/**
 * Wait for a callback to be received (with timeout)
 */
export function waitForCallback(timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      const index = waitResolvers.indexOf(resolve);
      if (index > -1) waitResolvers.splice(index, 1);
      reject(new Error(`Callback timeout after ${timeoutMs}ms`));
    }, timeoutMs);

    waitResolvers.push((callback) => {
      clearTimeout(timeout);
      resolve(callback);
    });
  });
}

/**
 * Wait for a specific action callback
 */
export async function waitForCallbackAction(action, timeoutMs = 5000) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const existing = callbacks.find(c => c.action === action);
    if (existing) return existing;

    try {
      const callback = await waitForCallback(deadline - Date.now());
      if (callback.action === action) return callback;
    } catch {
      // Timeout, check once more
      const existing = callbacks.find(c => c.action === action);
      if (existing) return existing;
      throw new Error(`Callback for action '${action}' not received within ${timeoutMs}ms`);
    }
  }

  throw new Error(`Callback for action '${action}' not received within ${timeoutMs}ms`);
}
