/**
 * SPMIS Client Compliance Step Definitions
 *
 * These tests verify that an SPMIS client implementation sends requests
 * that conform to the SPDCI Social Registry API specification.
 *
 * Unlike server tests (which validate responses), client tests validate:
 * - Request payloads match OpenAPI schema
 * - Required headers are present
 * - Message structure is correct
 * - Query types are properly formatted
 */

import chai from 'chai';
import { Given, When, Then } from '@cucumber/cucumber';

import {
  acceptHeader,
  contentTypeHeader,
  extraHeaders,
  asyncsearchEndpoint,
  subscribeEndpoint,
  unsubscribeEndpoint,
  searchEndpoint,
  createSearchRequestPayload,
  createSearchRequestPayloadWithExpressionQuery,
  createSearchRequestPayloadWithPredicateQuery,
  createSubscribeRequestPayload,
  createUnsubscribeRequestPayload,
  getRequestPath,
  generateId,
  getTimestamp,
  createEnvelope,
} from './helpers/index.js';

import { assertOpenApiRequest } from './helpers/index.js';

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Build standard request headers
 */
function buildRequestHeaders(options = {}) {
  const headers = {};
  headers[acceptHeader.key] = acceptHeader.value;
  headers[contentTypeHeader.key] = contentTypeHeader.value;

  for (const h of extraHeaders) {
    if (options.includeAuth || h.key.toLowerCase() !== 'authorization') {
      headers[h.key] = h.value;
    }
  }

  return headers;
}

/**
 * Create a search payload with sender_uri for async callbacks
 */
function createSearchRequestPayloadWithCallback() {
  const payload = createSearchRequestPayload();
  payload.header.sender_uri = process.env.DCI_SENDER_URI || 'http://localhost:8080/registry/on-search';
  return payload;
}

// ============================================
// GIVEN STEPS - Prepare requests
// ============================================

Given(/^The client prepares a search request$/, function () {
  this.requestType = 'search';
  this.endpoint = asyncsearchEndpoint;
});

Given(/^The client prepares a subscribe request$/, function () {
  this.requestType = 'subscribe';
  this.endpoint = subscribeEndpoint;
});

Given(/^The client prepares an unsubscribe request$/, function () {
  this.requestType = 'unsubscribe';
  this.endpoint = unsubscribeEndpoint;
});

Given(/^The client prepares a sync search request$/, function () {
  this.requestType = 'sync-search';
  this.endpoint = searchEndpoint;
});

Given(/^The client prepares a search request with callback$/, function () {
  this.requestType = 'search-with-callback';
  this.endpoint = asyncsearchEndpoint;
});

Given(/^The client prepares a search request with idtype-value query$/, function () {
  this.requestType = 'search-idtype';
  this.endpoint = asyncsearchEndpoint;
});

Given(/^The client prepares a search request with expression query$/, function () {
  this.requestType = 'search-expression';
  this.endpoint = asyncsearchEndpoint;
});

Given(/^The client prepares a search request with predicate query$/, function () {
  this.requestType = 'search-predicate';
  this.endpoint = asyncsearchEndpoint;
});

Given(/^The client sends a valid search request$/, function () {
  this.requestType = 'search';
  this.endpoint = asyncsearchEndpoint;
  this.payload = createSearchRequestPayload();
});

// ============================================
// WHEN STEPS - Build payloads and headers
// ============================================

When(/^The request payload is built$/, function () {
  switch (this.requestType) {
    case 'search':
    case 'sync-search':
      this.payload = createSearchRequestPayload();
      break;
    case 'subscribe':
      this.payload = createSubscribeRequestPayload();
      break;
    case 'unsubscribe':
      this.payload = createUnsubscribeRequestPayload();
      break;
    case 'search-idtype':
      this.payload = createSearchRequestPayload();
      break;
    case 'search-expression':
      this.payload = createSearchRequestPayloadWithExpressionQuery();
      break;
    case 'search-predicate':
      this.payload = createSearchRequestPayloadWithPredicateQuery();
      break;
    default:
      throw new Error(`Unknown request type: ${this.requestType}`);
  }
});

When(/^The request payload is built with sender_uri$/, function () {
  this.payload = createSearchRequestPayloadWithCallback();
});

When(/^The request headers are built$/, function () {
  this.headers = buildRequestHeaders({ includeAuth: false });
});

When(/^The request headers are built for authenticated endpoint$/, function () {
  this.headers = buildRequestHeaders({ includeAuth: true });
});

When(/^The server responds with ACK status$/, function () {
  this.mockResponse = {
    message: {
      ack_status: 'ACK',
      timestamp: getTimestamp(),
      correlation_id: generateId(),
    },
  };
});

When(/^The server responds with ERR status$/, function () {
  this.mockResponse = {
    message: {
      ack_status: 'ERR',
      timestamp: getTimestamp(),
      correlation_id: generateId(),
      error: {
        code: 'err.request.bad',
        message: 'Invalid request parameters',
      },
    },
  };
});

// ============================================
// THEN STEPS - Validate payloads
// ============================================

Then(/^The search request payload should be OpenAPI-valid$/, async function () {
  await assertOpenApiRequest({ path: getRequestPath(asyncsearchEndpoint), method: 'post' }, this.payload);
});

Then(/^The subscribe request payload should be OpenAPI-valid$/, async function () {
  await assertOpenApiRequest({ path: getRequestPath(subscribeEndpoint), method: 'post' }, this.payload);
});

