/**
 * Registry Callback Receiver Step Definitions
 *
 * Domain-agnostic step definitions for testing callback endpoints
 * (on-search, on-subscribe, on-unsubscribe, on-txn-status, notify).
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
// ON-SEARCH CALLBACK STEPS
// ============================================

let specOnSearch;

Given(/^(?:The registry|SR|FR|CRVS) wants to send an on-search callback$/, function () {
  specOnSearch = spec();
});

When(/^A POST request to on-search callback is sent$/, async function () {
  try {
    const endpoint = this.getEndpoint('onSearch');
    const url = this.baseUrl + endpoint;
    const requestPath = getRequestPath(endpoint, this.baseUrl);

    applyCommonHeaders(specOnSearch.post(url));
    const payload = this.payloads.createOnSearchPayload();

    await assertOpenApiRequest({ path: requestPath, method: 'post', domain: this.domain }, payload);
    const response = await specOnSearch.withJson(payload);
    this.response = response;
    this.requestPath = requestPath;
  } catch (err) {
    console.error('Request failed', err);
    throw err;
  }
});

Then(/^The on-search callback response should be received$/, async function () {
  chai.expect(this.response).to.exist;
});

Then(/^The on-search callback response should have status (\d+)$/, async function (status) {
  chai.expect(this.response.statusCode).to.equal(Number(status));
});

Then(/^The on-search callback response should have status (\d+) or (\d+)$/, async function (statusA, statusB) {
  const allowed = [Number(statusA), Number(statusB)];
  chai.expect(
    allowed,
    `Expected status ${statusA} or ${statusB}, got ${this.response.statusCode}`
  ).to.include(Number(this.response.statusCode));
});

Then(/^The on-search callback response should have "([^"]*)": "([^"]*)" header$/, async function (key, value) {
  const { ok, actualValue, reason } = checkHeader(this.response.rawHeaders, key, value);
  const msg = reason === 'missing'
    ? `Expected header "${key}" to be present`
    : `Expected header "${key}" to be "${value}", got "${actualValue}"`;
  chai.expect(ok, msg).to.be.true;
});

Then(/^The on-search callback response should be returned in a timely manner(?: within (\d+)ms)?$/, async function (timeout) {
  const threshold = timeout ? Number(timeout) : getResponseTimeThreshold();
  chai.expect(this.response.responseTime).to.be.lessThan(threshold);
});

Then(/^The on-search callback response should match the expected JSON schema$/, async function () {
  const requestPath = this.requestPath || getRequestPath(this.getEndpoint('onSearch'), this.baseUrl);
  await assertOpenApiResponse(
    { path: requestPath, method: 'post', statusCode: this.response.statusCode, domain: this.domain },
    this.response.body
  );
});

// ============================================
// ON-SUBSCRIBE CALLBACK STEPS
// ============================================

let specOnSubscribe;

Given(/^(?:The registry|SR|FR|CRVS) wants to send an on-subscribe callback$/, function () {
  specOnSubscribe = spec();
});

When(/^A POST request to on-subscribe callback is sent$/, async function () {
  try {
    const endpoint = this.getEndpoint('onSubscribe');
    const url = this.baseUrl + endpoint;
    const requestPath = getRequestPath(endpoint, this.baseUrl);

    applyCommonHeaders(specOnSubscribe.post(url));
    const payload = this.payloads.createOnSubscribePayload();

    await assertOpenApiRequest({ path: requestPath, method: 'post', domain: this.domain }, payload);
    const response = await specOnSubscribe.withJson(payload);
    this.response = response;
    this.requestPath = requestPath;
  } catch (err) {
    console.error('Request failed', err);
    throw err;
  }
});

Then(/^The on-subscribe callback response should be received$/, async function () {
  chai.expect(this.response).to.exist;
});

Then(/^The on-subscribe callback response should have status (\d+)$/, async function (status) {
  chai.expect(this.response.statusCode).to.equal(Number(status));
});

Then(/^The on-subscribe callback response should have status (\d+) or (\d+)$/, async function (statusA, statusB) {
  const allowed = [Number(statusA), Number(statusB)];
  chai.expect(
    allowed,
    `Expected status ${statusA} or ${statusB}, got ${this.response.statusCode}`
  ).to.include(Number(this.response.statusCode));
});

Then(/^The on-subscribe callback response should have "([^"]*)": "([^"]*)" header$/, async function (key, value) {
  const { ok, actualValue, reason } = checkHeader(this.response.rawHeaders, key, value);
  const msg = reason === 'missing'
    ? `Expected header "${key}" to be present`
    : `Expected header "${key}" to be "${value}", got "${actualValue}"`;
  chai.expect(ok, msg).to.be.true;
});

Then(/^The on-subscribe callback response should be returned in a timely manner(?: within (\d+)ms)?$/, async function (timeout) {
  const threshold = timeout ? Number(timeout) : getResponseTimeThreshold();
  chai.expect(this.response.responseTime).to.be.lessThan(threshold);
});

Then(/^The on-subscribe callback response should match the expected JSON schema$/, async function () {
  const requestPath = this.requestPath || getRequestPath(this.getEndpoint('onSubscribe'), this.baseUrl);
  await assertOpenApiResponse(
    { path: requestPath, method: 'post', statusCode: this.response.statusCode, domain: this.domain },
    this.response.body
  );
});

// ============================================
// ON-UNSUBSCRIBE CALLBACK STEPS
// ============================================

let specOnUnsubscribe;

Given(/^(?:The registry|SR|FR|CRVS) wants to send an on-unsubscribe callback$/, function () {
  specOnUnsubscribe = spec();
});

When(/^A POST request to on-unsubscribe callback is sent$/, async function () {
  try {
    const endpoint = this.getEndpoint('onUnsubscribe');
    const url = this.baseUrl + endpoint;
    const requestPath = getRequestPath(endpoint, this.baseUrl);

    applyCommonHeaders(specOnUnsubscribe.post(url));
    const payload = this.payloads.createOnUnsubscribePayload();

    await assertOpenApiRequest({ path: requestPath, method: 'post', domain: this.domain }, payload);
    const response = await specOnUnsubscribe.withJson(payload);
    this.response = response;
    this.requestPath = requestPath;
  } catch (err) {
    console.error('Request failed', err);
    throw err;
  }
});

Then(/^The on-unsubscribe callback response should be received$/, async function () {
  chai.expect(this.response).to.exist;
});

Then(/^The on-unsubscribe callback response should have status (\d+)$/, async function (status) {
  chai.expect(this.response.statusCode).to.equal(Number(status));
});

Then(/^The on-unsubscribe callback response should have status (\d+) or (\d+)$/, async function (statusA, statusB) {
  const allowed = [Number(statusA), Number(statusB)];
  chai.expect(
    allowed,
    `Expected status ${statusA} or ${statusB}, got ${this.response.statusCode}`
  ).to.include(Number(this.response.statusCode));
});

Then(/^The on-unsubscribe callback response should have "([^"]*)": "([^"]*)" header$/, async function (key, value) {
  const { ok, actualValue, reason } = checkHeader(this.response.rawHeaders, key, value);
  const msg = reason === 'missing'
    ? `Expected header "${key}" to be present`
    : `Expected header "${key}" to be "${value}", got "${actualValue}"`;
  chai.expect(ok, msg).to.be.true;
});

Then(/^The on-unsubscribe callback response should be returned in a timely manner(?: within (\d+)ms)?$/, async function (timeout) {
  const threshold = timeout ? Number(timeout) : getResponseTimeThreshold();
  chai.expect(this.response.responseTime).to.be.lessThan(threshold);
});

Then(/^The on-unsubscribe callback response should match the expected JSON schema$/, async function () {
  const requestPath = this.requestPath || getRequestPath(this.getEndpoint('onUnsubscribe'), this.baseUrl);
  await assertOpenApiResponse(
    { path: requestPath, method: 'post', statusCode: this.response.statusCode, domain: this.domain },
    this.response.body
  );
});

// ============================================
// TXN ON-STATUS CALLBACK STEPS
// ============================================

let specOnTxnStatus;

Given(/^(?:The registry|SR|FR|CRVS) wants to send a txn on-status callback$/, function () {
  specOnTxnStatus = spec();
});

When(/^A POST request to txn on-status callback is sent$/, async function () {
  try {
    const endpoint = this.getEndpoint('onTxnStatus');
    const url = this.baseUrl + endpoint;
    const requestPath = getRequestPath(endpoint, this.baseUrl);

    applyCommonHeaders(specOnTxnStatus.post(url));
    const payload = this.payloads.createOnTxnStatusPayload();

    await assertOpenApiRequest({ path: requestPath, method: 'post', domain: this.domain }, payload);
    const response = await specOnTxnStatus.withJson(payload);
    this.response = response;
    this.requestPath = requestPath;
  } catch (err) {
    console.error('Request failed', err);
    throw err;
  }
});

Then(/^The txn on-status callback response should be received$/, async function () {
  chai.expect(this.response).to.exist;
});

Then(/^The txn on-status callback response should have status (\d+)$/, async function (status) {
  chai.expect(this.response.statusCode).to.equal(Number(status));
});

Then(/^The txn on-status callback response should have status (\d+) or (\d+)$/, async function (statusA, statusB) {
  const allowed = [Number(statusA), Number(statusB)];
  chai.expect(
    allowed,
    `Expected status ${statusA} or ${statusB}, got ${this.response.statusCode}`
  ).to.include(Number(this.response.statusCode));
});

Then(/^The txn on-status callback response should have "([^"]*)": "([^"]*)" header$/, async function (key, value) {
  const { ok, actualValue, reason } = checkHeader(this.response.rawHeaders, key, value);
  const msg = reason === 'missing'
    ? `Expected header "${key}" to be present`
    : `Expected header "${key}" to be "${value}", got "${actualValue}"`;
  chai.expect(ok, msg).to.be.true;
});

Then(/^The txn on-status callback response should be returned in a timely manner(?: within (\d+)ms)?$/, async function (timeout) {
  const threshold = timeout ? Number(timeout) : getResponseTimeThreshold();
  chai.expect(this.response.responseTime).to.be.lessThan(threshold);
});

Then(/^The txn on-status callback response should match the expected JSON schema$/, async function () {
  const requestPath = this.requestPath || getRequestPath(this.getEndpoint('onTxnStatus'), this.baseUrl);
  await assertOpenApiResponse(
    { path: requestPath, method: 'post', statusCode: this.response.statusCode, domain: this.domain },
    this.response.body
  );
});

// ============================================
// NOTIFY CALLBACK STEPS
// ============================================

let specNotify;

Given(/^(?:The registry|SR|FR|CRVS) wants to send a notify callback$/, function () {
  specNotify = spec();
});

When(/^A POST request to notify callback is sent$/, async function () {
  try {
    const endpoint = this.getEndpoint('notify');
    const url = this.baseUrl + endpoint;
    const requestPath = getRequestPath(endpoint, this.baseUrl);

    applyCommonHeaders(specNotify.post(url));
    const payload = this.payloads.createNotifyPayload();

    await assertOpenApiRequest({ path: requestPath, method: 'post', domain: this.domain }, payload);
    const response = await specNotify.withJson(payload);
    this.response = response;
    this.requestPath = requestPath;
  } catch (err) {
    console.error('Request failed', err);
    throw err;
  }
});

Then(/^The notify callback response should be received$/, async function () {
  chai.expect(this.response).to.exist;
});

Then(/^The notify callback response should have status (\d+)$/, async function (status) {
  chai.expect(this.response.statusCode).to.equal(Number(status));
});

Then(/^The notify callback response should have status (\d+) or (\d+)$/, async function (statusA, statusB) {
  const allowed = [Number(statusA), Number(statusB)];
  chai.expect(
    allowed,
    `Expected status ${statusA} or ${statusB}, got ${this.response.statusCode}`
  ).to.include(Number(this.response.statusCode));
});

Then(/^The notify callback response should have "([^"]*)": "([^"]*)" header$/, async function (key, value) {
  const { ok, actualValue, reason } = checkHeader(this.response.rawHeaders, key, value);
  const msg = reason === 'missing'
    ? `Expected header "${key}" to be present`
    : `Expected header "${key}" to be "${value}", got "${actualValue}"`;
  chai.expect(ok, msg).to.be.true;
});

Then(/^The notify callback response should be returned in a timely manner(?: within (\d+)ms)?$/, async function (timeout) {
  const threshold = timeout ? Number(timeout) : getResponseTimeThreshold();
  chai.expect(this.response.responseTime).to.be.lessThan(threshold);
});

Then(/^The notify callback response should match the expected JSON schema$/, async function () {
  const requestPath = this.requestPath || getRequestPath(this.getEndpoint('notify'), this.baseUrl);
  await assertOpenApiResponse(
    { path: requestPath, method: 'post', statusCode: this.response.statusCode, domain: this.domain },
    this.response.body
  );
});
