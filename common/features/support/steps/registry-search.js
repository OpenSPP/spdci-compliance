/**
 * Registry Search Step Definitions
 *
 * Domain-agnostic step definitions for sync and async search operations.
 */

import chai from 'chai';
import pkg from 'pactum';
const { spec } = pkg;

import { Given, When, Then, Before } from '@cucumber/cucumber';

import {
  assertOpenApiRequest,
  assertOpenApiResponse,
} from '../../../helpers/index.js';

import {
  applyCommonHeaders,
  checkHeader,
  getRequestPath,
  getResponseTimeThreshold,
} from './helpers.js';

import chaiJsonSchema from 'chai-json-schema';
import chaiString from 'chai-string';

chai.use(chaiString);
chai.use(chaiJsonSchema);

let specSearch;

// ============================================
// ASYNC SEARCH STEPS
// ============================================

Given(/^System wants to (?:async )?search (?:for (?:person|farmer|beneficiary) in )?(?:the registry|SR|FR|CRVS)$/, function () {
  specSearch = spec();
});

When(/^A POST request to (?:async )?search is sent$/, async function () {
  try {
    const endpoint = this.getEndpoint('asyncSearch');
    const url = this.baseUrl + endpoint;
    const requestPath = getRequestPath(endpoint, this.baseUrl);

    applyCommonHeaders(specSearch.post(url));
    const payload = this.payloads.createSearchRequestPayload();

    await assertOpenApiRequest({ path: requestPath, method: 'post', domain: this.domain }, payload);
    const response = await specSearch.withJson(payload);
    this.response = response;
    this.requestPath = requestPath;
  } catch (err) {
    console.error('Request failed', err);
    throw err;
  }
});

Then(/^The (?:async )?search response should be received$/, async function () {
  chai.expect(this.response).to.exist;
});

Then(/^The (?:async )?search response should have status (\d+)$/, async function (status) {
  chai.expect(this.response.statusCode).to.equal(Number(status));
});

Then(/^The (?:async )?search response should have status (\d+) or (\d+)$/, async function (statusA, statusB) {
  const allowed = [Number(statusA), Number(statusB)];
  chai.expect(
    allowed,
    `Expected status ${statusA} or ${statusB}, got ${this.response.statusCode}`
  ).to.include(Number(this.response.statusCode));
});

Then(/^The (?:async )?search response should have "([^"]*)": "([^"]*)" header$/, async function (key, value) {
  const { ok, actualValue, reason } = checkHeader(this.response.rawHeaders, key, value);
  const msg = reason === 'missing'
    ? `Expected header "${key}" to be present`
    : `Expected header "${key}" to be "${value}", got "${actualValue}"`;
  chai.expect(ok, msg).to.be.true;
});

Then(/^The (?:async )?search response should be returned in a timely manner(?: within (\d+)ms)?$/, async function (timeout) {
  const threshold = timeout ? Number(timeout) : getResponseTimeThreshold();
  chai.expect(this.response.responseTime).to.be.lessThan(threshold);
});

Then(/^The (?:async )?search response should match the expected JSON schema$/, async function () {
  const requestPath = this.requestPath || getRequestPath(this.getEndpoint('asyncSearch'), this.baseUrl);
  await assertOpenApiResponse(
    { path: requestPath, method: 'post', statusCode: this.response.statusCode, domain: this.domain },
    this.response.body
  );
});

// ============================================
// SYNC SEARCH STEPS
// ============================================

let specSyncSearch;

Given(/^System wants to sync search (?:for (?:person|farmer|beneficiary) in )?(?:the registry|SR|FR|CRVS)$/, function () {
  specSyncSearch = spec();
});

When(/^A POST request to sync search is sent$/, async function () {
  try {
    const endpoint = this.getEndpoint('syncSearch');
    const url = this.baseUrl + endpoint;
    const requestPath = getRequestPath(endpoint, this.baseUrl);

    applyCommonHeaders(specSyncSearch.post(url));
    const payload = this.payloads.createSearchRequestPayload();

    await assertOpenApiRequest({ path: requestPath, method: 'post', domain: this.domain }, payload);
    const response = await specSyncSearch.withJson(payload);
    this.response = response;
    this.requestPath = requestPath;
  } catch (err) {
    console.error('Request failed', err);
    throw err;
  }
});

Then(/^The sync search response should be received$/, async function () {
  chai.expect(this.response).to.exist;
});

Then(/^The sync search response should have status (\d+)$/, async function (status) {
  chai.expect(this.response.statusCode).to.equal(Number(status));
});

Then(/^The sync search response should have status (\d+) or (\d+)$/, async function (statusA, statusB) {
  const allowed = [Number(statusA), Number(statusB)];
  chai.expect(
    allowed,
    `Expected status ${statusA} or ${statusB}, got ${this.response.statusCode}`
  ).to.include(Number(this.response.statusCode));
});

Then(/^The sync search response should have "([^"]*)": "([^"]*)" header$/, async function (key, value) {
  const { ok, actualValue, reason } = checkHeader(this.response.rawHeaders, key, value);
  const msg = reason === 'missing'
    ? `Expected header "${key}" to be present`
    : `Expected header "${key}" to be "${value}", got "${actualValue}"`;
  chai.expect(ok, msg).to.be.true;
});

Then(/^The sync search response should be returned in a timely manner(?: within (\d+)ms)?$/, async function (timeout) {
  const threshold = timeout ? Number(timeout) : getResponseTimeThreshold();
  chai.expect(this.response.responseTime).to.be.lessThan(threshold);
});

Then(/^The sync search response should match the expected JSON schema$/, async function () {
  const requestPath = this.requestPath || getRequestPath(this.getEndpoint('syncSearch'), this.baseUrl);
  await assertOpenApiResponse(
    { path: requestPath, method: 'post', statusCode: this.response.statusCode, domain: this.domain },
    this.response.body
  );
});

// ============================================
// SYNC SEARCH EXTRA VALIDATION
// ============================================

Then(/^The sync search response should contain reg_records array$/, async function () {
  chai.expect(this.response.body).to.have.nested.property('message.search_response');
  const searchResponse = this.response.body.message.search_response;
  chai.expect(searchResponse).to.be.an('array');

  if (searchResponse.length > 0) {
    const firstResult = searchResponse[0];
    if (firstResult.data && firstResult.data.reg_records !== undefined) {
      chai.expect(firstResult.data.reg_records).to.satisfy(
        val => Array.isArray(val) || typeof val === 'object',
        'reg_records should be an array or object'
      );
    }
  }
});
