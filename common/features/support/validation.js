/**
 * Common Validation Step Definitions
 *
 * Tests for SPDCI format and boundary validation requirements that apply
 * to ALL SPDCI domains (social, crvs, dr, fr, ibr):
 * - Timestamp: ISO 8601 with timezone (format: date-time)
 * - Locale: ISO 639.3 language codes (pattern: ^[a-z]{3,3}$)
 * - String lengths: transaction_id, correlation_id (max 99), messages (max 999)
 * - Pagination: page_size, page_number
 *
 * Configuration (environment variables):
 * - API_BASE_URL: Base URL of the registry under test (default: http://127.0.0.1:3333/)
 * - DOMAIN: Domain to test (social, crvs, dr, fr, ibr) (default: social)
 * - DCI_AUTH_TOKEN: Bearer token for authentication (optional)
 */

import chai from 'chai';
import pkg from 'pactum';
const { spec } = pkg;
import { Given, When, Then } from '@cucumber/cucumber';

import {
  generateId,
  getTimestamp,
  createHeader,
  createEnvelope,
} from '../../helpers/envelope.js';

import {
  assertHttpErrorResponse,
} from '../../helpers/openapi-validator.js';

// ============================================
// CONFIGURATION
// ============================================

const baseUrl = process.env.API_BASE_URL || 'http://127.0.0.1:3333/';
const domain = process.env.DOMAIN || 'social';
const authToken = process.env.DCI_AUTH_TOKEN;

// Domain-specific endpoint prefixes
const endpointPrefix = process.env.ENDPOINT_PREFIX || 'registry/';

// Common endpoints across all SPDCI domains
const ENDPOINTS = {
  'async search': `${endpointPrefix}search`,
  'async subscribe': `${endpointPrefix}subscribe`,
  'async unsubscribe': `${endpointPrefix}unsubscribe`,
  'sync search': `${endpointPrefix}sync/search`,
};

// ============================================
// HELPER FUNCTIONS
// ============================================

function getEndpoint(name) {
  const key = String(name || '').trim().toLowerCase();
  if (!ENDPOINTS[key]) throw new Error(`Unknown endpoint: ${name}`);
  return ENDPOINTS[key];
}

function applyHeaders(request) {
  request.withHeaders('Accept', 'application/json');
  request.withHeaders('Content-Type', 'application/json');
  if (authToken) {
    const token = authToken.startsWith('Bearer ') ? authToken : `Bearer ${authToken}`;
    request.withHeaders('Authorization', token);
  }
  return request;
}

/**
 * Create a generic search request payload (works for all SPDCI domains)
 */
function createSearchPayload() {
  return createEnvelope('search', {
    transaction_id: generateId(),
    search_request: [{
      reference_id: `ref-${generateId()}`,
      timestamp: getTimestamp(),
      search_criteria: {
        query_type: 'idtype-value',
        query: { type: 'UIN', value: 'TEST-001' },
      },
    }],
  });
}

/**
 * Create a generic subscribe request payload
 */
function createSubscribePayload() {
  return createEnvelope('subscribe', {
    transaction_id: generateId(),
    subscribe_request: [{
      reference_id: `ref-${generateId()}`,
      timestamp: getTimestamp(),
      subscribe_criteria: {
        reg_event_type: 'REGISTER',
        filter: { type: 'UIN', value: 'TEST-001' },
        notify_record_type: 'Member',
      },
    }],
  });
}

/**
 * Create a generic unsubscribe request payload
 */
function createUnsubscribePayload() {
  return createEnvelope('unsubscribe', {
    transaction_id: generateId(),
    timestamp: getTimestamp(),
    subscription_codes: ['sub-test-001'],
  });
}

function buildPayload(operationType) {
  const key = String(operationType || '').trim().toLowerCase();
  switch (key) {
    case 'async search':
    case 'sync search':
      return createSearchPayload();
    case 'async subscribe':
      return createSubscribePayload();
    case 'async unsubscribe':
      return createUnsubscribePayload();
    default:
      throw new Error(`Unknown payload type: ${operationType}`);
  }
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
  const validTimestamp = getTimestamp();
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
  const url = baseUrl + endpoint;
  const request = spec();
  applyHeaders(request.post(url));
  this.response = await request.withJson(this.payload);
});

Then(/^The request should be rejected due to invalid format$/, async function () {
  chai.expect(this.response, 'Expected a response').to.exist;
  const status = Number(this.response.statusCode);

  if (status >= 400 && status < 500) {
    await assertHttpErrorResponse(this.response.body);
  } else if (status === 200 || status === 202) {
    const ackStatus = this.response.body?.message?.ack_status;
    chai.expect(ackStatus, 'Expected ACK ERR for invalid format').to.equal('ERR');
  } else {
    throw new Error(`Expected 4xx or 200/202 with ERR, got ${status}`);
  }
});

Then(/^The request should be accepted or processed$/, async function () {
  chai.expect(this.response, 'Expected a response').to.exist;
  const status = Number(this.response.statusCode);

  if (status === 200 || status === 202) {
    const ackStatus = this.response.body?.message?.ack_status;
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
  const url = baseUrl + endpoint;
  const request = spec();
  applyHeaders(request.post(url));
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
  const url = baseUrl + ENDPOINTS['async search'];
  const request = spec();
  applyHeaders(request.post(url));
  this.response = await request.withJson(this.payload);
});

When(/^The paginated sync search request is sent$/, async function () {
  const url = baseUrl + ENDPOINTS['sync search'];
  const request = spec();
  applyHeaders(request.post(url));
  this.response = await request.withJson(this.payload);
});

Then(/^The response should acknowledge pagination$/, function () {
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
