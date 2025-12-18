import chai from 'chai';
import pkg from 'pactum';
const { spec } = pkg;
import { Given, When, Then } from '@cucumber/cucumber';
import {
  localhost,
  defaultExpectedResponseTime,
  onsearchEndpoint,
  createOnSearchPayload,
  applyCommonHeaders,
  checkHeader,
  getRequestPath
} from './helpers/index.js';

import { assertOpenApiRequest, assertOpenApiResponse } from './helpers/index.js';

const baseUrl = localhost + onsearchEndpoint;

let specOnSearch;

Given(/^CRVS wants to send an on-search callback$/, function () {
  specOnSearch = spec();
});

When(/^A POST request to on-search callback is sent$/, async function () {
  applyCommonHeaders(specOnSearch.post(baseUrl));
  const payload = createOnSearchPayload();
  await assertOpenApiRequest({ path: getRequestPath(onsearchEndpoint), method: 'post' }, payload, 'crvs');
  const response = await specOnSearch.withJson(payload);
  this.response = response;
});

Then(/^The on-search callback response should be received$/, async function () {
  chai.expect(this.response).to.exist;
});

Then(/^The on-search callback response should have status (\d+) or (\d+)$/, async function(statusA, statusB) {
  const allowed = [Number(statusA), Number(statusB)];
  chai.expect(
    allowed,
    `Expected status ${statusA} or ${statusB}, got ${this.response.statusCode}`
  ).to.include(Number(this.response.statusCode));
});

Then(/^The on-search callback response should have "([^"]*)": "([^"]*)" header$/, async function(key, value) {
  const { ok, actualValue, reason } = checkHeader(this.response.rawHeaders, key, value);
  const msg = reason === 'missing'
    ? `Expected header "${key}" to be present`
    : `Expected header "${key}" to be "${value}", got "${actualValue}"`;
  chai.expect(ok, msg).to.be.true;
});

Then(/^The on-search callback response should be returned in a timely manner$/, async function() {
  chai.expect(this.response.responseTime).to.be.lessThan(defaultExpectedResponseTime);
});

Then(/^The on-search callback response should match the expected JSON schema$/, async function() {
  await assertOpenApiResponse(
    { path: getRequestPath(onsearchEndpoint), method: 'post', statusCode: this.response.statusCode },
    this.response.body,
    'crvs'
  );
});
