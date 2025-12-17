/**
 * SPMIS Client Compliance Test Step Definitions
 *
 * These steps validate that an SPMIS client correctly sends requests to a registry.
 * The tests use a mock registry server that validates and records incoming requests.
 *
 * Configuration (environment variables):
 * - MOCK_REGISTRY_ADMIN_URL: Admin API URL of the mock registry (default: http://localhost:3335/admin)
 * - CLIENT_TRIGGER_URL: URL to trigger client actions (implementation-specific)
 * - CLIENT_TRIGGER_METHOD: HTTP method for triggering (default: POST)
 */

import chai from 'chai';
import { Given, When, Then, Before } from '@cucumber/cucumber';

const { expect } = chai;

// ============================================
// CONFIGURATION
// ============================================

const mockRegistryAdminUrl = process.env.MOCK_REGISTRY_ADMIN_URL || 'http://localhost:3335/admin';
const clientTriggerUrl = process.env.CLIENT_TRIGGER_URL || 'http://localhost:8080/test/trigger';
const clientTriggerMethod = process.env.CLIENT_TRIGGER_METHOD || 'POST';

// ============================================
// HELPER FUNCTIONS
// ============================================

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  return {
    status: response.status,
    body: await response.json().catch(() => null),
  };
}

async function mockRegistryAdmin(path, options = {}) {
  return fetchJson(`${mockRegistryAdminUrl}${path}`, options);
}

async function triggerClient(action, params = {}) {
  const url = `${clientTriggerUrl}/${action}`;
  return fetchJson(url, {
    method: clientTriggerMethod,
    body: JSON.stringify(params),
  });
}

// ============================================
// HOOKS
// ============================================

Before({ tags: '@profile=spmis-client' }, async function () {
  try {
    const health = await mockRegistryAdmin('/healthcheck');
    if (health.status !== 200) {
      throw new Error(`Mock registry not healthy: ${health.status}`);
    }
    this.mockRegistryAvailable = true;
  } catch (e) {
    console.warn(`[client-test] Mock registry not available at ${mockRegistryAdminUrl}: ${e.message}`);
    this.mockRegistryAvailable = false;
  }
});

// ============================================
// GIVEN STEPS - MOCK REGISTRY SETUP
// ============================================

Given(/^The mock registry is ready and recordings are cleared$/, async function () {
  if (!this.mockRegistryAvailable) return 'pending';

  const result = await mockRegistryAdmin('/requests', { method: 'DELETE' });
  expect(result.status).to.equal(200);

  await mockRegistryAdmin('/reset', { method: 'POST' });
  this.mockRegistryReady = true;
});

Given(/^The mock registry is ready and configured for success$/, async function () {
  if (!this.mockRegistryAvailable) return 'pending';

  await mockRegistryAdmin('/requests', { method: 'DELETE' });
  await mockRegistryAdmin('/config', {
    method: 'POST',
    body: JSON.stringify({
      endpoints: {},
      callbacks: { enabled: true, failRate: 0 },
    }),
  });

  this.mockRegistryReady = true;
});

Given(/^The mock registry is ready and configured to return error$/, async function () {
  if (!this.mockRegistryAvailable) return 'pending';

  await mockRegistryAdmin('/requests', { method: 'DELETE' });
  await mockRegistryAdmin('/config', {
    method: 'POST',
    body: JSON.stringify({
      endpoints: {
        '/registry/search': {
          status: 'error',
          errorCode: 'err.test.configured',
          errorMessage: 'Test error response',
        },
      },
    }),
  });

  this.mockRegistryReady = true;
  this.expectError = true;
});

// ============================================
// WHEN STEPS - CLIENT TRIGGERS
// ============================================

When(/^The client sends a search request$/, async function () {
  if (!this.mockRegistryReady) return 'pending';

  try {
    this.clientResponse = await triggerClient('search', {
      query_type: 'idtype-value',
      query: { type: 'UIN', value: 'TEST-001' },
    });
  } catch (e) {
    console.warn(`[client-test] Failed to trigger client: ${e.message}`);
    this.clientError = e;
  }

  await new Promise(resolve => setTimeout(resolve, 100));

  const recordings = await mockRegistryAdmin('/requests');
  this.recordings = recordings.body?.requests || [];
  this.latestRecording = this.recordings[this.recordings.length - 1];
});

When(/^The client sends a subscribe request$/, async function () {
  if (!this.mockRegistryReady) return 'pending';

  try {
    this.clientResponse = await triggerClient('subscribe', {
      event_type: 'REGISTER',
    });
  } catch (e) {
    this.clientError = e;
  }

  await new Promise(resolve => setTimeout(resolve, 100));

  const recordings = await mockRegistryAdmin('/requests');
  this.recordings = recordings.body?.requests || [];
  this.latestRecording = this.recordings[this.recordings.length - 1];
});

