import chai from 'chai';
import pkg from 'pactum';
const { spec } = pkg;
import { Given, When, Then } from '@cucumber/cucumber';
import {
  localhost,
  defaultExpectedResponseTime,
  notifyEndpoint,
  createNotifyPayload,
  applyCommonHeaders,
  checkHeader,
  getRequestPath,
} from './helpers/index.js';

import { assertOpenApiRequest, assertOpenApiResponse } from './helpers/index.js';

const baseUrl = localhost + notifyEndpoint;

let specNotify;

Given(/^CRVS wants to send a notify callback$/, function () {
  specNotify = spec();
});

When(/^A POST request to notify callback is sent$/, async function () {
  applyCommonHeaders(specNotify.post(baseUrl));
  const payload = createNotifyPayload();
  await assertOpenApiRequest({ path: getRequestPath(notifyEndpoint), method: 'post' }, payload, 'crvs');
  const response = await specNotify.withJson(payload);
  this.response = response;
});

Then(/^The notify callback response should be received$/, async function () {
  chai.expect(this.response).to.exist;
});

Then(/^The notify callback response should have status (\d+) or (\d+)$/, async function (statusA, statusB) {
  const allowed = [Number(statusA), Number(statusB)];
  chai.expect(
    allowed,
    `Expected status ${statusA} or ${statusB}, got ${this.response.statusCode}`
  ).to.include(Number(this.response.statusCode));
});

Then(/^The notify callback response should have "([^"]*)": "([^"]*)" header$/, async function (key, value) {
  const { ok, actualValue, reason } = checkHeader(this.response.rawHeaders, key, value);
  const msg =
    reason === 'missing'
      ? `Expected header "${key}" to be present`
      : `Expected header "${key}" to be "${value}", got "${actualValue}"`;
  chai.expect(ok, msg).to.be.true;
});

Then(/^The notify callback response should be returned in a timely manner$/, async function () {
  chai.expect(this.response.responseTime).to.be.lessThan(defaultExpectedResponseTime);
});

Then(/^The notify callback response should match the expected JSON schema$/, async function () {
  await assertOpenApiResponse(
    { path: getRequestPath(notifyEndpoint), method: 'post', statusCode: this.response.statusCode },
    this.response.body,
    'crvs'
  );
});
