/**
 * Registry Async Workflow Step Definitions
 *
 * Domain-agnostic step definitions for async callback workflow testing.
 * These steps test the full async request -> ACK -> callback flow.
 */

import chai from 'chai';
import pkg from 'pactum';
const { spec } = pkg;

import { Given, When, Then } from '@cucumber/cucumber';

import {
  getEndpoint,
  getCallbackPath,
  assertOpenApiRequest,
  assertOpenApiResponse,
  waitForCallback,
} from '../../../helpers/index.js';

import {
  applyCommonHeaders,
  getRequestPath,
} from './helpers.js';

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

async function sendAsyncRequest(world, { action, endpointName, payloadFactory }) {
  const endpoint = world.getEndpoint(endpointName);
  const url = world.baseUrl + endpoint;
  const requestPath = getRequestPath(endpoint, world.baseUrl);

  const requestSpec = spec();
  applyCommonHeaders(requestSpec.post(url));

  const payload = payloadFactory();
  await assertOpenApiRequest({ path: requestPath, method: 'post', domain: world.domain }, payload);
  const response = await requestSpec.withJson(payload);

  world.setWorkflow({ action, endpoint, requestPath, payload, response });
}

// ============================================
// GIVEN STEPS
// ============================================

Given(/^Callback receiver is ready$/, function () {
  const baseUrl = process.env.CALLBACK_SERVER_BASE_URL;
  chai.expect(baseUrl, 'CALLBACK_SERVER_BASE_URL is not set; is CALLBACK_SERVER_ENABLED=true?').to.be.a('string');
});

// ============================================
// WHEN STEPS - Generic async request patterns
// ============================================

When(/^(?:SP|Client) sends an async search request to (?:the registry|SR|FR|CRVS) expecting a callback$/, async function () {
  await sendAsyncRequest(this, {
    action: 'search',
    endpointName: 'asyncSearch',
    payloadFactory: this.payloads.createSearchRequestPayload,
  });
});

When(/^(?:SP|Client) sends an async subscribe request to (?:the registry|SR|FR|CRVS) expecting a callback$/, async function () {
  await sendAsyncRequest(this, {
    action: 'subscribe',
    endpointName: 'subscribe',
    payloadFactory: this.payloads.createSubscribeRequestPayload,
  });
});

When(/^(?:SP|Client) sends an async unsubscribe request to (?:the registry|SR|FR|CRVS) expecting a callback$/, async function () {
  await sendAsyncRequest(this, {
    action: 'unsubscribe',
    endpointName: 'unsubscribe',
    payloadFactory: this.payloads.createUnsubscribeRequestPayload,
  });
});

When(/^(?:SP|Client) sends an async txn status request to (?:the registry|SR|FR|CRVS) expecting a callback$/, async function () {
  await sendAsyncRequest(this, {
    action: 'txn-status',
    endpointName: 'asyncTxnStatus',
    payloadFactory: this.payloads.createTxnStatusRequestPayload,
  });
});

// ============================================
// THEN STEPS - ACK validation
// ============================================

Then(/^(?:The registry|SR|FR|CRVS) should respond with ACK for the async request$/, async function () {
  chai.expect(this.workflow, 'Missing workflow context; did the request step run?').to.exist;

  const { requestPath, endpoint, response } = this.workflow;
  chai.expect([200, 202], `Expected HTTP 200/202, got ${response.statusCode}`).to.include(Number(response.statusCode));

  await assertOpenApiResponse(
    { path: requestPath, method: 'post', statusCode: response.statusCode, domain: this.domain },
    response.body
  );

  chai.expect(getAckStatus(response.body), 'Expected ack_status in response body').to.equal('ACK');
  chai.expect(getAckCorrelationId(response.body), 'Expected correlation_id in ACK response').to.be.a('string').and.not.empty;

  if (!process.env.QUIET_LOGS) {
    console.log(`[workflow] ${endpoint} ACK correlation_id=${getAckCorrelationId(response.body)}`);
  }
});

// ============================================
// THEN STEPS - Callback validation
// ============================================

Then(/^(?:The registry|SR|FR|CRVS) should call the on-search callback with matching ids$/, async function () {
  const { payload, response } = this.workflow;
  const expectedTxn = payload?.message?.transaction_id;
  const expectedCorr = getAckCorrelationId(response.body);
  const path = this.getCallbackPath('search');

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

Then(/^(?:The registry|SR|FR|CRVS) should call the on-subscribe callback with matching ids$/, async function () {
  const { payload, response } = this.workflow;
  const expectedTxn = payload?.message?.transaction_id;
  const expectedCorr = getAckCorrelationId(response.body);
  const path = this.getCallbackPath('subscribe');

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

Then(/^(?:The registry|SR|FR|CRVS) should call the on-unsubscribe callback with matching ids$/, async function () {
  const { payload, response } = this.workflow;
  const expectedTxn = payload?.message?.transaction_id;
  const expectedCorr = getAckCorrelationId(response.body);
  const path = this.getCallbackPath('unsubscribe');

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

Then(/^(?:The registry|SR|FR|CRVS) should call the txn on-status callback with matching ids$/, async function () {
  const { payload, response } = this.workflow;
  const expectedTxn = payload?.message?.transaction_id;
  const expectedCorr = getAckCorrelationId(response.body);
  const path = this.getCallbackPath('txn-status');

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