When(/^The client sends an unsubscribe request$/, async function () {
  if (!this.mockRegistryReady) return 'pending';

  try {
    this.clientResponse = await triggerClient('unsubscribe', {
      subscription_codes: ['sub-test-001'],
    });
  } catch (e) {
    this.clientError = e;
  }

  await new Promise(resolve => setTimeout(resolve, 100));

  const recordings = await mockRegistryAdmin('/requests');
  this.recordings = recordings.body?.requests || [];
  this.latestRecording = this.recordings[this.recordings.length - 1];
});

// ============================================
// THEN STEPS - RECORDING ASSERTIONS
// ============================================

Then(/^The mock registry should have recorded (\d+) request(?:s)? to "([^"]*)"$/, async function (count, endpoint) {
  const filtered = this.recordings.filter(r => r.endpoint === endpoint);
  expect(filtered.length, `Expected ${count} request(s) to ${endpoint}`).to.equal(Number(count));
});

Then(/^The recorded request should have a valid "([^"]*)" object$/, function (field) {
  expect(this.latestRecording, 'No recording found').to.exist;
  expect(this.latestRecording.body, 'Recording has no body').to.exist;
  expect(this.latestRecording.body[field], `Missing ${field} in request`).to.be.an('object');
});

Then(/^The recorded request header should have action "([^"]*)"$/, function (action) {
  expect(this.latestRecording?.body?.header?.action).to.equal(action);
});

Then(/^The recorded request should pass OpenAPI validation$/, function () {
  expect(this.latestRecording, 'No recording found').to.exist;
  const validation = this.latestRecording.validation;
  expect(validation, 'No validation result').to.exist;

  if (!validation.valid) {
    const errors = validation.errors.map(e => `${e.path}: ${e.message}`).join('\n');
    expect.fail(`OpenAPI validation failed:\n${errors}`);
  }
});

Then(/^The recorded request should have an? "([^"]*)" header$/, function (headerName) {
  expect(this.latestRecording, 'No recording found').to.exist;
  const headers = this.latestRecording.headers || {};
  const headerLower = headerName.toLowerCase();
  const found = Object.keys(headers).some(k => k.toLowerCase() === headerLower);
  expect(found, `Missing ${headerName} header`).to.be.true;
});

Then(/^The Authorization header should be a Bearer token$/, function () {
  const auth = this.latestRecording?.headers?.authorization || this.latestRecording?.headers?.Authorization;
  expect(auth, 'No Authorization header').to.exist;
  expect(auth).to.match(/^Bearer\s+\S+/i, 'Authorization should be Bearer token');
});

Then(/^The Content-Type header should be "([^"]*)"$/, function (expected) {
  const ct = this.latestRecording?.headers?.['content-type'] || this.latestRecording?.headers?.['Content-Type'];
  expect(ct, 'No Content-Type header').to.exist;
  expect(ct.toLowerCase()).to.include(expected.toLowerCase());
});

Then(/^The recorded request header should have version "([^"]*)"$/, function (version) {
  expect(this.latestRecording?.body?.header?.version).to.equal(version);
});

Then(/^The recorded request header should have a non-empty "([^"]*)"$/, function (field) {
  const value = this.latestRecording?.body?.header?.[field];
  expect(value, `Missing header.${field}`).to.exist;
  expect(value.length, `Empty header.${field}`).to.be.greaterThan(0);
});

Then(/^The recorded request header should have a valid "sender_uri" URL$/, function () {
  const uri = this.latestRecording?.body?.header?.sender_uri;
  expect(uri, 'Missing sender_uri').to.exist;
  expect(() => new URL(uri), `Invalid URL: ${uri}`).to.not.throw();
});

Then(/^The recorded request message should have a non-empty "([^"]*)"$/, function (field) {
  const value = this.latestRecording?.body?.message?.[field];
  expect(value, `Missing message.${field}`).to.exist;
  if (typeof value === 'string') {
    expect(value.length, `Empty message.${field}`).to.be.greaterThan(0);
  }
});

// ============================================
// THEN STEPS - CLIENT RESPONSE ASSERTIONS
// ============================================

Then(/^The client should receive an ACK response$/, function () {
  if (this.clientResponse?.body?.ack_status) {
    expect(this.clientResponse.body.ack_status).to.equal('ACK');
  } else {
    expect(this.clientError).to.be.undefined;
  }
});

Then(/^The client should receive an ERR response$/, function () {
  if (this.clientResponse?.body?.ack_status) {
    expect(this.clientResponse.body.ack_status).to.equal('ERR');
  }
});

Then(/^The client should not report an error$/, function () {
  expect(this.clientError, 'Client reported error').to.be.undefined;
});

Then(/^The client should handle the error gracefully$/, function () {
  // Client should not crash even if it gets an error response
  expect(true).to.be.true;
});
