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
} from './helpers/helpers.js';

import { assertOpenApiRequest, assertOpenApiResponse } from './helpers/openapi-validator.js';

import chaiJsonSchema from 'chai-json-schema'; // Import correctly
import chaiString from 'chai-string';

chai.use(chaiString);

chai.use(chaiJsonSchema); // Use the imported schema validation

const baseUrl = localhost + asynctxnstatusEndpoint;

let spectxn;


// Given step: Initialize search for beneficiaries
Given(/^System wants to get transaction status$/, function () {
  spectxn = spec(); // Initialize the specSearch object
});

When(/^A POST request to txn status is sent$/, async function () {
  try {
    applyCommonHeaders(spectxn.post(baseUrl));
    const payload = createTxnStatusRequestPayload();
    await assertOpenApiRequest({ path: getRequestPath(asynctxnstatusEndpoint), method: 'post' }, payload);
    const response = await spectxn.withJson(payload);
    this.response = response; // Save response for validation in Then steps
  } catch (err) {
    console.error("Request failed", err);
    throw err;
  }
});


// Then step: Ensure the response is received
Then(/^The response from the getting txn status should be received$/, async function () {
  chai.expect(this.response).to.exist; // Uncomment once debugged
});

// Then step: Validate the response status code
Then(/^The txn status response should have status (\d+)$/, async  function(status)  {
  chai.expect(this.response.statusCode).to.equal(status);
});

// Then step: Validate response status code (allow multiple accepted statuses)
Then(/^The txn status response should have status (\d+) or (\d+)$/, async function(statusA, statusB) {
  const allowed = [Number(statusA), Number(statusB)];
  chai.expect(
    allowed,
    `Expected status ${statusA} or ${statusB}, got ${this.response.statusCode}`
  ).to.include(Number(this.response.statusCode));
});

// Then step: Validate header in the response (case-insensitive per RFC 7230)
Then(/^The txn status response should have "([^"]*)": "([^"]*)" header$/, async function(key, value) {
  const { ok, actualValue, reason } = checkHeader(this.response.rawHeaders, key, value);
  const msg = reason === 'missing'
    ? `Expected header "${key}" to be present`
    : `Expected header "${key}" to be "${value}", got "${actualValue}"`;
  chai.expect(ok, msg).to.be.true;
});

// Then step: Validate response time
Then(/^The txn status response should be returned in a timely manner within 15000ms$/, async function() {
    chai.expect(this.response.responseTime).to.be.lessThan(defaultExpectedResponseTime);
    //this.response.to.have.responseTimeLessThan(defaultExpectedResponseTime);
  });

// Then step: Validate JSON schema of the response
Then(/^The txn status response should match the expected JSON schema$/, async  function() {
  await assertOpenApiResponse(
    { path: getRequestPath(asynctxnstatusEndpoint), method: 'post', statusCode: this.response.statusCode },
    this.response.body
  );
});
