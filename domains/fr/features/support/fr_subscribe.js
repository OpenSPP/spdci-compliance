import chai from 'chai';
import pkg from 'pactum';
const { spec } = pkg;
import { Given, When, Then } from '@cucumber/cucumber';
import {
  localhost,
  defaultExpectedResponseTime,
  subscribeEndpoint,
  createSubscribeRequestPayload,
  applyCommonHeaders,
  checkHeader,
  getRequestPath
} from './helpers/index.js';

import { assertOpenApiRequest, assertOpenApiResponse } from './helpers/index.js';

import chaiJsonSchema from 'chai-json-schema';
import chaiString from 'chai-string';

chai.use(chaiString);
chai.use(chaiJsonSchema);

const baseUrl = localhost + subscribeEndpoint;

let specSubscribe;

Given(/^System wants to subscribe to FR events$/, function () {
  specSubscribe = spec();
});

When(/^A POST request to FR subscribe is sent$/, async function () {
  try {
    applyCommonHeaders(specSubscribe.post(baseUrl));
    const payload = createSubscribeRequestPayload();
    await assertOpenApiRequest({ path: getRequestPath(subscribeEndpoint), method: 'post' }, payload, 'fr');
    const response = await specSubscribe.withJson(payload);
    this.response = response;
  } catch (err) {
    console.error("Request failed", err);
    throw err;
  }
});

Then(/^The response from the FR subscribe should be received$/, async function () {
  chai.expect(this.response).to.exist;
});

Then(/^The FR subscribe response should have status (\d+)$/, async function(status) {
  chai.expect(this.response.statusCode).to.equal(Number(status));
});

Then(/^The FR subscribe response should have status (\d+) or (\d+)$/, async function(statusA, statusB) {
  const allowed = [Number(statusA), Number(statusB)];
  chai.expect(
    allowed,
    `Expected status ${statusA} or ${statusB}, got ${this.response.statusCode}`
  ).to.include(Number(this.response.statusCode));
});

Then(/^The FR subscribe response should have "([^"]*)": "([^"]*)" header$/, async function(key, value) {
  const { ok, actualValue, reason } = checkHeader(this.response.rawHeaders, key, value);
  const msg = reason === 'missing'
    ? `Expected header "${key}" to be present`
    : `Expected header "${key}" to be "${value}", got "${actualValue}"`;
  chai.expect(ok, msg).to.be.true;
});

Then(/^The FR subscribe response should be returned in a timely manner$/, async function() {
  chai.expect(this.response.responseTime).to.be.lessThan(defaultExpectedResponseTime);
});

Then(/^The FR subscribe response should have ack_status ACK$/, async function() {
  chai.expect(this.response.body?.message?.ack_status).to.equal('ACK');
});

Then(/^The FR subscribe response should match the expected JSON schema$/, async function() {
  await assertOpenApiResponse(
    { path: getRequestPath(subscribeEndpoint), method: 'post', statusCode: this.response.statusCode },
    this.response.body,
    'fr'
  );
});
