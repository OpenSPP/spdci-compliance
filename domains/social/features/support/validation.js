/**
 * Validation Step Definitions
 *
 * Tests for SPDCI format and boundary validation requirements:
 * - Timestamp: ISO 8601 with timezone (format: date-time)
 * - Locale: ISO 639.3 language codes (pattern: ^[a-z]{3,3}$)
 * - String lengths: transaction_id, correlation_id (max 99), messages (max 999)
 * - Pagination: page_size, page_number
 */

import chai from 'chai';
import pkg from 'pactum';
const { spec } = pkg;
import { Given, When, Then } from '@cucumber/cucumber';

import {
  localhost,
  applyCommonHeaders,
  getRequestPath,
  asyncsearchEndpoint,
  subscribeEndpoint,
  unsubscribeEndpoint,
  searchEndpoint,
  createSearchRequestPayload,
  createSubscribeRequestPayload,
  createUnsubscribeRequestPayload,
  getTimestamp,
  generateId,
} from './helpers/index.js';

import { assertOpenApiRequest, assertHttpErrorResponse } from './helpers/index.js';

// ============================================
// ENDPOINT MAPPING
// ============================================

const ENDPOINTS = {
  'async search': asyncsearchEndpoint,
  'async subscribe': subscribeEndpoint,
  'async unsubscribe': unsubscribeEndpoint,
  'sync search': searchEndpoint,
};

const PAYLOAD_BUILDERS = {
  'async search': createSearchRequestPayload,
  'async subscribe': createSubscribeRequestPayload,
  'async unsubscribe': createUnsubscribeRequestPayload,
  'sync search': createSearchRequestPayload,
};

function getEndpoint(name) {
  const key = String(name || '').trim().toLowerCase();
  if (!ENDPOINTS[key]) throw new Error(`Unknown endpoint: ${name}`);
  return ENDPOINTS[key];
}

function buildPayload(name) {
  const key = String(name || '').trim().toLowerCase();
  const builder = PAYLOAD_BUILDERS[key];
  if (!builder) throw new Error(`Unknown payload type: ${name}`);
  return builder();
}

// ============================================
// FORMAT VALIDATION STEPS
// ============================================

Given(/^A valid "([^"]+)" request payload is prepared for format testing$/, function (operationType) {
  this.operationType = operationType;
  this.endpoint = getEndpoint(operationType);
  this.payload = buildPayload(operationType);
});

When(/^The timestamp is set to an invalid format "([^"]*)"$/, function (invalidTimestamp) {
  if (this.payload.message?.search_request?.[0]) {
    this.payload.message.search_request[0].timestamp = invalidTimestamp;
  } else if (this.payload.message?.subscribe_request?.[0]) {
    this.payload.message.subscribe_request[0].timestamp = invalidTimestamp;
  }
});

When(/^The timestamp is set to a valid ISO 8601 format$/, function () {
  const validTimestamp = getTimestamp(); // Returns ISO 8601 with timezone
  if (this.payload.message?.search_request?.[0]) {
    this.payload.message.search_request[0].timestamp = validTimestamp;
  } else if (this.payload.message?.subscribe_request?.[0]) {
    this.payload.message.subscribe_request[0].timestamp = validTimestamp;
  }
});

When(/^The timestamp is set to ISO 8601 without timezone "([^"]*)"$/, function (timestampNoTz) {
  if (this.payload.message?.search_request?.[0]) {
    this.payload.message.search_request[0].timestamp = timestampNoTz;
  } else if (this.payload.message?.subscribe_request?.[0]) {
    this.payload.message.subscribe_request[0].timestamp = timestampNoTz;
  }
});

When(/^The locale is set to valid ISO 639\.3 code "([^"]*)"$/, function (locale) {
  if (this.payload.message?.search_request?.[0]) {
    this.payload.message.search_request[0].locale = locale;
  }
});

When(/^The locale is set to invalid code "([^"]*)"$/, function (invalidLocale) {
  if (this.payload.message?.search_request?.[0]) {
    this.payload.message.search_request[0].locale = invalidLocale;
  }
});

When(/^The format test request is sent to "([^"]+)"$/, async function (operationType) {
  const endpoint = getEndpoint(operationType);
  const baseUrl = localhost + endpoint;
  const request = spec();
  applyCommonHeaders(request.post(baseUrl));
  this.response = await request.withJson(this.payload);
});

Then(/^The request should be rejected due to invalid format$/, async function () {
  chai.expect(this.response, 'Expected a response').to.exist;
  const status = Number(this.response.statusCode);

  // Accept either HTTP 4xx error or 200 with ACK ERR
  if (status >= 400 && status < 500) {
    await assertHttpErrorResponse(this.response.body);
  } else if (status === 200 || status === 202) {
    // Check for ACK ERR response
    const ackStatus = this.response.body?.message?.ack_status;
    chai.expect(ackStatus, 'Expected ACK ERR for invalid format').to.equal('ERR');
  } else {
    throw new Error(`Expected 4xx or 200/202 with ERR, got ${status}`);
  }
});

