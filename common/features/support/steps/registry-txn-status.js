/**
 * Registry Transaction Status Step Definitions
 *
 * Domain-agnostic step definitions for sync and async transaction status operations.
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
// ASYNC TXN STATUS STEPS
// ============================================

let specAsyncTxnStatus;

Given(/^System wants to check async transaction status in (?:the registry|SR|FR|CRVS)$/, function () {
  specAsyncTxnStatus = spec();
});

When(/^A POST request to async txn status is sent$/, async function () {
  try {
    const endpoint = this.getEndpoint('asyncTxnStatus');
    const url = this.baseUrl + endpoint;
    const requestPath = getRequestPath(endpoint, this.baseUrl);

    applyCommonHeaders(specAsyncTxnStatus.post(url));
    const payload = this.payloads.createTxnStatusRequestPayload();

    await assertOpenApiRequest({ path: requestPath, method: 'post', domain: this.domain }, payload);
    const response = await specAsyncTxnStatus.withJson(payload);
    this.response = response;
    this.requestPath = requestPath;
  } catch (err) {
    console.error('Request failed', err);
    throw err;
  }
});

Then(/^The async txn status response should be received$/, async function () {
  chai.expect(this.response).to.exist;
});

Then(/^The async txn status response should have status (\d+)$/, async function (status) {
  chai.expect(this.response.statusCode).to.equal(Number(status));
});

Then(/^The async txn status response should have status (\d+) or (\d+)$/, async function (statusA, statusB) {
  const allowed = [Number(statusA), Number(statusB)];
  chai.expect(
    allowed,
    `Expected status ${statusA} or ${statusB}, got ${this.response.statusCode}`
  ).to.include(Number(this.response.statusCode));
});

Then(/^The async txn status response should have "([^"]*)": "([^"]*)" header$/, async function (key, value) {
  const { ok, actualValue, reason } = checkHeader(this.response.rawHeaders, key, value);
  const msg = reason === 'missing'
    ? `Expected header "${key}" to be present`
    : `Expected header "${key}" to be "${value}", got "${actualValue}"`;
  chai.expect(ok, msg).to.be.true;
});

Then(/^The async txn status response should be returned in a timely manner(?: within (\d+)ms)?$/, async function (timeout) {
  const threshold = timeout ? Number(timeout) : getResponseTimeThreshold();
  chai.expect(this.response.responseTime).to.be.lessThan(threshold);
});

Then(/^The async txn status response should match the expected JSON schema$/, async function () {
  const requestPath = this.requestPath || getRequestPath(this.getEndpoint('asyncTxnStatus'), this.baseUrl);
  await assertOpenApiResponse(
    { path: requestPath, method: 'post', statusCode: this.response.statusCode, domain: this.domain },
    this.response.body
  );
});

// ============================================
// SYNC TXN STATUS STEPS
// ============================================

let specSyncTxnStatus;

Given(/^System wants to check sync transaction status in (?:the registry|SR|FR|CRVS)$/, function () {
  specSyncTxnStatus = spec();
});

When(/^A POST request to sync txn status is sent$/, async function () {
  try {
    const endpoint = this.getEndpoint('syncTxnStatus');
    const url = this.baseUrl + endpoint;
    const requestPath = getRequestPath(endpoint, this.baseUrl);

    applyCommonHeaders(specSyncTxnStatus.post(url));
    const payload = this.payloads.createTxnStatusRequestPayload();

    await assertOpenApiRequest({ path: requestPath, method: 'post', domain: this.domain }, payload);
    const response = await specSyncTxnStatus.withJson(payload);
    this.response = response;
    this.requestPath = requestPath;
  } catch (err) {
    console.error('Request failed', err);
    throw err;
  }
});

Then(/^The sync txn status response should be received$/, async function () {
  chai.expect(this.response).to.exist;
});

Then(/^The sync txn status response should have status (\d+)$/, async function (status) {
  chai.expect(this.response.statusCode).to.equal(Number(status));
});

Then(/^The sync txn status response should have status (\d+) or (\d+)$/, async function (statusA, statusB) {
  const allowed = [Number(statusA), Number(statusB)];
  chai.expect(
    allowed,
    `Expected status ${statusA} or ${statusB}, got ${this.response.statusCode}`
  ).to.include(Number(this.response.statusCode));
});

Then(/^The sync txn status response should have "([^"]*)": "([^"]*)" header$/, async function (key, value) {
  const { ok, actualValue, reason } = checkHeader(this.response.rawHeaders, key, value);
  const msg = reason === 'missing'
    ? `Expected header "${key}" to be present`
    : `Expected header "${key}" to be "${value}", got "${actualValue}"`;
  chai.expect(ok, msg).to.be.true;
});

Then(/^The sync txn status response should be returned in a timely manner(?: within (\d+)ms)?$/, async function (timeout) {
  const threshold = timeout ? Number(timeout) : getResponseTimeThreshold();
  chai.expect(this.response.responseTime).to.be.lessThan(threshold);
});

Then(/^The sync txn status response should match the expected JSON schema$/, async function () {
  const requestPath = this.requestPath || getRequestPath(this.getEndpoint('syncTxnStatus'), this.baseUrl);
  await assertOpenApiResponse(
    { path: requestPath, method: 'post', statusCode: this.response.statusCode, domain: this.domain },
    this.response.body
  );
});
