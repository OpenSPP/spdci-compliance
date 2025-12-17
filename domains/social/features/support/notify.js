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

Given(/^SR has an event to notify subscribers$/, function () {
  specNotify = spec();
});

When(/^SR calls SP notify endpoint$/, async function () {
  applyCommonHeaders(specNotify.post(baseUrl));
  const payload = createNotifyPayload();
  await assertOpenApiRequest({ path: getRequestPath(notifyEndpoint), method: 'post' }, payload);
  const response = await specNotify.withJson(payload);
  this.response = response;
});

Then(/^SP should receive the notify response from SR$/, async function () {
  chai.expect(this.response).to.exist;
});

Then(/^The notify response should have status (\d+)$/, async function (status) {
  chai.expect(this.response.statusCode).to.equal(Number(status));
});

Then(/^The notify response should have "([^"]*)": "([^"]*)" header$/, async function (key, value) {
  const { ok, actualValue, reason } = checkHeader(this.response.rawHeaders, key, value);
  const msg =
    reason === 'missing'
      ? `Expected header "${key}" to be present`
      : `Expected header "${key}" to be "${value}", got "${actualValue}"`;
  chai.expect(ok, msg).to.be.true;
});

Then(/^The notify response should be received within 15000ms$/, async function () {
  chai.expect(this.response.responseTime).to.be.lessThan(defaultExpectedResponseTime);
});

Then(/^The notify response should match the expected JSON schema$/, async function () {
  await assertOpenApiResponse(
    { path: getRequestPath(notifyEndpoint), method: 'post', statusCode: this.response.statusCode },
    this.response.body
  );
});