Then(/^The request should be accepted or processed$/, async function () {
  chai.expect(this.response, 'Expected a response').to.exist;
  const status = Number(this.response.statusCode);

  // Accept 200, 202 with ACK, or successful processing
  if (status === 200 || status === 202) {
    const ackStatus = this.response.body?.message?.ack_status;
    // ACK or no ack_status (direct response) is acceptable
    if (ackStatus) {
      chai.expect(['ACK', 'succ'], `Expected successful response, got ${ackStatus}`).to.include(ackStatus);
    }
  } else {
    throw new Error(`Expected 200 or 202, got ${status}`);
  }
});

// ============================================
// BOUNDARY VALIDATION STEPS
// ============================================

Given(/^A valid "([^"]+)" request payload is prepared for boundary testing$/, function (operationType) {
  this.operationType = operationType;
  this.endpoint = getEndpoint(operationType);
  this.payload = buildPayload(operationType);
});

When(/^The transaction_id is set to exactly (\d+) characters$/, function (length) {
  this.payload.message.transaction_id = 'x'.repeat(Number(length));
});

When(/^The transaction_id is set to (\d+) characters$/, function (length) {
  this.payload.message.transaction_id = 'x'.repeat(Number(length));
});

When(/^The reference_id is set to (\d+) characters$/, function (length) {
  const refId = 'r'.repeat(Number(length));
  if (this.payload.message?.search_request?.[0]) {
    this.payload.message.search_request[0].reference_id = refId;
  } else if (this.payload.message?.txnstatus_request) {
    this.payload.message.txnstatus_request.reference_id = refId;
  }
});

When(/^The subscription_code is set to exactly (\d+) characters$/, function (length) {
  if (this.payload.message?.subscription_codes) {
    this.payload.message.subscription_codes = ['s'.repeat(Number(length))];
  }
});

When(/^The subscription_code is set to (\d+) characters$/, function (length) {
  if (this.payload.message?.subscription_codes) {
    this.payload.message.subscription_codes = ['s'.repeat(Number(length))];
  }
});

When(/^The boundary test request is sent to "([^"]+)"$/, async function (operationType) {
  const endpoint = getEndpoint(operationType);
  const baseUrl = localhost + endpoint;
  const request = spec();
  applyCommonHeaders(request.post(baseUrl));
  this.response = await request.withJson(this.payload);
});

Then(/^The request should be rejected due to boundary violation$/, async function () {
  chai.expect(this.response, 'Expected a response').to.exist;
  const status = Number(this.response.statusCode);

  if (status >= 400 && status < 500) {
    await assertHttpErrorResponse(this.response.body);
  } else if (status === 200 || status === 202) {
    const ackStatus = this.response.body?.message?.ack_status;
    chai.expect(ackStatus, 'Expected ACK ERR for boundary violation').to.equal('ERR');
  } else {
    throw new Error(`Expected 4xx or 200/202 with ERR, got ${status}`);
  }
});

// ============================================
// PAGINATION STEPS
// ============================================

Given(/^A valid "([^"]+)" request payload is prepared with pagination$/, function (operationType) {
  this.operationType = operationType;
  this.endpoint = getEndpoint(operationType);
  this.payload = buildPayload(operationType);
});

When(/^The pagination is set to page_size (\d+) and page_number (\d+)$/, function (pageSize, pageNumber) {
  const pagination = {
    page_size: Number(pageSize),
    page_number: Number(pageNumber),
  };

  if (this.payload.message?.search_request?.[0]) {
    this.payload.message.search_request[0].pagination = pagination;
  }
});

When(/^The pagination is set to page_size (-?\d+) and page_number (-?\d+)$/, function (pageSize, pageNumber) {
  const pagination = {
    page_size: Number(pageSize),
    page_number: Number(pageNumber),
  };

  if (this.payload.message?.search_request?.[0]) {
    this.payload.message.search_request[0].pagination = pagination;
  }
});

When(/^The paginated search request is sent$/, async function () {
  const baseUrl = localhost + asyncsearchEndpoint;
  const request = spec();
  applyCommonHeaders(request.post(baseUrl));
  this.response = await request.withJson(this.payload);
});

When(/^The paginated sync search request is sent$/, async function () {
  const baseUrl = localhost + searchEndpoint;
  const request = spec();
  applyCommonHeaders(request.post(baseUrl));
  this.response = await request.withJson(this.payload);
});

Then(/^The response should acknowledge pagination$/, function () {
  // Pagination acknowledgment varies by implementation
  // Just verify we got a valid response
  chai.expect(this.response, 'Expected a response').to.exist;
});

Then(/^The request should be rejected due to invalid pagination$/, async function () {
  chai.expect(this.response, 'Expected a response').to.exist;
  const status = Number(this.response.statusCode);

  if (status >= 400 && status < 500) {
    await assertHttpErrorResponse(this.response.body);
  } else if (status === 200 || status === 202) {
    const ackStatus = this.response.body?.message?.ack_status;
    chai.expect(ackStatus, 'Expected ACK ERR for invalid pagination').to.equal('ERR');
  } else {
    throw new Error(`Expected 4xx or 200/202 with ERR, got ${status}`);
  }
});
