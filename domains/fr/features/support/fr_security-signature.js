import chai from 'chai';
import pkg from 'pactum';
const { spec } = pkg;
import { Given, When, Then } from '@cucumber/cucumber';

import {
  localhost,
  extraHeaders,
  applyCommonHeaders,
  getRequestPath,
  asyncsearchEndpoint,
  searchEndpoint,
  createSearchRequestPayload,
} from './helpers/index.js';

import { assertOpenApiRequest, assertOpenApiComponentResponse, assertHttpErrorResponse } from './helpers/index.js';

const OPERATIONS = {
  'async search': { endpoint: asyncsearchEndpoint, buildPayload: createSearchRequestPayload },
  'sync search': { endpoint: searchEndpoint, buildPayload: createSearchRequestPayload },
};

function hasAuthorizationHeader() {
  return Array.isArray(extraHeaders) && extraHeaders.some(h => String(h?.key || '').toLowerCase() === 'authorization');
}

function getOperationDef(name) {
  const key = String(name || '').trim().toLowerCase();
  const op = OPERATIONS[key];
  if (!op) throw new Error(`Unknown operation "${name}". Valid: ${Object.keys(OPERATIONS).join(', ')}`);
  return { key, ...op };
}

Given(/^A valid '([^']+)' request payload is prepared for signature testing$/, async function (operationName) {
  if (!hasAuthorizationHeader()) {
    throw new Error(
      'Signature SECURITY tests require an Authorization header. Set DCI_AUTH_TOKEN or EXTRA_HEADERS_JSON/EXTRA_HEADERS to include Authorization.'
    );
  }

  const op = getOperationDef(operationName);
  const endpoint = op.endpoint;
  const payload = op.buildPayload();

  await assertOpenApiRequest({ path: getRequestPath(endpoint), method: 'post' }, payload, 'fr');

  this.operation = op.key;
  this.endpoint = endpoint;
  this.payload = payload;
});

When(/^The request signature is set to an invalid value$/, async function () {
  const payload = typeof structuredClone === 'function' ? structuredClone(this.payload) : JSON.parse(JSON.stringify(this.payload));
  payload.signature = 'invalid-signature';
  this.payload = payload;
});

When(/^The '([^']+)' request is sent with the invalid signature$/, async function (operationName) {
  const op = getOperationDef(operationName);
  chai.expect(op.endpoint, 'Operation endpoint mismatch').to.equal(this.endpoint);

  const baseUrl = localhost + this.endpoint;
  const request = spec();
  applyCommonHeaders(request.post(baseUrl));
  const response = await request.withJson(this.payload);
  this.response = response;
});

Then(/^The request should be rejected due to invalid signature$/, async function () {
  chai.expect(this.response, 'Expected a response').to.exist;

  const status = Number(this.response.statusCode);
  const requestPath = getRequestPath(this.endpoint);

  let variant;
  let errorCode;
  if (status >= 400 && status < 500) {
    await assertHttpErrorResponse(this.response.body);
    variant = 'http_4xx';
  } else if (status === 200) {
    await assertOpenApiComponentResponse('Response', this.response.body);
    chai.expect(this.response.body?.message?.ack_status, 'Expected ACK ERR for invalid signature').to.equal('ERR');
    errorCode = this.response.body?.message?.error?.code;
    chai.expect(
      ['err.signature.missing', 'err.signature.invalid'],
      `Expected signature error code, got "${errorCode}"`
    ).to.include(errorCode);
    variant = 'ack_err';
  } else {
    throw new Error(`Expected HTTP 4xx or HTTP 200 with ACK ERR, got ${status}`);
  }

  const record = {
    kind: 'interop-variant',
    variant,
    status,
    operation: this.operation,
    path: requestPath,
    errorCode,
  };

  if (typeof this.attach === 'function') {
    await this.attach(JSON.stringify(record, null, 2), 'application/json');
  }
});
