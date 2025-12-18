import { Before, After } from '@cucumber/cucumber';
import { startCallbackServer, stopCallbackServer, clearCallbacks } from '../../../../common/helpers/callback-server.js';

const CALLBACK_ENABLED = String(process.env.CALLBACK_SERVER_ENABLED || '').toLowerCase() === 'true';

Before(async function () {
  if (CALLBACK_ENABLED) {
    await startCallbackServer();
  }
});

Before(async function () {
  if (CALLBACK_ENABLED) {
    clearCallbacks();
  }
});

After(async function () {
  if (CALLBACK_ENABLED) {
    await stopCallbackServer();
  }
});
