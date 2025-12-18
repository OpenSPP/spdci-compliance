/**
 * Registry Security Step Definitions
 *
 * Domain-agnostic step definitions for authorization and signature testing.
 */

import chai from 'chai';
import pkg from 'pactum';
const { spec } = pkg;

import { Given, When, Then } from '@cucumber/cucumber';

import {
  assertOpenApiRequest,
  assertOpenApiResponse,
} from '../../../helpers/index.js';

import {
  applyCommonHeaders,
  getRequestPath,
  getAckStatus,
} from './helpers.js';

// Operation definitions for security testing
function getOperations(world) {
  return {
    'async search': {
      endpointName: 'asyncSearch',
      buildPayload: () => world.payloads.createSearchRequestPayload(),
    },
    'sync search': {
      endpointName: 'syncSearch',
      buildPayload: () => world.payloads.createSearchRequestPayload(),
    },
    'async subscribe': {
      endpointName: 'subscribe',
      buildPayload: () => world.payloads.createSubscribeRequestPayload(),
    },
    'async unsubscribe': {
      endpointName: 'unsubscribe',
      buildPayload: () => world.payloads.createUnsubscribeRequestPayload(),
    },
    'async txn status': {
      endpointName: 'asyncTxnStatus',
      buildPayload: () => world.payloads.createTxnStatusRequestPayload(),
    },
    'sync txn status': {
      endpointName: 'syncTxnStatus',
      buildPayload: () => world.payloads.createTxnStatusRequestPayload(),
    },
    'on-search': {
      endpointName: 'onSearch',
      buildPayload: () => world.payloads.createOnSearchPayload(),
    },
    'on-subscribe': {
      endpointName: 'onSubscribe',
      buildPayload: () => world.payloads.createOnSubscribePayload(),
    },
    'on-unsubscribe': {
      endpointName: 'onUnsubscribe',
      buildPayload: () => world.payloads.createOnUnsubscribePayload(),
    },
    'on-txn-status': {
      endpointName: 'onTxnStatus',
      buildPayload: () => world.payloads.createOnTxnStatusPayload(),
    },
    'notify': {
      endpointName: 'notify',
      buildPayload: () => world.payloads.createNotifyPayload(),
    },
  };
}

function getOperationDef(world, name) {
  const operations = getOperations(world);
  const key = String(name || '').toLowerCase().trim();
  const op = operations[key];
  if (!op) {
    throw new Error(`Unknown operation "${name}". Valid: ${Object.keys(operations).join(', ')}`);
  }
  return { key, ...op };
}

function assertHttpErrorResponse(body) {
  // Check for DCI error envelope format
  if (body?.message?.ack_status === 'ERR') {
    chai.expect(body.message.error, 'Expected error object in ERR response').to.exist;
    return;
  }

  // Check for RFC 7807 Problem Details
  if (body?.type && body?.title) {
    chai.expect(body.status, 'Expected status in problem details').to.exist;
    return;
  }

  // Check for simple error object
  if (body?.error) {
    return;
  }

  chai.assert.fail('Response body does not match any known error format');
}

// ============================================
// AUTHORIZATION TESTS
// ============================================

Given(/^A valid '([^']*)' request payload is prepared for auth testing$/, async function (operation) {
  const op = getOperationDef(this, operation);
  const payload = op.buildPayload();
  const endpoint = this.getEndpoint(op.endpointName);
  const requestPath = getRequestPath(endpoint, this.baseUrl);

  await assertOpenApiRequest({ path: requestPath, method: 'post', domain: this.domain }, payload);

  this.payload = payload;
  this.currentOperation = op;
  this.requestPath = requestPath;
});

When(/^The '([^']*)' request is sent without Authorization$/, async function (operation) {
  const op = getOperationDef(this, operation);
  const endpoint = this.getEndpoint(op.endpointName);
  const url = this.baseUrl + endpoint;

  const requestSpec = spec();
  applyCommonHeaders(requestSpec.post(url), { omitHeaders: ['Authorization'] });

  this.response = await requestSpec.withJson(this.payload);
});

