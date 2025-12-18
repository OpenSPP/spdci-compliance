import chai from 'chai';
import pkg from 'pactum';
const { spec } = pkg;
import { Given, When, Then } from '@cucumber/cucumber';
import {
  localhost,
  defaultExpectedResponseTime,
  asyncsearchEndpoint,
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

const baseUrl = localhost + asyncsearchEndpoint;

let specAsyncSearch;

Given(/^System wants to async search for farmer in FR$/, function () {
  specAsyncSearch = spec();
});

When(/^A POST request to FR async search is sent$/, async function () {
  try {
    applyCommonHeaders(specAsyncSearch.post(baseUrl));
    const payload = createSearchRequestPayload();
    await assertOpenApiRequest({ path: getRequestPath(asyncsearchEndpoint), method: 'post' }, payload, 'fr');
    const response = await specAsyncSearch.withJson(payload);
    this.response = response;
  } catch (err) {
    console.error("Request failed", err);
    throw err;
  }
});

Then(/^The response from the FR async search should be received$/, async function () {
  chai.expect(this.response).to.exist;
});

Then(/^The FR async search response should have status (\d+)$/, async function(status) {
  chai.expect(this.response.statusCode).to.equal(Number(status));
});

Then(/^The FR async search response should have status (\d+) or (\d+)$/, async function(statusA, statusB) {
  const allowed = [Number(statusA), Number(statusB)];
  chai.expect(
    allowed,
    `Expected status ${statusA} or ${statusB}, got ${this.response.statusCode}`
  ).to.include(Number(this.response.statusCode));
});

Then(/^The FR async search response should have "([^"]*)": "([^"]*)" header$/, async function(key, value) {
  const { ok, actualValue, reason } = checkHeader(this.response.rawHeaders, key, value);
  const msg = reason === 'missing'
    ? `Expected header "${key}" to be present`
    : `Expected header "${key}" to be "${value}", got "${actualValue}"`;
  chai.expect(ok, msg).to.be.true;
});

Then(/^The FR async search response should be returned in a timely manner$/, async function() {
  chai.expect(this.response.responseTime).to.be.lessThan(defaultExpectedResponseTime);
});

Then(/^The FR async search response should have ack_status ACK$/, async function() {
  chai.expect(this.response.body?.message?.ack_status).to.equal('ACK');
});

Then(/^The FR async search response should match the expected JSON schema$/, async function() {
  await assertOpenApiResponse(
    { path: getRequestPath(asyncsearchEndpoint), method: 'post', statusCode: this.response.statusCode },
    this.response.body,
    'fr'
  );
});
