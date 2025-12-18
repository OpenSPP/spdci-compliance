import chai from 'chai';
import pkg from 'pactum';
const { spec } = pkg;
import { Given, When, Then } from '@cucumber/cucumber';
import {
  localhost,
  defaultExpectedResponseTime,
  searchEndpoint,
  createSearchRequestPayload,
  applyCommonHeaders,
  checkHeader,
  getRequestPath
} from './helpers/index.js';

import { assertOpenApiRequest, assertOpenApiResponse } from './helpers/index.js';

import chaiJsonSchema from 'chai-json-schema';
import chaiString from 'chai-string';

chai.use(chaiString);
chai.use(chaiJsonSchema);

const baseUrl = localhost + searchEndpoint;

let specSearch;

Given(/^System wants to sync search for person in CRVS$/, function () {
  specSearch = spec();
});

When(/^A POST request to CRVS sync search is sent$/, async function () {
  try {
    applyCommonHeaders(specSearch.post(baseUrl));
    const payload = createSearchRequestPayload();
    await assertOpenApiRequest({ path: getRequestPath(searchEndpoint), method: 'post' }, payload, 'crvs');
    const response = await specSearch.withJson(payload);
    this.response = response;
  } catch (err) {
    console.error("Request failed", err);
    throw err;
  }
});

Then(/^The response from the CRVS sync search should be received$/, async function () {
  chai.expect(this.response).to.exist;
});

Then(/^The CRVS sync search response should have status (\d+)$/, async function(status) {
  chai.expect(this.response.statusCode).to.equal(Number(status));
});

Then(/^The CRVS sync search response should have status (\d+) or (\d+)$/, async function(statusA, statusB) {
  const allowed = [Number(statusA), Number(statusB)];
  chai.expect(
    allowed,
    `Expected status ${statusA} or ${statusB}, got ${this.response.statusCode}`
  ).to.include(Number(this.response.statusCode));
});

Then(/^The CRVS sync search response should have "([^"]*)": "([^"]*)" header$/, async function(key, value) {
  const { ok, actualValue, reason } = checkHeader(this.response.rawHeaders, key, value);
  const msg = reason === 'missing'
    ? `Expected header "${key}" to be present`
    : `Expected header "${key}" to be "${value}", got "${actualValue}"`;
  chai.expect(ok, msg).to.be.true;
});

Then(/^The CRVS sync search response should be returned in a timely manner$/, async function() {
  chai.expect(this.response.responseTime).to.be.lessThan(defaultExpectedResponseTime);
});

Then(/^The CRVS sync search response should match the expected JSON schema$/, async function() {
  await assertOpenApiResponse(
    { path: getRequestPath(searchEndpoint), method: 'post', statusCode: this.response.statusCode },
    this.response.body,
    'crvs'
  );
});
