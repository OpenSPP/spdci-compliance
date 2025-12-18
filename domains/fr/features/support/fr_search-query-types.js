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
} from './helpers/index.js';

import { assertOpenApiRequest, assertOpenApiResponse } from './helpers/index.js';

const asyncBaseUrl = localhost + asyncsearchEndpoint;
const syncBaseUrl = localhost + searchEndpoint;

// ============================================
// ASYNC SEARCH - EXPRESSION QUERY
// ============================================

let specExpressionSearch;

Given(/^System wants to search FR using expression query$/, function () {
  specExpressionSearch = spec();
});

When(/^A POST request to async search is sent with expression query$/, async function () {
  applyCommonHeaders(specExpressionSearch.post(asyncBaseUrl));
  const payload = createSearchRequestPayloadWithExpressionQuery();
  await assertOpenApiRequest({ path: getRequestPath(asyncsearchEndpoint), method: 'post' }, payload, 'fr');
  const response = await specExpressionSearch.withJson(payload);
  this.expressionResponse = response;
});

Then(/^The expression search response should be received$/, async function () {
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
    this.expressionResponse.body,
    'fr'
  );
});

// ============================================
// ASYNC SEARCH - PREDICATE QUERY
// ============================================

let specPredicateSearch;

Given(/^System wants to search FR using predicate query$/, function () {
  specPredicateSearch = spec();
});

When(/^A POST request to async search is sent with predicate query$/, async function () {
  applyCommonHeaders(specPredicateSearch.post(asyncBaseUrl));
  const payload = createSearchRequestPayloadWithPredicateQuery();
  await assertOpenApiRequest({ path: getRequestPath(asyncsearchEndpoint), method: 'post' }, payload, 'fr');
  const response = await specPredicateSearch.withJson(payload);
  this.predicateResponse = response;
});

Then(/^The predicate search response should be received$/, async function () {
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
    this.predicateResponse.body,
    'fr'
  );
});

// ============================================
// SYNC SEARCH - EXPRESSION QUERY
// ============================================

let specSyncExpressionSearch;

Given(/^System wants to sync search FR using expression query$/, function () {
  specSyncExpressionSearch = spec();
});

When(/^A POST request to sync search is sent with expression query$/, async function () {
  applyCommonHeaders(specSyncExpressionSearch.post(syncBaseUrl));
  const payload = createSearchRequestPayloadWithExpressionQuery();
  await assertOpenApiRequest({ path: getRequestPath(searchEndpoint), method: 'post' }, payload, 'fr');
  const response = await specSyncExpressionSearch.withJson(payload);
  this.syncExpressionResponse = response;
});

Then(/^The sync search response should be received$/, async function () {
  chai.expect(this.syncExpressionResponse || this.syncPredicateResponse || this.response).to.exist;
});

Then(/^The sync search response should have status (\d+) or (\d+)$/, async function(statusA, statusB) {
  const response = this.syncExpressionResponse || this.syncPredicateResponse || this.response;
  const allowed = [Number(statusA), Number(statusB)];
  chai.expect(
    allowed,
    `Expected status ${statusA} or ${statusB}, got ${response.statusCode}`
  ).to.include(Number(response.statusCode));
});

Then(/^The sync search response should have "([^"]*)": "([^"]*)" header$/, async function(key, value) {
  const response = this.syncExpressionResponse || this.syncPredicateResponse || this.response;
  const { ok, actualValue, reason } = checkHeader(response.rawHeaders, key, value);
  const msg = reason === 'missing'
    ? `Expected header "${key}" to be present`
    : `Expected header "${key}" to be "${value}", got "${actualValue}"`;
  chai.expect(ok, msg).to.be.true;
});

Then(/^The sync search response should be returned in a timely manner$/, async function() {
  const response = this.syncExpressionResponse || this.syncPredicateResponse || this.response;
  chai.expect(response.responseTime).to.be.lessThan(defaultExpectedResponseTime);
});

Then(/^The sync search response should match the expected JSON schema$/, async function() {
  const response = this.syncExpressionResponse || this.syncPredicateResponse || this.response;
  await assertOpenApiResponse(
    { path: getRequestPath(searchEndpoint), method: 'post', statusCode: response.statusCode },
    response.body,
    'fr'
  );
});

// ============================================
// SYNC SEARCH - PREDICATE QUERY
// ============================================

let specSyncPredicateSearch;

Given(/^System wants to sync search FR using predicate query$/, function () {
  specSyncPredicateSearch = spec();
});

When(/^A POST request to sync search is sent with predicate query$/, async function () {
  applyCommonHeaders(specSyncPredicateSearch.post(syncBaseUrl));
  const payload = createSearchRequestPayloadWithPredicateQuery();
  await assertOpenApiRequest({ path: getRequestPath(searchEndpoint), method: 'post' }, payload, 'fr');
  const response = await specSyncPredicateSearch.withJson(payload);
  this.syncPredicateResponse = response;
});

// ============================================
// SYNC SEARCH EXTRA VALIDATION
// ============================================

Given(/^System wants to sync search for person in FR$/, function () {
  specSyncPredicateSearch = spec();
});

When(/^A POST request to sync search is sent$/, async function () {
  applyCommonHeaders(specSyncPredicateSearch.post(syncBaseUrl));
  const payload = createSearchRequestPayloadWithExpressionQuery();
  await assertOpenApiRequest({ path: getRequestPath(searchEndpoint), method: 'post' }, payload, 'fr');
  const response = await specSyncPredicateSearch.withJson(payload);
  this.response = response;
});

Then(/^The sync search response should contain reg_records array$/, async function() {
  const response = this.syncExpressionResponse || this.syncPredicateResponse || this.response;
  const searchResponse = response.body?.message?.search_response;
  if (Array.isArray(searchResponse) && searchResponse.length > 0) {
    const data = searchResponse[0]?.data;
    if (data) {
      chai.expect(data).to.have.property('reg_records');
    }
  }
});
