import chai from 'chai';
import pkg from 'pactum';
const { spec } = pkg;
import { Given, When, Then } from '@cucumber/cucumber';
import {
  localhost,
  defaultExpectedResponseTime,
  searchEndpoint,
  regRecordsSchema,
  createSearchRequestPayload,
  applyCommonHeaders,
  checkHeader,
  getRequestPath
} from './helpers/index.js';

import { assertOpenApiRequest, assertOpenApiResponse } from './helpers/index.js';

import chaiJsonSchema from 'chai-json-schema'; // Import correctly
import chaiString from 'chai-string';

chai.use(chaiString);

chai.use(chaiJsonSchema); // Use the imported schema validation

const baseUrl = localhost + searchEndpoint;

let specSearch;


// Given step: Initialize search for beneficiaries
Given(/^System wants to sync search for person in SR$/, function () {
  specSearch = spec(); // Initialize the specSearch object
});

When(/^A POST request to sync search is sent$/, async function () {
  try {
    applyCommonHeaders(specSearch.post(baseUrl));
    const payload = createSearchRequestPayload();
    await assertOpenApiRequest({ path: getRequestPath(searchEndpoint), method: 'post' }, payload);
    const response = await specSearch.withJson(payload);
    this.response = response; // Save response for validation in Then steps
  } catch (err) {
    console.error("Request failed", err);
    throw err;
  }
});


// Then step: Ensure the response is received
Then(/^The response from the sync search should be received$/, async function () {
  chai.expect(this.response).to.exist; // Uncomment once debugged
});

// Then step: Validate the response status code
Then(/^The sync search response should have status (\d+)$/, async  function(status)  {
  chai.expect(this.response.statusCode).to.equal(Number(status));
});

// Then step: Validate header in the response (case-insensitive per RFC 7230)
Then(/^The sync search response should have "([^"]*)": "([^"]*)" header$/, async function(key, value) {
  const { ok, actualValue, reason } = checkHeader(this.response.rawHeaders, key, value);
  const msg = reason === 'missing'
    ? `Expected header "${key}" to be present`
    : `Expected header "${key}" to be "${value}", got "${actualValue}"`;
  chai.expect(ok, msg).to.be.true;
});

// Then step: Validate response time
Then(/^The sync search response should be returned in a timely manner within 15000ms$/, async function() {
    chai.expect(this.response.responseTime).to.be.lessThan(defaultExpectedResponseTime);
    //this.response.to.have.responseTimeLessThan(defaultExpectedResponseTime);
  });

// Then step: Validate JSON schema of the response
Then(/^The sync search response should match the expected JSON schema$/, async  function() {
  await assertOpenApiResponse(
    { path: getRequestPath(searchEndpoint), method: 'post', statusCode: this.response.statusCode },
    this.response.body
  );
  //console.log(this.response.body.data.reg_records)
  //this.response.body.data.reg_records.forEach((jsonResponse, index) => {
   // chai.expect(jsonResponse).to.be.jsonSchema(regRecordsSchema, `Failed at index ${index}`);
  //});
});

// Given step: Initialize search for beneficiaries
Given(/^System has sent a sync search request for SR person for a functional test$/, function () {
  specSearch = spec(); // Initialize the specSearch object
});

When(/^A POST request to sync search is sent Functional Test$/, async function () {
  try {
    applyCommonHeaders(specSearch.post(baseUrl));
    const payload = createSearchRequestPayload();
    await assertOpenApiRequest({ path: getRequestPath(searchEndpoint), method: 'post' }, payload);
    const response = await specSearch.withJson(payload);
    this.response = response; // Save response for validation in Then steps
  } catch (err) {
    console.error("Request failed", err);
    throw err;
  }
});


// Then step: Ensure the response is received
Then(/^The response from the sync search should be received Functional Test$/, async function () {
  chai.expect(this.response).to.exist; // Uncomment once debugged
});


// Then step: Validate JSON schema of the response
Then(/^The sync search response should contain a reg_records array Functional Test$/, async  function() {
  chai.expect(this.response.body.message.search_response[0].data.reg_records).to.exist;
});

// Then step: Validate JSON schema of the response
Then(/^Each item in the reg_records array should match the defined JSON schema Functional Test$/, async  function() { 
  this.response.body.message.search_response[0].data.reg_records.forEach((jsonResponse, index) => {
    chai.expect(jsonResponse).to.be.jsonSchema(regRecordsSchema, `Failed at index ${index}`);
  });
});
