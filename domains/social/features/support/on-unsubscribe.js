import chai from 'chai';
import pkg from 'pactum';
const { spec } = pkg;
import { Given, When, Then, Before } from '@cucumber/cucumber';
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

import chaiJsonSchema from 'chai-json-schema'; // Import correctly
import chaiString from 'chai-string';

chai.use(chaiString);

chai.use(chaiJsonSchema); // Use the imported schema validation

const baseUrl = localhost + onunsubscribeEndpoint;
const endpointTag = { tags: `@endpoint=/${onunsubscribeEndpoint}` };

let specUnsubscribe;


// Given step: Initialize search for beneficiaries
Given(/^SP has previously sent an unsubscribe request to SR$/, function () {
  specUnsubscribe = spec(); // Initialize the specSearch object
});

When(/^SR completes processing and calls SP on-unsubscribe callback$/, async function () {
  try {
    applyCommonHeaders(specUnsubscribe.post(baseUrl));
    const payload = createOnUnsubscribePayload();
    await assertOpenApiRequest({ path: getRequestPath(onunsubscribeEndpoint), method: 'post' }, payload);
    const response = await specUnsubscribe.withJson(payload);
    this.response = response; // Save response for validation in Then steps

  } catch (err) {
    console.error("Request failed", err);
    throw err;
  }
});


// Then step: Ensure the response is received
Then(/^SP should receive the on-unsubscribe response from SR$/, async function () {
  chai.expect(this.response).to.exist; // Uncomment once debugged
});


// Then step: Validate the response status code
Then(/^The on-unsubscribe response should have status (\d+)$/, async  function(status)  {
  chai.expect(this.response.statusCode).to.equal(status);
});

// Then step: Validate header in the response (case-insensitive per RFC 7230)
Then(/^The on-unsubscribe response should have "([^"]*)": "([^"]*)" header$/, async function(key, value) {
  const { ok, actualValue, reason } = checkHeader(this.response.rawHeaders, key, value);
  const msg = reason === 'missing'
    ? `Expected header "${key}" to be present`
    : `Expected header "${key}" to be "${value}", got "${actualValue}"`;
  chai.expect(ok, msg).to.be.true;
});

// Then step: Validate response time
Then(
  /^The on-unsubscribe response should be returned in a timely manner 15000ms$/, async function() {
    chai.expect(this.response.responseTime).to.be.lessThan(defaultExpectedResponseTime);
    //this.response.to.have.responseTimeLessThan(defaultExpectedResponseTime);
  });

// Then step: Validate JSON schema of the response
Then(/^The on-unsubscribe response should match json schema$/, async  function() {
  await assertOpenApiResponse(
    { path: getRequestPath(onunsubscribeEndpoint), method: 'post', statusCode: this.response.statusCode },
    this.response.body
  );
});
