import chai from 'chai';
import pkg from 'pactum';
const { spec } = pkg;
import { Given, When, Then } from '@cucumber/cucumber';
import {
  localhost,
  defaultExpectedResponseTime,
  onsubscribeEndpoint,
  createOnSubscribePayload,
  applyCommonHeaders,
  checkHeader,
  getRequestPath
} from './helpers/index.js';

import { assertOpenApiRequest, assertOpenApiResponse } from './helpers/index.js';

const baseUrl = localhost + onsubscribeEndpoint;

let specOnSubscribe;

Given(/^CRVS wants to send an on-subscribe callback$/, function () {
  specOnSubscribe = spec();
});

When(/^A POST request to on-subscribe callback is sent$/, async function () {
  applyCommonHeaders(specOnSubscribe.post(baseUrl));
  const payload = createOnSubscribePayload();
  await assertOpenApiRequest({ path: getRequestPath(onsubscribeEndpoint), method: 'post' }, payload, 'crvs');
  const response = await specOnSubscribe.withJson(payload);
  this.response = response;
});

Then(/^The on-subscribe callback response should be received$/, async function () {
  chai.expect(this.response).to.exist;
});

Then(/^The on-subscribe callback response should have status (\d+) or (\d+)$/, async function(statusA, statusB) {
  const allowed = [Number(statusA), Number(statusB)];
  chai.expect(
    allowed,
    `Expected status ${statusA} or ${statusB}, got ${this.response.statusCode}`
  ).to.include(Number(this.response.statusCode));
});

Then(/^The on-subscribe callback response should have "([^"]*)": "([^"]*)" header$/, async function(key, value) {
  const { ok, actualValue, reason } = checkHeader(this.response.rawHeaders, key, value);
  const msg = reason === 'missing'
    ? `Expected header "${key}" to be present`
    : `Expected header "${key}" to be "${value}", got "${actualValue}"`;
  chai.expect(ok, msg).to.be.true;
});

Then(/^The on-subscribe callback response should be returned in a timely manner$/, async function() {
  chai.expect(this.response.responseTime).to.be.lessThan(defaultExpectedResponseTime);
});

Then(/^The on-subscribe callback response should match the expected JSON schema$/, async function() {
  await assertOpenApiResponse(
    { path: getRequestPath(onsubscribeEndpoint), method: 'post', statusCode: this.response.statusCode },
    this.response.body,
    'crvs'
  );
});
