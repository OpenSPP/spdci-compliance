import chai from 'chai';
import pkg from 'pactum';
const { spec } = pkg;
import { Given, When, Then } from '@cucumber/cucumber';
import {
  localhost,
  defaultExpectedResponseTime,
  asyncsearchEndpoint,
  searchEndpoint,
  createSearchRequestPayloadWithExpressionQuery,
  createSearchRequestPayloadWithPredicateQuery,
  applyCommonHeaders,
  checkHeader,
  getRequestPath
} from './helpers/helpers.js';

import { assertOpenApiRequest, assertOpenApiResponse } from './helpers/openapi-validator.js';

import chaiJsonSchema from 'chai-json-schema';
import chaiString from 'chai-string';

chai.use(chaiString);
chai.use(chaiJsonSchema);

const asyncBaseUrl = localhost + asyncsearchEndpoint;
const syncBaseUrl = localhost + searchEndpoint;

// ============================================
// ASYNC SEARCH - EXPRESSION QUERY
// ============================================

let specExpressionSearch;

Given(/^System wants to search SR using expression query$/, function () {
  specExpressionSearch = spec();
});

When(/^A POST request to search is sent with expression query$/, async function () {
  try {
    applyCommonHeaders(specExpressionSearch.post(asyncBaseUrl));
    const payload = createSearchRequestPayloadWithExpressionQuery();
    await assertOpenApiRequest({ path: getRequestPath(asyncsearchEndpoint), method: 'post' }, payload);
    const response = await specExpressionSearch.withJson(payload);
    this.expressionResponse = response;
  } catch (err) {
    console.error("Expression query request failed", err);
    throw err;
  }
});

Then(/^The response from the expression search should be received$/, async function () {
  chai.expect(this.expressionResponse).to.exist;
});

Then(/^The expression search response should have status (\d+) or (\d+)$/, async function(statusA, statusB) {
  const allowed = [Number(statusA), Number(statusB)];
  chai.expect(
    allowed,
    `Expected status ${statusA} or ${statusB}, got ${this.expressionResponse.statusCode}`
  ).to.include(Number(this.expressionResponse.statusCode));
});

