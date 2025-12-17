import http from 'node:http';
import { EventEmitter } from 'node:events';

import { assertOpenApiRequest } from '../../../../../common/helpers/openapi-validator.js';

let server;
let serverBaseUrl;
let serverPort;
let serverHost;

const events = new EventEmitter();
const received = [];

function json(res, statusCode, body) {
  const payload = JSON.stringify(body);
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(payload);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.setEncoding('utf8');
    req.on('data', chunk => (data += chunk));
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

function nowIso() {
  return new Date().toISOString();
}

function toBaseUrl(host, port) {
  // Host is expected to be routable from the system under test.
  return `http://${host}:${port}`;
}

export function getCallbackBaseUrl() {
  if (!serverBaseUrl) {
    throw new Error('Callback server not started');
  }
  return serverBaseUrl;
}

export function resetCallbacks() {
  received.length = 0;
}

export function listCallbacks() {
  return [...received];
}

export async function startCallbackServer({ host = '127.0.0.1', port = 0 } = {}) {
  if (server) return { baseUrl: serverBaseUrl, host: serverHost, port: serverPort };

  serverHost = host;

  server = http.createServer(async (req, res) => {
    try {
      if (req.method !== 'POST') {
        res.statusCode = 404;
        res.end();
        return;
      }

      const url = new URL(req.url, 'http://callback.local');
      const path = url.pathname;

      const raw = await readBody(req);
      let body;
      try {
        body = raw ? JSON.parse(raw) : null;
      } catch {
        json(res, 200, {
          message: {
            ack_status: 'ERR',
            timestamp: nowIso(),
            correlation_id: 'corr-invalid-json',
            error: { code: 'err.request.bad', message: 'Invalid JSON body' },
          },
        });
        return;
      }

      try {
        await assertOpenApiRequest({ path, method: 'post' }, body);
      } catch (e) {
        json(res, 200, {
          message: {
            ack_status: 'ERR',
            timestamp: nowIso(),
            correlation_id: body?.message?.correlation_id || 'corr-openapi-invalid',
            error: { code: 'err.request.bad', message: String(e?.message || e) },
          },
        });
        return;
      }

      const record = {
        received_at: nowIso(),
        path,
        headers: req.headers,
        body,
      };
      received.push(record);
      events.emit('callback', record);

      json(res, 200, {
        message: {
          ack_status: 'ACK',
          timestamp: nowIso(),
          correlation_id: body?.message?.correlation_id || 'corr-ack',
        },
      });
    } catch (e) {
      json(res, 200, {
        message: {
          ack_status: 'ERR',
          timestamp: nowIso(),
          correlation_id: 'corr-internal-error',
          error: { code: 'err.service.unavailable', message: String(e?.message || e) },
        },
      });
    }
  });

  await new Promise((resolve, reject) => {
    server.listen(port, host, () => resolve());
    server.on('error', reject);
  });

  const address = server.address();
  serverPort = typeof address === 'object' && address ? address.port : port;
  serverBaseUrl = toBaseUrl(host, serverPort);

  return { baseUrl: serverBaseUrl, host, port: serverPort };
}

export async function stopCallbackServer() {
  if (!server) return;
  const s = server;
  server = undefined;
  serverBaseUrl = undefined;
  serverPort = undefined;
  serverHost = undefined;
  await new Promise(resolve => s.close(() => resolve()));
}

export async function waitForCallback({ path, predicate }, timeoutMs = 60000) {
  const targetPath = path?.startsWith('/') ? path : `/${path || ''}`;

  const existing = received.find(r => r.path === targetPath && (!predicate || predicate(r)));
  if (existing) return existing;

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      events.removeListener('callback', onCb);
      reject(new Error(`Timed out waiting for callback to ${targetPath}`));
    }, timeoutMs);

    function onCb(record) {
      if (record.path !== targetPath) return;
      if (predicate && !predicate(record)) return;
      clearTimeout(timer);
      events.removeListener('callback', onCb);
      resolve(record);
    }

    events.on('callback', onCb);
  });
}

