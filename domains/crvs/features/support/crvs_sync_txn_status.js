import chai from 'chai';
import pkg from 'pactum';
const { spec } = pkg;
import { Given, When, Then } from '@cucumber/cucumber';
import {
  localhost,
  defaultExpectedResponseTime,
  txnstatusEndpoint,
  createTxnStatusRequestPayload,
  applyCommonHeaders,
  checkHeader,
  getRequestPath
} from './helpers/index.js';

import { assertOpenApiRequest, assertOpenApiResponse } from './helpers/index.js';

const baseUrl = localhost + txnstatusEndpoint;

let specSyncTxnStatus;

Given(/^System wants to check sync transaction status in CRVS$/, function () {
  specSyncTxnStatus = spec();
});

When(/^A POST request to sync txn status is sent$/, async function () {
  applyCommonHeaders(specSyncTxnStatus.post(baseUrl));
  const payload = createTxnStatusRequestPayload();
  await assertOpenApiRequest({ path: getRequestPath(txnstatusEndpoint), method: 'post' }, payload, 'crvs');
  const response = await specSyncTxnStatus.withJson(payload);
  this.response = response;
});

Then(/^The sync txn status response should be received$/, async function () {
  chai.expect(this.response).to.exist;
});

Then(/^The sync txn status response should have status (\d+) or (\d+)$/, async function(statusA, statusB) {
  const allowed = [Number(statusA), Number(statusB)];
  chai.expect(
    allowed,
    `Expected status ${statusA} or ${statusB}, got ${this.response.statusCode}`
  ).to.include(Number(this.response.statusCode));
});

Then(/^The sync txn status response should have "([^"]*)": "([^"]*)" header$/, async function(key, value) {
  const { ok, actualValue, reason } = checkHeader(this.response.rawHeaders, key, value);
  const msg = reason === 'missing'
    ? `Expected header "${key}" to be present`
    : `Expected header "${key}" to be "${value}", got "${actualValue}"`;
  chai.expect(ok, msg).to.be.true;
});

Then(/^The sync txn status response should be returned in a timely manner$/, async function() {
  chai.expect(this.response.responseTime).to.be.lessThan(defaultExpectedResponseTime);
});

Then(/^The sync txn status response should match the expected JSON schema$/, async function() {
  await assertOpenApiResponse(
    { path: getRequestPath(txnstatusEndpoint), method: 'post', statusCode: this.response.statusCode },
    this.response.body,
    'crvs'
  );
});
