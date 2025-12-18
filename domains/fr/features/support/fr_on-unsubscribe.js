import chai from 'chai';
import pkg from 'pactum';
const { spec } = pkg;
import { Given, When, Then } from '@cucumber/cucumber';
import {
  localhost,
  defaultExpectedResponseTime,
  onunsubscribeEndpoint,
  createOnUnsubscribePayload,
  applyCommonHeaders,
  checkHeader,
  getRequestPath
} from './helpers/index.js';

import { assertOpenApiRequest, assertOpenApiResponse } from './helpers/index.js';

const baseUrl = localhost + onunsubscribeEndpoint;

let specOnUnsubscribe;

Given(/^FR wants to send an on-unsubscribe callback$/, function () {
  specOnUnsubscribe = spec();
});

When(/^A POST request to on-unsubscribe callback is sent$/, async function () {
  applyCommonHeaders(specOnUnsubscribe.post(baseUrl));
  const payload = createOnUnsubscribePayload();
  await assertOpenApiRequest({ path: getRequestPath(onunsubscribeEndpoint), method: 'post' }, payload, 'fr');
  const response = await specOnUnsubscribe.withJson(payload);
  this.response = response;
});

Then(/^The on-unsubscribe callback response should be received$/, async function () {
  chai.expect(this.response).to.exist;
});

Then(/^The on-unsubscribe callback response should have status (\d+) or (\d+)$/, async function(statusA, statusB) {
  const allowed = [Number(statusA), Number(statusB)];
  chai.expect(
    allowed,
    `Expected status ${statusA} or ${statusB}, got ${this.response.statusCode}`
  ).to.include(Number(this.response.statusCode));
});

Then(/^The on-unsubscribe callback response should have "([^"]*)": "([^"]*)" header$/, async function(key, value) {
  const { ok, actualValue, reason } = checkHeader(this.response.rawHeaders, key, value);
  const msg = reason === 'missing'
    ? `Expected header "${key}" to be present`
    : `Expected header "${key}" to be "${value}", got "${actualValue}"`;
  chai.expect(ok, msg).to.be.true;
});

Then(/^The on-unsubscribe callback response should be returned in a timely manner$/, async function() {
  chai.expect(this.response.responseTime).to.be.lessThan(defaultExpectedResponseTime);
});

Then(/^The on-unsubscribe callback response should match the expected JSON schema$/, async function() {
  await assertOpenApiResponse(
    { path: getRequestPath(onunsubscribeEndpoint), method: 'post', statusCode: this.response.statusCode },
    this.response.body,
    'fr'
  );
});