Then(/^The request should be rejected as unauthorized$/, async function () {
  const status = Number(this.response.statusCode);
  const body = this.response.body;

  // Accept HTTP 401/403
  if (status === 401 || status === 403) {
    assertHttpErrorResponse(body);

    if (typeof this.attach === 'function') {
      await this.attach(JSON.stringify({
        kind: 'interop-variant',
        variant: 'http_401_403',
        status,
        operation: this.currentOperation?.key,
        path: this.requestPath,
      }, null, 2), 'application/json');
    }
    return;
  }

  // Accept HTTP 200 with ACK ERR
  if (status === 200 && getAckStatus(body) === 'ERR') {
    const errorCode = body?.message?.error?.code;
    const validCodes = ['err.request.unauthorized', 'err.request.forbidden'];

    chai.expect(
      validCodes,
      `Expected error code in ${validCodes.join(' or ')}, got "${errorCode}"`
    ).to.include(errorCode);

    if (typeof this.attach === 'function') {
      await this.attach(JSON.stringify({
        kind: 'interop-variant',
        variant: 'ack_err',
        status,
        operation: this.currentOperation?.key,
        path: this.requestPath,
        errorCode,
      }, null, 2), 'application/json');
    }
    return;
  }

  chai.assert.fail(
    `Expected HTTP 401/403 or HTTP 200 with ACK ERR, got HTTP ${status} with ack_status=${getAckStatus(body)}`
  );
});

// ============================================
// SIGNATURE TESTS
// ============================================

Given(/^A valid '([^']*)' request payload is prepared for signature testing$/, async function (operation) {
  // Check that auth token is available (needed for signature testing)
  const authToken = process.env.DCI_AUTH_TOKEN;
  const extraHeaders = process.env.EXTRA_HEADERS_JSON || process.env.EXTRA_HEADERS;

  if (!authToken && !extraHeaders) {
    throw new Error('Signature testing requires DCI_AUTH_TOKEN or EXTRA_HEADERS to be set');
  }

  const op = getOperationDef(this, operation);
  const payload = op.buildPayload();
  const endpoint = this.getEndpoint(op.endpointName);
  const requestPath = getRequestPath(endpoint, this.baseUrl);

  await assertOpenApiRequest({ path: requestPath, method: 'post', domain: this.domain }, payload);

  this.payload = payload;
  this.currentOperation = op;
  this.requestPath = requestPath;
});

When(/^The request signature is set to an invalid value$/, function () {
  this.payload = {
    ...this.payload,
    signature: 'invalid-signature',
  };
});

When(/^The '([^']*)' request is sent with the invalid signature$/, async function (operation) {
  const op = getOperationDef(this, operation);
  const endpoint = this.getEndpoint(op.endpointName);
  const url = this.baseUrl + endpoint;

  const requestSpec = spec();
  applyCommonHeaders(requestSpec.post(url));

  this.response = await requestSpec.withJson(this.payload);
});

Then(/^The request should be rejected due to invalid signature$/, async function () {
  const status = Number(this.response.statusCode);
  const body = this.response.body;

  // Accept HTTP 4xx
  if (status >= 400 && status < 500) {
    assertHttpErrorResponse(body);

    if (typeof this.attach === 'function') {
      await this.attach(JSON.stringify({
        kind: 'interop-variant',
        variant: 'http_4xx',
        status,
        operation: this.currentOperation?.key,
        path: this.requestPath,
      }, null, 2), 'application/json');
    }
    return;
  }

  // Accept HTTP 200 with ACK ERR
  if (status === 200 && getAckStatus(body) === 'ERR') {
    const errorCode = body?.message?.error?.code;
    const validCodes = ['err.signature.missing', 'err.signature.invalid'];

    chai.expect(
      validCodes,
      `Expected error code in ${validCodes.join(' or ')}, got "${errorCode}"`
    ).to.include(errorCode);

    if (typeof this.attach === 'function') {
      await this.attach(JSON.stringify({
        kind: 'interop-variant',
        variant: 'ack_err',
        status,
        operation: this.currentOperation?.key,
        path: this.requestPath,
        errorCode,
      }, null, 2), 'application/json');
    }
    return;
  }

  chai.assert.fail(
    `Expected HTTP 4xx or HTTP 200 with ACK ERR, got HTTP ${status} with ack_status=${getAckStatus(body)}`
  );
});
