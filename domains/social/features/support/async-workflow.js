import chai from 'chai';
import pkg from 'pactum';
const { spec } = pkg;

import { Given, When, Then } from '@cucumber/cucumber';

import {
  localhost,
  asyncsearchEndpoint,
  subscribeEndpoint,
  unsubscribeEndpoint,
  asynctxnstatusEndpoint,
  createSearchRequestPayload,
  createSubscribeRequestPayload,
  createUnsubscribeRequestPayload,
  createTxnStatusRequestPayload,
  applyCommonHeaders,
  getRequestPath,
  getCallbackPathForAction,
} from './helpers/index.js';

import { assertOpenApiRequest, assertOpenApiResponse } from './helpers/index.js';
import { waitForCallback } from './helpers/callback-server.js';

function getCallbackWaitMs() {
  const raw = process.env.CALLBACK_WAIT_MS;
  const parsed = raw ? Number(raw) : NaN;
  if (!Number.isFinite(parsed) || parsed <= 0) return 120000;
  return parsed;
}

function getAckStatus(body) {
  return body?.message?.ack_status;
}

function getAckCorrelationId(body) {
  return body?.message?.correlation_id;
}

async function sendAsyncRequest(world, { action, endpoint, payload }) {
  const url = localhost + endpoint;
  const requestPath = getRequestPath(endpoint);

  const requestSpec = spec();
  applyCommonHeaders(requestSpec.post(url));

  await assertOpenApiRequest({ path: requestPath, method: 'post' }, payload);
  const response = await requestSpec.withJson(payload);

  world.workflow = { action, endpoint, requestPath, payload, response };
}

Given(/^Callback receiver is ready$/, function () {
  const baseUrl = process.env.CALLBACK_SERVER_BASE_URL;
  chai.expect(baseUrl, 'CALLBACK_SERVER_BASE_URL is not set; is CALLBACK_SERVER_ENABLED=true?').to.be.a('string');
});

When(/^SP sends an async search request to SR expecting a callback$/, async function () {
  await sendAsyncRequest(this, {
    action: 'search',
    endpoint: asyncsearchEndpoint,
    payload: createSearchRequestPayload(),
  });
});

When(/^SP sends an async subscribe request to SR expecting a callback$/, async function () {
  await sendAsyncRequest(this, {
    action: 'subscribe',
    endpoint: subscribeEndpoint,
    payload: createSubscribeRequestPayload(),
  });
});

When(/^SP sends an async unsubscribe request to SR expecting a callback$/, async function () {
  await sendAsyncRequest(this, {
    action: 'unsubscribe',
    endpoint: unsubscribeEndpoint,
    payload: createUnsubscribeRequestPayload(),
  });
});

When(/^SP sends an async txn status request to SR expecting a callback$/, async function () {
  await sendAsyncRequest(this, {
    action: 'txn-status',
    endpoint: asynctxnstatusEndpoint,
    payload: createTxnStatusRequestPayload(),
  });
});

Then(/^SR should respond with ACK for the async request$/, async function () {
  chai.expect(this.workflow, 'Missing workflow context; did the request step run?').to.exist;

  const { requestPath, endpoint, response } = this.workflow;
  chai.expect([200, 202], `Expected HTTP 200/202, got ${response.statusCode}`).to.include(Number(response.statusCode));

  await assertOpenApiResponse({ path: requestPath, method: 'post', statusCode: response.statusCode }, response.body);

  chai.expect(getAckStatus(response.body), 'Expected ack_status in response body').to.equal('ACK');
  chai.expect(getAckCorrelationId(response.body), 'Expected correlation_id in ACK response').to.be.a('string').and.not.empty;

  // Helpful debug output when running in CI/log-only environments.
  if (!process.env.QUIET_LOGS) {
    console.log(`[workflow] ${endpoint} ACK correlation_id=${getAckCorrelationId(response.body)}`);
  }
});

Then(/^SR should call the on-search callback with matching ids$/, async function () {
  const { payload, response } = this.workflow;
  const expectedTxn = payload?.message?.transaction_id;
  const expectedCorr = getAckCorrelationId(response.body);
  const path = getCallbackPathForAction('search');

  const record = await waitForCallback(
    {
      path,
      predicate: r =>
        r?.body?.header?.action === 'on-search' &&
        r?.body?.message?.transaction_id === expectedTxn &&
        r?.body?.message?.correlation_id === expectedCorr,
    },
    getCallbackWaitMs()
  );

  chai.expect(record, 'Expected on-search callback to be received').to.exist;
});

Then(/^SR should call the on-subscribe callback with matching ids$/, async function () {
  const { payload, response } = this.workflow;
  const expectedTxn = payload?.message?.transaction_id;
  const expectedCorr = getAckCorrelationId(response.body);
  const path = getCallbackPathForAction('subscribe');

  const record = await waitForCallback(
    {
      path,
      predicate: r =>
        r?.body?.header?.action === 'on-subscribe' &&
        r?.body?.message?.transaction_id === expectedTxn &&
        r?.body?.message?.correlation_id === expectedCorr,
    },
    getCallbackWaitMs()
  );

  chai.expect(record, 'Expected on-subscribe callback to be received').to.exist;
});

Then(/^SR should call the on-unsubscribe callback with matching ids$/, async function () {
  const { payload, response } = this.workflow;
  const expectedTxn = payload?.message?.transaction_id;
  const expectedCorr = getAckCorrelationId(response.body);
  const path = getCallbackPathForAction('unsubscribe');

  const record = await waitForCallback(
    {
      path,
      predicate: r =>
        r?.body?.header?.action === 'on-unsubscribe' &&
        r?.body?.message?.transaction_id === expectedTxn &&
        r?.body?.message?.correlation_id === expectedCorr,
    },
    getCallbackWaitMs()
  );

  chai.expect(record, 'Expected on-unsubscribe callback to be received').to.exist;
});

Then(/^SR should call the txn on-status callback with matching ids$/, async function () {
  const { payload, response } = this.workflow;
  const expectedTxn = payload?.message?.transaction_id;
  const expectedCorr = getAckCorrelationId(response.body);
  const path = getCallbackPathForAction('txn-status');

  const record = await waitForCallback(
    {
      path,
      predicate: r =>
        r?.body?.header?.action === 'txn-on-status' &&
        r?.body?.message?.transaction_id === expectedTxn &&
        r?.body?.message?.correlation_id === expectedCorr,
    },
    getCallbackWaitMs()
  );

  chai.expect(record, 'Expected txn on-status callback to be received').to.exist;
});