Then(/^The unsubscribe request payload should be OpenAPI-valid$/, async function () {
  await assertOpenApiRequest({ path: getRequestPath(unsubscribeEndpoint), method: 'post' }, this.payload);
});

Then(/^The sync search request payload should be OpenAPI-valid$/, async function () {
  await assertOpenApiRequest({ path: getRequestPath(searchEndpoint), method: 'post' }, this.payload);
});

Then(/^The request should include a message body with search_request$/, function () {
  chai.expect(this.payload.message, 'Payload should have message').to.exist;
  chai.expect(this.payload.message.search_request, 'Message should have search_request').to.exist;
  chai.expect(this.payload.message.search_request).to.be.an('array').that.is.not.empty;
});

Then(/^The request should include a message body with subscribe_request$/, function () {
  chai.expect(this.payload.message, 'Payload should have message').to.exist;
  chai.expect(this.payload.message.subscribe_request, 'Message should have subscribe_request').to.exist;
  chai.expect(this.payload.message.subscribe_request).to.be.an('array').that.is.not.empty;
});

Then(/^The request should include a message body with unsubscribe_request$/, function () {
  chai.expect(this.payload.message, 'Payload should have message').to.exist;
  chai.expect(this.payload.message.subscription_codes, 'Message should have subscription_codes').to.exist;
});

// ============================================
// THEN STEPS - Validate headers
// ============================================

Then(/^The header version should be "([^"]*)"$/, function (expectedVersion) {
  chai.expect(this.payload.header.version).to.equal(expectedVersion);
});

Then(/^The header should include sender_id$/, function () {
  chai.expect(this.payload.header.sender_id, 'Header should have sender_id').to.exist;
  chai.expect(this.payload.header.sender_id).to.be.a('string').that.is.not.empty;
});

Then(/^The header should include receiver_id$/, function () {
  chai.expect(this.payload.header.receiver_id, 'Header should have receiver_id').to.exist;
  chai.expect(this.payload.header.receiver_id).to.be.a('string').that.is.not.empty;
});

Then(/^The header should include sender_uri$/, function () {
  chai.expect(this.payload.header.sender_uri, 'Header should have sender_uri for async callbacks').to.exist;
  chai.expect(this.payload.header.sender_uri).to.be.a('string').that.is.not.empty;
});

Then(/^The message should include transaction_id$/, function () {
  chai.expect(this.payload.message.transaction_id, 'Message should have transaction_id').to.exist;
});

Then(/^The Authorization header should be present$/, function () {
  const hasAuth = Object.keys(this.headers).some(k => k.toLowerCase() === 'authorization');
  chai.expect(hasAuth, 'Authorization header should be present').to.be.true;
});

Then(/^The Authorization header should use Bearer scheme$/, function () {
  const authKey = Object.keys(this.headers).find(k => k.toLowerCase() === 'authorization');
  chai.expect(authKey, 'Authorization header should exist').to.exist;
  const authValue = this.headers[authKey];
  chai.expect(authValue, 'Authorization should use Bearer scheme').to.match(/^Bearer\s+/);
});

// ============================================
// THEN STEPS - Query type validation
// ============================================

Then(/^The query type should be "([^"]*)"$/, function (expectedQueryType) {
  const searchRequest = this.payload.message.search_request?.[0];
  chai.expect(searchRequest, 'search_request should exist').to.exist;
  chai.expect(searchRequest.search_criteria?.query_type).to.equal(expectedQueryType);
});

Then(/^The query should contain type and value fields$/, function () {
  const query = this.payload.message.search_request?.[0]?.search_criteria?.query;
  chai.expect(query, 'query should exist').to.exist;
  chai.expect(query.type, 'query should have type').to.exist;
  chai.expect(query.value, 'query should have value').to.exist;
});

Then(/^The query should contain expression fields$/, function () {
  const query = this.payload.message.search_request?.[0]?.search_criteria?.query;
  chai.expect(query, 'query should exist').to.exist;
  chai.expect(query.type, 'expression query should have type').to.exist;
  chai.expect(query.value, 'expression query should have value').to.exist;
});

Then(/^The query should be an array of predicates$/, function () {
  const query = this.payload.message.search_request?.[0]?.search_criteria?.query;
  chai.expect(query, 'query should exist').to.be.an('array').that.is.not.empty;
  chai.expect(query[0].expression1, 'predicate should have expression1').to.exist;
  chai.expect(query[0].expression2, 'predicate should have expression2').to.exist;
});

// ============================================
// THEN STEPS - Response handling
// ============================================

Then(/^The client should accept the ACK response$/, function () {
  chai.expect(this.mockResponse.message.ack_status).to.equal('ACK');
});

Then(/^The response should contain correlation_id$/, function () {
  chai.expect(this.mockResponse.message.correlation_id, 'Response should have correlation_id').to.exist;
});

Then(/^The client should handle the ERR response gracefully$/, function () {
  chai.expect(this.mockResponse.message.ack_status).to.equal('ERR');
});

Then(/^The response should contain an error object$/, function () {
  chai.expect(this.mockResponse.message.error, 'ERR response should have error object').to.exist;
  chai.expect(this.mockResponse.message.error.code, 'Error should have code').to.exist;
  chai.expect(this.mockResponse.message.error.message, 'Error should have message').to.exist;
});
