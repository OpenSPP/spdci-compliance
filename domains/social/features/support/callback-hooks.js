import { AfterAll, Before, BeforeAll } from '@cucumber/cucumber';

import { resetCallbacks, startCallbackServer, stopCallbackServer } from './helpers/callback-server.js';

const enabled = String(process.env.CALLBACK_SERVER_ENABLED || '').toLowerCase() === 'true';

function buildBaseUrl(host, port) {
  return `http://${host}:${port}`;
}

BeforeAll(async function () {
  if (!enabled) return;
  const advertiseHost = process.env.CALLBACK_SERVER_HOST || '127.0.0.1';
  const listenHost = process.env.CALLBACK_SERVER_LISTEN_HOST || advertiseHost;
  const port = process.env.CALLBACK_SERVER_PORT ? Number(process.env.CALLBACK_SERVER_PORT) : 0;
  const { port: boundPort } = await startCallbackServer({ host: listenHost, port });
  const baseUrl = buildBaseUrl(advertiseHost, boundPort);
  process.env.CALLBACK_SERVER_BASE_URL = baseUrl;
  console.log(`Callback server listening on ${listenHost}:${boundPort} (advertised as ${baseUrl})`);
});

Before(function () {
  if (!enabled) return;
  resetCallbacks();
});

AfterAll(async function () {
  if (!enabled) return;
  await stopCallbackServer();
});
