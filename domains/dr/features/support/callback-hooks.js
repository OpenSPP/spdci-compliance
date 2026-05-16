import { Before, After } from '@cucumber/cucumber';
import { startCallbackServer, stopCallbackServer, clearCallbacks, getCallbackUrl } from '../../../../common/helpers/callback-server.js';

const callbackEnabled = String(process.env.CALLBACK_SERVER_ENABLED || '').toLowerCase() === 'true';

Before(async function () {
  if (!callbackEnabled) return;

  await startCallbackServer();
  process.env.CALLBACK_SERVER_BASE_URL ||= getCallbackUrl('/');
  clearCallbacks();
});

After(async function () {
  if (callbackEnabled) {
    await new Promise(resolve => setTimeout(resolve, 50));
    await stopCallbackServer();
  }
});