Then(/^The expression search response should have "([^"]*)": "([^"]*)" header$/, async function(key, value) {
  const { ok, actualValue, reason } = checkHeader(this.expressionResponse.rawHeaders, key, value);
  const msg = reason === 'missing'
    ? `Expected header "${key}" to be present`
    : `Expected header "${key}" to be "${value}", got "${actualValue}"`;
  chai.expect(ok, msg).to.be.true;
});

Then(/^The expression search response should be returned in a timely manner$/, async function() {
  chai.expect(this.expressionResponse.responseTime).to.be.lessThan(defaultExpectedResponseTime);
});

Then(/^The expression search response should match the expected JSON schema$/, async function() {
  await assertOpenApiResponse(
    { path: getRequestPath(asyncsearchEndpoint), method: 'post', statusCode: this.expressionResponse.statusCode },
    this.expressionResponse.body
  );
});

// ============================================
// ASYNC SEARCH - PREDICATE QUERY
// ============================================

let specPredicateSearch;

Given(/^System wants to search SR using predicate query$/, function () {
  specPredicateSearch = spec();
});

When(/^A POST request to search is sent with predicate query$/, async function () {
  try {
    applyCommonHeaders(specPredicateSearch.post(asyncBaseUrl));
    const payload = createSearchRequestPayloadWithPredicateQuery();
    await assertOpenApiRequest({ path: getRequestPath(asyncsearchEndpoint), method: 'post' }, payload);
    const response = await specPredicateSearch.withJson(payload);
    this.predicateResponse = response;
  } catch (err) {
    console.error("Predicate query request failed", err);
    throw err;
  }
});

Then(/^The response from the predicate search should be received$/, async function () {
  chai.expect(this.predicateResponse).to.exist;
});

Then(/^The predicate search response should have status (\d+) or (\d+)$/, async function(statusA, statusB) {
  const allowed = [Number(statusA), Number(statusB)];
  chai.expect(
    allowed,
    `Expected status ${statusA} or ${statusB}, got ${this.predicateResponse.statusCode}`
  ).to.include(Number(this.predicateResponse.statusCode));
});

Then(/^The predicate search response should have "([^"]*)": "([^"]*)" header$/, async function(key, value) {
  const { ok, actualValue, reason } = checkHeader(this.predicateResponse.rawHeaders, key, value);
  const msg = reason === 'missing'
    ? `Expected header "${key}" to be present`
    : `Expected header "${key}" to be "${value}", got "${actualValue}"`;
  chai.expect(ok, msg).to.be.true;
});

Then(/^The predicate search response should be returned in a timely manner$/, async function() {
  chai.expect(this.predicateResponse.responseTime).to.be.lessThan(defaultExpectedResponseTime);
});

Then(/^The predicate search response should match the expected JSON schema$/, async function() {
  await assertOpenApiResponse(
    { path: getRequestPath(asyncsearchEndpoint), method: 'post', statusCode: this.predicateResponse.statusCode },
    this.predicateResponse.body
  );
});

// ============================================
// SYNC SEARCH - EXPRESSION QUERY
// ============================================

let specSyncExpressionSearch;

Given(/^System wants to sync search SR using expression query$/, function () {
  specSyncExpressionSearch = spec();
});

When(/^A POST request to sync search is sent with expression query$/, async function () {
  try {
    applyCommonHeaders(specSyncExpressionSearch.post(syncBaseUrl));
    const payload = createSearchRequestPayloadWithExpressionQuery();
    await assertOpenApiRequest({ path: getRequestPath(searchEndpoint), method: 'post' }, payload);
    const response = await specSyncExpressionSearch.withJson(payload);
    this.syncExpressionResponse = response;
  } catch (err) {
    console.error("Sync expression query request failed", err);
    throw err;
  }
});

Then(/^The response from the sync expression search should be received$/, async function () {
  chai.expect(this.syncExpressionResponse).to.exist;
});

Then(/^The sync expression search response should have status (\d+)$/, async function(status) {
  chai.expect(this.syncExpressionResponse.statusCode).to.equal(Number(status));
});

Then(/^The sync expression search response should have "([^"]*)": "([^"]*)" header$/, async function(key, value) {
  const { ok, actualValue, reason } = checkHeader(this.syncExpressionResponse.rawHeaders, key, value);
  const msg = reason === 'missing'
    ? `Expected header "${key}" to be present`
    : `Expected header "${key}" to be "${value}", got "${actualValue}"`;
  chai.expect(ok, msg).to.be.true;
});

Then(/^The sync expression search response should be returned in a timely manner$/, async function() {
  chai.expect(this.syncExpressionResponse.responseTime).to.be.lessThan(defaultExpectedResponseTime);
});

Then(/^The sync expression search response should match the expected JSON schema$/, async function() {
  await assertOpenApiResponse(
    { path: getRequestPath(searchEndpoint), method: 'post', statusCode: this.syncExpressionResponse.statusCode },
    this.syncExpressionResponse.body
  );
});

// ============================================
// SYNC SEARCH - PREDICATE QUERY
// ============================================

let specSyncPredicateSearch;

Given(/^System wants to sync search SR using predicate query$/, function () {
  specSyncPredicateSearch = spec();
});

When(/^A POST request to sync search is sent with predicate query$/, async function () {
  try {
    applyCommonHeaders(specSyncPredicateSearch.post(syncBaseUrl));
    const payload = createSearchRequestPayloadWithPredicateQuery();
    await assertOpenApiRequest({ path: getRequestPath(searchEndpoint), method: 'post' }, payload);
    const response = await specSyncPredicateSearch.withJson(payload);
    this.syncPredicateResponse = response;
  } catch (err) {
    console.error("Sync predicate query request failed", err);
    throw err;
  }
});

Then(/^The response from the sync predicate search should be received$/, async function () {
  chai.expect(this.syncPredicateResponse).to.exist;
});

Then(/^The sync predicate search response should have status (\d+)$/, async function(status) {
  chai.expect(this.syncPredicateResponse.statusCode).to.equal(Number(status));
});

Then(/^The sync predicate search response should have "([^"]*)": "([^"]*)" header$/, async function(key, value) {
  const { ok, actualValue, reason } = checkHeader(this.syncPredicateResponse.rawHeaders, key, value);
  const msg = reason === 'missing'
    ? `Expected header "${key}" to be present`
    : `Expected header "${key}" to be "${value}", got "${actualValue}"`;
  chai.expect(ok, msg).to.be.true;
});

Then(/^The sync predicate search response should be returned in a timely manner$/, async function() {
  chai.expect(this.syncPredicateResponse.responseTime).to.be.lessThan(defaultExpectedResponseTime);
});

Then(/^The sync predicate search response should match the expected JSON schema$/, async function() {
  await assertOpenApiResponse(
    { path: getRequestPath(searchEndpoint), method: 'post', statusCode: this.syncPredicateResponse.statusCode },
    this.syncPredicateResponse.body
  );
});
