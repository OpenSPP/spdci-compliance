import chai from 'chai';
import pkg from 'pactum';
const { spec } = pkg;
import { Given, When, Then } from '@cucumber/cucumber';
import {
  localhost,
  defaultExpectedResponseTime,
  asynctxnstatusEndpoint,
  createTxnStatusRequestPayload,
  applyCommonHeaders,
  checkHeader,
  getRequestPath
} from './helpers/index.js';

import { assertOpenApiRequest, assertOpenApiResponse } from './helpers/index.js';

import chaiJsonSchema from 'chai-json-schema';
import chaiString from 'chai-string';

chai.use(chaiString);
chai.use(chaiJsonSchema);

const baseUrl = localhost + asynctxnstatusEndpoint;

let specTxnStatus;

Given(/^System wants to check transaction status in FR$/, function () {
  specTxnStatus = spec();
});

When(/^A POST request to FR txn status is sent$/, async function () {
  try {
    applyCommonHeaders(specTxnStatus.post(baseUrl));
    const payload = createTxnStatusRequestPayload();
    await assertOpenApiRequest({ path: getRequestPath(asynctxnstatusEndpoint), method: 'post' }, payload, 'fr');
    const response = await specTxnStatus.withJson(payload);
    this.response = response;
  } catch (err) {
    console.error("Request failed", err);
    throw err;
  }
});

Then(/^The response from the FR txn status should be received$/, async function () {
  chai.expect(this.response).to.exist;
});

Then(/^The FR txn status response should have status (\d+)$/, async function(status) {
  chai.expect(this.response.statusCode).to.equal(Number(status));
});

Then(/^The FR txn status response should have status (\d+) or (\d+)$/, async function(statusA, statusB) {
  const allowed = [Number(statusA), Number(statusB)];
  chai.expect(
    allowed,
    `Expected status ${statusA} or ${statusB}, got ${this.response.statusCode}`
  ).to.include(Number(this.response.statusCode));
});

Then(/^The FR txn status response should have "([^"]*)": "([^"]*)" header$/, async function(key, value) {
  const { ok, actualValue, reason } = checkHeader(this.response.rawHeaders, key, value);
  const msg = reason === 'missing'
    ? `Expected header "${key}" to be present`
    : `Expected header "${key}" to be "${value}", got "${actualValue}"`;
  chai.expect(ok, msg).to.be.true;
});

Then(/^The FR txn status response should be returned in a timely manner$/, async function() {
  chai.expect(this.response.responseTime).to.be.lessThan(defaultExpectedResponseTime);
});

Then(/^The FR txn status response should match the expected JSON schema$/, async function() {
  await assertOpenApiResponse(
    { path: getRequestPath(asynctxnstatusEndpoint), method: 'post', statusCode: this.response.statusCode },
    this.response.body,
    'fr'
  );
});
