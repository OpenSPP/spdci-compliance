import chai from 'chai';
import pkg from 'pactum';
const { spec } = pkg;
import { Given, When, Then } from '@cucumber/cucumber';
import {
  localhost,
  defaultExpectedResponseTime,
  onsearchEndpoint,
  onsearchRequestSchema,
  createOnSearchPayload,
  applyCommonHeaders,
  checkHeader,
  getRequestPath
} from './helpers/helpers.js';

import { assertOpenApiRequest, assertOpenApiResponse } from './helpers/openapi-validator.js';

import chaiJsonSchema from 'chai-json-schema'; // Import correctly
import chaiString from 'chai-string';

chai.use(chaiString);

chai.use(chaiJsonSchema); // Use the imported schema validation

const baseUrl = localhost + onsearchEndpoint;

let speconSearch;


// Given step: Initialize search for beneficiaries
Given(/^SP has previously sent a search request to SR$/, function () {
  speconSearch = spec(); // Initialize the specSearch object
});

When(/^SR completes processing and calls SP on-search callback$/, async function () {
  try {
    applyCommonHeaders(speconSearch.post(baseUrl));
    const payload = createOnSearchPayload();
    await assertOpenApiRequest({ path: getRequestPath(onsearchEndpoint), method: 'post' }, payload);
    const response = await speconSearch.withJson(payload);
    this.response = response; // Save response for validation in Then steps
  } catch (err) {
    console.error("Request failed", err);
    throw err;
  }
});


// Then step: Ensure the response is received
Then(/^SP should receive the on-search response from SR$/, async function () {
  chai.expect(this.response).to.exist; // Uncomment once debugged
});

// Then step: Validate the response status code
Then(/^The on-search response should have status (\d+)$/, async  function(status)  {
  chai.expect(this.response.statusCode).to.equal(status);
});

// Then step: Validate header in the response (case-insensitive per RFC 7230)
Then(/^The on-search response should have "([^"]*)": "([^"]*)" header$/, async function(key, value) {
  const { ok, actualValue, reason } = checkHeader(this.response.rawHeaders, key, value);
  const msg = reason === 'missing'
    ? `Expected header "${key}" to be present`
    : `Expected header "${key}" to be "${value}", got "${actualValue}"`;
  chai.expect(ok, msg).to.be.true;
});

// Then step: Validate response time
Then(/^The on-search response should be received within 15000ms$/, async function() {
    chai.expect(this.response.responseTime).to.be.lessThan(defaultExpectedResponseTime);
    //this.response.to.have.responseTimeLessThan(defaultExpectedResponseTime);
  });

// Then step: Validate JSON schema of the response
Then(/^The on-search response should match the expected JSON schema$/, async  function() {
  await assertOpenApiResponse(
    { path: getRequestPath(onsearchEndpoint), method: 'post', statusCode: this.response.statusCode },
    this.response.body
  );
});
