/**
 * Registry Query Types Step Definitions
 *
 * Domain-agnostic step definitions for testing expression and predicate queries.
 */

import chai from 'chai';
import pkg from 'pactum';
const { spec } = pkg;

import { Given, When, Then } from '@cucumber/cucumber';

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

// ============================================
// ASYNC SEARCH - EXPRESSION QUERY
// ============================================

let specExpressionSearch;

Given(/^System wants to search (?:the registry|SR|FR|CRVS) using expression query$/, function () {
  specExpressionSearch = spec();
});

When(/^A POST request to (?:async )?search is sent with expression query$/, async function () {
  try {
    const endpoint = this.getEndpoint('asyncSearch');
    const url = this.baseUrl + endpoint;
    const requestPath = getRequestPath(endpoint, this.baseUrl);

    applyCommonHeaders(specExpressionSearch.post(url));
    const payload = this.payloads.createSearchRequestPayloadWithExpressionQuery();

    await assertOpenApiRequest({ path: requestPath, method: 'post', domain: this.domain }, payload);
    const response = await specExpressionSearch.withJson(payload);
    this.response = response;
    this.requestPath = requestPath;
  } catch (err) {
    console.error('Request failed', err);
    throw err;
  }
});

Then(/^The expression search response should be received$/, async function () {
  chai.expect(this.response).to.exist;
});

Then(/^The expression search response should have status (\d+)$/, async function (status) {
  chai.expect(this.response.statusCode).to.equal(Number(status));
});

Then(/^The expression search response should have status (\d+) or (\d+)$/, async function (statusA, statusB) {
  const allowed = [Number(statusA), Number(statusB)];
  chai.expect(
    allowed,
    `Expected status ${statusA} or ${statusB}, got ${this.response.statusCode}`
  ).to.include(Number(this.response.statusCode));
});

Then(/^The expression search response should have "([^"]*)": "([^"]*)" header$/, async function (key, value) {
  const { ok, actualValue, reason } = checkHeader(this.response.rawHeaders, key, value);
  const msg = reason === 'missing'
    ? `Expected header "${key}" to be present`
    : `Expected header "${key}" to be "${value}", got "${actualValue}"`;
  chai.expect(ok, msg).to.be.true;
});

Then(/^The expression search response should be returned in a timely manner(?: within (\d+)ms)?$/, async function (timeout) {
  const threshold = timeout ? Number(timeout) : getResponseTimeThreshold();
  chai.expect(this.response.responseTime).to.be.lessThan(threshold);
});

Then(/^The expression search response should match the expected JSON schema$/, async function () {
  const requestPath = this.requestPath || getRequestPath(this.getEndpoint('asyncSearch'), this.baseUrl);
  await assertOpenApiResponse(
    { path: requestPath, method: 'post', statusCode: this.response.statusCode, domain: this.domain },
    this.response.body
  );
});

// ============================================
// ASYNC SEARCH - PREDICATE QUERY
// ============================================

let specPredicateSearch;

Given(/^System wants to search (?:the registry|SR|FR|CRVS) using predicate query$/, function () {
  specPredicateSearch = spec();
});

When(/^A POST request to (?:async )?search is sent with predicate query$/, async function () {
  try {
    const endpoint = this.getEndpoint('asyncSearch');
    const url = this.baseUrl + endpoint;
    const requestPath = getRequestPath(endpoint, this.baseUrl);

    applyCommonHeaders(specPredicateSearch.post(url));
    const payload = this.payloads.createSearchRequestPayloadWithPredicateQuery();

    await assertOpenApiRequest({ path: requestPath, method: 'post', domain: this.domain }, payload);
    const response = await specPredicateSearch.withJson(payload);
    this.response = response;
    this.requestPath = requestPath;
  } catch (err) {
    console.error('Request failed', err);
    throw err;
  }
});

Then(/^The predicate search response should be received$/, async function () {
  chai.expect(this.response).to.exist;
});

Then(/^The predicate search response should have status (\d+)$/, async function (status) {
  chai.expect(this.response.statusCode).to.equal(Number(status));
});

Then(/^The predicate search response should have status (\d+) or (\d+)$/, async function (statusA, statusB) {
  const allowed = [Number(statusA), Number(statusB)];
  chai.expect(
    allowed,
    `Expected status ${statusA} or ${statusB}, got ${this.response.statusCode}`
  ).to.include(Number(this.response.statusCode));
});

Then(/^The predicate search response should have "([^"]*)": "([^"]*)" header$/, async function (key, value) {
  const { ok, actualValue, reason } = checkHeader(this.response.rawHeaders, key, value);
  const msg = reason === 'missing'
    ? `Expected header "${key}" to be present`
    : `Expected header "${key}" to be "${value}", got "${actualValue}"`;
  chai.expect(ok, msg).to.be.true;
});

Then(/^The predicate search response should be returned in a timely manner(?: within (\d+)ms)?$/, async function (timeout) {
  const threshold = timeout ? Number(timeout) : getResponseTimeThreshold();
  chai.expect(this.response.responseTime).to.be.lessThan(threshold);
});

Then(/^The predicate search response should match the expected JSON schema$/, async function () {
  const requestPath = this.requestPath || getRequestPath(this.getEndpoint('asyncSearch'), this.baseUrl);
  await assertOpenApiResponse(
    { path: requestPath, method: 'post', statusCode: this.response.statusCode, domain: this.domain },
    this.response.body
  );
});

// ============================================
// SYNC SEARCH - EXPRESSION QUERY
// ============================================

let specSyncExpressionSearch;

Given(/^System wants to sync search (?:the registry|SR|FR|CRVS) using expression query$/, function () {
  specSyncExpressionSearch = spec();
});

When(/^A POST request to sync search is sent with expression query$/, async function () {
  try {
    const endpoint = this.getEndpoint('syncSearch');
    const url = this.baseUrl + endpoint;
    const requestPath = getRequestPath(endpoint, this.baseUrl);

    applyCommonHeaders(specSyncExpressionSearch.post(url));
    const payload = this.payloads.createSearchRequestPayloadWithExpressionQuery();

    await assertOpenApiRequest({ path: requestPath, method: 'post', domain: this.domain }, payload);
    const response = await specSyncExpressionSearch.withJson(payload);
    this.response = response;
    this.requestPath = requestPath;
  } catch (err) {
    console.error('Request failed', err);
    throw err;
  }
});

// ============================================
// SYNC SEARCH - PREDICATE QUERY
// ============================================

let specSyncPredicateSearch;

Given(/^System wants to sync search (?:the registry|SR|FR|CRVS) using predicate query$/, function () {
  specSyncPredicateSearch = spec();
});

When(/^A POST request to sync search is sent with predicate query$/, async function () {
  try {
    const endpoint = this.getEndpoint('syncSearch');
    const url = this.baseUrl + endpoint;
    const requestPath = getRequestPath(endpoint, this.baseUrl);

    applyCommonHeaders(specSyncPredicateSearch.post(url));
    const payload = this.payloads.createSearchRequestPayloadWithPredicateQuery();

    await assertOpenApiRequest({ path: requestPath, method: 'post', domain: this.domain }, payload);
    const response = await specSyncPredicateSearch.withJson(payload);
    this.response = response;
    this.requestPath = requestPath;
  } catch (err) {
    console.error('Request failed', err);
    throw err;
  }
});
