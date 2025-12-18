/**
 * Registry Negative Test Step Definitions
 *
 * Domain-agnostic step definitions for testing error handling and invalid requests.
 */

import chai from 'chai';
import pkg from 'pactum';
const { spec } = pkg;

import { Given, When, Then } from '@cucumber/cucumber';

import {
  assertOpenApiRequest,
} from '../../../helpers/index.js';

import {
  applyCommonHeaders,
  getRequestPath,
  getAckStatus,
} from './helpers.js';

// Operation definitions for negative testing
function getOperations(world) {
  return {
    'search': {
      endpointName: 'asyncSearch',
      buildPayload: () => world.payloads.createSearchRequestPayload(),
    },
    'async search': {
      endpointName: 'asyncSearch',
      buildPayload: () => world.payloads.createSearchRequestPayload(),
    },
    'sync search': {
      endpointName: 'syncSearch',
      buildPayload: () => world.payloads.createSearchRequestPayload(),
    },
    'subscribe': {
      endpointName: 'subscribe',
      buildPayload: () => world.payloads.createSubscribeRequestPayload(),
    },
    'unsubscribe': {
      endpointName: 'unsubscribe',
      buildPayload: () => world.payloads.createUnsubscribeRequestPayload(),
    },
    'txn status': {
      endpointName: 'asyncTxnStatus',
      buildPayload: () => world.payloads.createTxnStatusRequestPayload(),
    },
    'sync txn status': {
      endpointName: 'syncTxnStatus',
      buildPayload: () => world.payloads.createTxnStatusRequestPayload(),
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
// NEGATIVE TEST STEPS
// ============================================

Given(/^A valid '([^']*)' request payload is prepared$/, async function (operation) {
  const op = getOperationDef(this, operation);
  const payload = op.buildPayload();
  const endpoint = this.getEndpoint(op.endpointName);
  const requestPath = getRequestPath(endpoint, this.baseUrl);

  await assertOpenApiRequest({ path: requestPath, method: 'post', domain: this.domain }, payload);

  this.payload = payload;
  this.currentOperation = op;
  this.requestPath = requestPath;
});

When(/^The payload is made invalid by removing '([^']*)'$/, function (field) {
  // Clone payload to avoid mutation
  const payload = structuredClone(this.payload);

  // Handle nested field paths (e.g., 'message.transaction_id')
  const parts = field.split('.');
  let obj = payload;

  for (let i = 0; i < parts.length - 1; i++) {
    if (obj[parts[i]] === undefined) {
      throw new Error(`Field path "${field}" not found: "${parts[i]}" is undefined`);
    }
    obj = obj[parts[i]];
  }

  const lastPart = parts[parts.length - 1];
  if (obj[lastPart] === undefined) {
    throw new Error(`Field "${field}" not found in payload`);
  }

  delete obj[lastPart];
  this.payload = payload;
});

When(/^The invalid '([^']*)' request is sent$/, async function (operation) {
  const op = getOperationDef(this, operation);
  const endpoint = this.getEndpoint(op.endpointName);
  const url = this.baseUrl + endpoint;

  const requestSpec = spec();
  applyCommonHeaders(requestSpec.post(url));

  this.response = await requestSpec.withJson(this.payload);
});

Then(/^The response should indicate a validation error$/, async function () {
  const status = Number(this.response.statusCode);
  const body = this.response.body;

  // Accept HTTP 400/422 (Bad Request / Unprocessable Entity)
  if (status === 400 || status === 422) {
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
    `Expected HTTP 400/422 or HTTP 200 with ACK ERR, got HTTP ${status} with ack_status=${getAckStatus(body)}`
  );
});

// ============================================
// ADDITIONAL NEGATIVE TEST PATTERNS
// ============================================

When(/^The payload signature is removed$/, function () {
  const payload = structuredClone(this.payload);
  delete payload.signature;
  this.payload = payload;
});

When(/^The payload header is removed$/, function () {
  const payload = structuredClone(this.payload);
  delete payload.header;
  this.payload = payload;
});

When(/^The payload message is removed$/, function () {
  const payload = structuredClone(this.payload);
  delete payload.message;
  this.payload = payload;
});

When(/^The payload is set to an empty object$/, function () {
  this.payload = {};
});

When(/^The payload is set to null$/, function () {
  this.payload = null;
});

Then(/^The response should have status (\d+)$/, async function (status) {
  chai.expect(this.response.statusCode).to.equal(Number(status));
});

Then(/^The response should have status (\d+) or (\d+)$/, async function (statusA, statusB) {
  const allowed = [Number(statusA), Number(statusB)];
  chai.expect(
    allowed,
    `Expected status ${statusA} or ${statusB}, got ${this.response.statusCode}`
  ).to.include(Number(this.response.statusCode));
});

Then(/^The response should have status (\d+) or (\d+) or (\d+)$/, async function (statusA, statusB, statusC) {
  const allowed = [Number(statusA), Number(statusB), Number(statusC)];
  chai.expect(
    allowed,
    `Expected status ${statusA}, ${statusB} or ${statusC}, got ${this.response.statusCode}`
  ).to.include(Number(this.response.statusCode));
});
