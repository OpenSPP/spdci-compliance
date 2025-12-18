import chai from 'chai';
import pkg from 'pactum';
const { spec } = pkg;
import { Given, When, Then } from '@cucumber/cucumber';
import {
  localhost,
  defaultExpectedResponseTime,
  ontxnstatusEndpoint,
  createOnTxnStatusPayload,
  applyCommonHeaders,
  checkHeader,
  getRequestPath
} from './helpers/index.js';

import { assertOpenApiRequest, assertOpenApiResponse } from './helpers/index.js';

const baseUrl = localhost + ontxnstatusEndpoint;

let specTxnOnStatus;

Given(/^CRVS wants to send a txn on-status callback$/, function () {
  specTxnOnStatus = spec();
});

When(/^A POST request to txn on-status callback is sent$/, async function () {
  applyCommonHeaders(specTxnOnStatus.post(baseUrl));
  const payload = createOnTxnStatusPayload();
  await assertOpenApiRequest({ path: getRequestPath(ontxnstatusEndpoint), method: 'post' }, payload, 'crvs');
  const response = await specTxnOnStatus.withJson(payload);
  this.response = response;
});

Then(/^The txn on-status callback response should be received$/, async function () {
  chai.expect(this.response).to.exist;
});

Then(/^The txn on-status callback response should have status (\d+) or (\d+)$/, async function(statusA, statusB) {
  const allowed = [Number(statusA), Number(statusB)];
  chai.expect(
    allowed,
    `Expected status ${statusA} or ${statusB}, got ${this.response.statusCode}`
  ).to.include(Number(this.response.statusCode));
});

Then(/^The txn on-status callback response should have "([^"]*)": "([^"]*)" header$/, async function(key, value) {
  const { ok, actualValue, reason } = checkHeader(this.response.rawHeaders, key, value);
  const msg = reason === 'missing'
    ? `Expected header "${key}" to be present`
    : `Expected header "${key}" to be "${value}", got "${actualValue}"`;
  chai.expect(ok, msg).to.be.true;
});

Then(/^The txn on-status callback response should be returned in a timely manner$/, async function() {
  chai.expect(this.response.responseTime).to.be.lessThan(defaultExpectedResponseTime);
});

Then(/^The txn on-status callback response should match the expected JSON schema$/, async function() {
  await assertOpenApiResponse(
    { path: getRequestPath(ontxnstatusEndpoint), method: 'post', statusCode: this.response.statusCode },
    this.response.body,
    'crvs'
  );
});
