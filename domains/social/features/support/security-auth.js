import chai from 'chai';
import pkg from 'pactum';
const { spec } = pkg;
import { Given, When, Then } from '@cucumber/cucumber';

import {
  localhost,
  applyCommonHeaders,
  getRequestPath,
  asyncsearchEndpoint,
  subscribeEndpoint,
  unsubscribeEndpoint,
  asynctxnstatusEndpoint,
  searchEndpoint,
  txnstatusEndpoint,
  onsearchEndpoint,
  onsubscribeEndpoint,
  onunsubscribeEndpoint,
  ontxnstatusEndpoint,
  notifyEndpoint,
  createSearchRequestPayload,
  createSubscribeRequestPayload,
  createUnsubscribeRequestPayload,
  createTxnStatusRequestPayload,
  createOnSearchPayload,
  createOnSubscribePayload,
  createOnUnsubscribePayload,
  createOnTxnStatusPayload,
  createNotifyPayload,
} from './helpers/index.js';

import { assertOpenApiRequest, assertOpenApiComponentResponse, assertHttpErrorResponse } from './helpers/index.js';

const OPERATIONS = {
  'async search': { endpoint: asyncsearchEndpoint, buildPayload: createSearchRequestPayload },
  'async subscribe': { endpoint: subscribeEndpoint, buildPayload: createSubscribeRequestPayload },
  'async unsubscribe': { endpoint: unsubscribeEndpoint, buildPayload: createUnsubscribeRequestPayload },
  'async txn status': { endpoint: asynctxnstatusEndpoint, buildPayload: createTxnStatusRequestPayload },
  'sync search': { endpoint: searchEndpoint, buildPayload: createSearchRequestPayload },
  'sync txn status': { endpoint: txnstatusEndpoint, buildPayload: createTxnStatusRequestPayload },
  'on-search callback': { endpoint: onsearchEndpoint, buildPayload: createOnSearchPayload },
  'on-subscribe callback': { endpoint: onsubscribeEndpoint, buildPayload: createOnSubscribePayload },
  'on-unsubscribe callback': { endpoint: onunsubscribeEndpoint, buildPayload: createOnUnsubscribePayload },
  'txn on-status callback': { endpoint: ontxnstatusEndpoint, buildPayload: createOnTxnStatusPayload },
  notify: { endpoint: notifyEndpoint, buildPayload: createNotifyPayload },
};

function getOperationDef(name) {
  const key = String(name || '').trim().toLowerCase();
  const op = OPERATIONS[key];
  if (!op) throw new Error(`Unknown operation "${name}". Valid: ${Object.keys(OPERATIONS).join(', ')}`);
  return { key, ...op };
}

Given(/^A valid "([^"]+)" request payload is prepared for auth testing$/, async function (operationName) {
  const op = getOperationDef(operationName);
  const endpoint = op.endpoint;
  const payload = op.buildPayload();

  await assertOpenApiRequest({ path: getRequestPath(endpoint), method: 'post' }, payload);

  this.operation = op.key;
  this.endpoint = endpoint;
  this.payload = payload;
});

When(/^The "([^"]+)" request is sent without Authorization$/, async function (operationName) {
  const op = getOperationDef(operationName);
  chai.expect(op.endpoint, 'Operation endpoint mismatch').to.equal(this.endpoint);

  const baseUrl = localhost + this.endpoint;
  const request = spec();
  applyCommonHeaders(request.post(baseUrl), { omitHeaders: ['Authorization'] });
  const response = await request.withJson(this.payload);
  this.response = response;
});

Then(/^The request should be rejected as unauthorized$/, async function () {
  chai.expect(this.response, 'Expected a response').to.exist;

  const status = Number(this.response.statusCode);
  const requestPath = getRequestPath(this.endpoint);

  let variant;
  if (status === 401 || status === 403) {
    await assertHttpErrorResponse(this.response.body);
    variant = 'http_401_403';
  } else if (status === 200) {
    await assertOpenApiComponentResponse('Response', this.response.body);
    chai.expect(this.response.body?.message?.ack_status, 'Expected ACK ERR for missing auth').to.equal('ERR');
    const code = this.response.body?.message?.error?.code;
    chai.expect(
      ['err.request.unauthorized', 'err.request.forbidden'],
      `Expected message.error.code to indicate auth failure, got "${code}"`
    ).to.include(code);
    variant = 'ack_err';
  } else {
    throw new Error(`Expected 401/403 or HTTP 200 with ACK ERR, got ${status}`);
  }

  const record = {
    kind: 'interop-variant',
    variant,
    status,
    operation: this.operation,
    path: requestPath,
  };

  if (typeof this.attach === 'function') {
    await this.attach(JSON.stringify(record, null, 2), 'application/json');
  }
});
