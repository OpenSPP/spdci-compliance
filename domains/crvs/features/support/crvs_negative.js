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
  'async search': {
    endpoint: asyncsearchEndpoint,
    buildPayload: createSearchRequestPayload,
  },
  'subscribe': {
    endpoint: subscribeEndpoint,
    buildPayload: createSubscribeRequestPayload,
  },
  'unsubscribe': {
    endpoint: unsubscribeEndpoint,
    buildPayload: createUnsubscribeRequestPayload,
  },
  'async txn status': {
    endpoint: asynctxnstatusEndpoint,
    buildPayload: createTxnStatusRequestPayload,
  },
  'sync search': {
    endpoint: searchEndpoint,
    buildPayload: createSearchRequestPayload,
  },
  'sync txn status': {
    endpoint: txnstatusEndpoint,
    buildPayload: createTxnStatusRequestPayload,
  },
  'on-search callback': {
    endpoint: onsearchEndpoint,
    buildPayload: createOnSearchPayload,
  },
  'on-subscribe callback': {
    endpoint: onsubscribeEndpoint,
    buildPayload: createOnSubscribePayload,
  },
  'on-unsubscribe callback': {
    endpoint: onunsubscribeEndpoint,
    buildPayload: createOnUnsubscribePayload,
  },
  'txn on-status callback': {
    endpoint: ontxnstatusEndpoint,
    buildPayload: createOnTxnStatusPayload,
  },
  notify: {
    endpoint: notifyEndpoint,
    buildPayload: createNotifyPayload,
  },
};

function getOperationDef(name) {
  const key = String(name || '').trim().toLowerCase();
  const op = OPERATIONS[key];
  if (!op) {
    throw new Error(`Unknown operation "${name}". Valid: ${Object.keys(OPERATIONS).join(', ')}`);
  }
  return { key, ...op };
}

function clone(obj) {
  return typeof structuredClone === 'function' ? structuredClone(obj) : JSON.parse(JSON.stringify(obj));
}

Given(/^A valid CRVS "([^"]+)" request payload is prepared$/, async function (operationName) {
  const op = getOperationDef(operationName);
  const endpoint = op.endpoint;
  const payload = op.buildPayload();

  await assertOpenApiRequest({ path: getRequestPath(endpoint), method: 'post' }, payload, 'crvs');

  this.operation = op.key;
  this.endpoint = endpoint;
  this.payload = payload;
});

When(/^The CRVS payload is made invalid by removing "([^"]+)"$/, async function (field) {
  const payload = clone(this.payload);
  delete payload[field];

  let didFail = false;
  try {
    await assertOpenApiRequest({ path: getRequestPath(this.endpoint), method: 'post' }, payload, 'crvs');
  } catch {
    didFail = true;
  }
  chai.expect(didFail, `Expected payload to be OpenAPI-invalid after removing "${field}"`).to.equal(true);

  this.payload = payload;
});

When(/^The invalid CRVS "([^"]+)" request is sent$/, async function (operationName) {
  const op = getOperationDef(operationName);
  chai.expect(op.endpoint, 'Operation endpoint mismatch').to.equal(this.endpoint);

  const baseUrl = localhost + this.endpoint;
  const request = spec();
  applyCommonHeaders(request.post(baseUrl));
  const response = await request.withJson(this.payload);
  this.response = response;
});

Then(/^The CRVS implementation should reject the invalid request$/, async function () {
  chai.expect(this.response, 'Expected a response').to.exist;

  const status = Number(this.response.statusCode);

  let variant;
  if (status >= 400 && status < 500) {
    await assertHttpErrorResponse(this.response.body);
    variant = 'http_4xx';
  } else if (status === 200) {
    await assertOpenApiComponentResponse('Response', this.response.body, 'crvs');
    chai.expect(this.response.body?.message?.ack_status, 'Expected ACK ERR for invalid payload').to.equal('ERR');
    variant = 'ack_err';
  } else {
    throw new Error(`Expected HTTP 4xx or HTTP 200 with ACK ERR, got ${status}`);
  }

  const interopRecord = {
    kind: 'interop-variant',
    variant,
    status,
    operation: this.operation,
    path: getRequestPath(this.endpoint),
  };

  if (typeof this.attach === 'function') {
    await this.attach(JSON.stringify(interopRecord, null, 2), 'application/json');
  }
});
