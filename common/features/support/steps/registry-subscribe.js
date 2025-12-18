/**
 * Registry Subscribe/Unsubscribe Step Definitions
 *
 * Domain-agnostic step definitions for subscribe and unsubscribe operations.
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
// SUBSCRIBE STEPS
// ============================================

let specSubscribe;

Given(/^System wants to subscribe to (?:the registry|SR|FR|CRVS) events$/, function () {
  specSubscribe = spec();
});

When(/^A POST request to subscribe is sent$/, async function () {
  try {
    const endpoint = this.getEndpoint('subscribe');
    const url = this.baseUrl + endpoint;
    const requestPath = getRequestPath(endpoint, this.baseUrl);

    applyCommonHeaders(specSubscribe.post(url));
    const payload = this.payloads.createSubscribeRequestPayload();

    await assertOpenApiRequest({ path: requestPath, method: 'post', domain: this.domain }, payload);
    const response = await specSubscribe.withJson(payload);
    this.response = response;
    this.requestPath = requestPath;
  } catch (err) {
    console.error('Request failed', err);
    throw err;
  }
});

Then(/^The subscribe response should be received$/, async function () {
  chai.expect(this.response).to.exist;
});

Then(/^The subscribe response should have status (\d+)$/, async function (status) {
  chai.expect(this.response.statusCode).to.equal(Number(status));
});

Then(/^The subscribe response should have status (\d+) or (\d+)$/, async function (statusA, statusB) {
  const allowed = [Number(statusA), Number(statusB)];
  chai.expect(
    allowed,
    `Expected status ${statusA} or ${statusB}, got ${this.response.statusCode}`
  ).to.include(Number(this.response.statusCode));
});

Then(/^The subscribe response should have "([^"]*)": "([^"]*)" header$/, async function (key, value) {
  const { ok, actualValue, reason } = checkHeader(this.response.rawHeaders, key, value);
  const msg = reason === 'missing'
    ? `Expected header "${key}" to be present`
    : `Expected header "${key}" to be "${value}", got "${actualValue}"`;
  chai.expect(ok, msg).to.be.true;
});

Then(/^The subscribe response should be returned in a timely manner(?: within (\d+)ms)?$/, async function (timeout) {
  const threshold = timeout ? Number(timeout) : getResponseTimeThreshold();
  chai.expect(this.response.responseTime).to.be.lessThan(threshold);
});

Then(/^The subscribe response should match the expected JSON schema$/, async function () {
  const requestPath = this.requestPath || getRequestPath(this.getEndpoint('subscribe'), this.baseUrl);
  await assertOpenApiResponse(
    { path: requestPath, method: 'post', statusCode: this.response.statusCode, domain: this.domain },
    this.response.body
  );
});

// ============================================
// UNSUBSCRIBE STEPS
// ============================================

let specUnsubscribe;

Given(/^System wants to unsubscribe from (?:the registry|SR|FR|CRVS) events$/, function () {
  specUnsubscribe = spec();
});

When(/^A POST request to unsubscribe is sent$/, async function () {
  try {
    const endpoint = this.getEndpoint('unsubscribe');
    const url = this.baseUrl + endpoint;
    const requestPath = getRequestPath(endpoint, this.baseUrl);

    applyCommonHeaders(specUnsubscribe.post(url));
    const payload = this.payloads.createUnsubscribeRequestPayload();

    await assertOpenApiRequest({ path: requestPath, method: 'post', domain: this.domain }, payload);
    const response = await specUnsubscribe.withJson(payload);
    this.response = response;
    this.requestPath = requestPath;
  } catch (err) {
    console.error('Request failed', err);
    throw err;
  }
});

Then(/^The unsubscribe response should be received$/, async function () {
  chai.expect(this.response).to.exist;
});

Then(/^The unsubscribe response should have status (\d+)$/, async function (status) {
  chai.expect(this.response.statusCode).to.equal(Number(status));
});

Then(/^The unsubscribe response should have status (\d+) or (\d+)$/, async function (statusA, statusB) {
  const allowed = [Number(statusA), Number(statusB)];
  chai.expect(
    allowed,
    `Expected status ${statusA} or ${statusB}, got ${this.response.statusCode}`
  ).to.include(Number(this.response.statusCode));
});

Then(/^The unsubscribe response should have "([^"]*)": "([^"]*)" header$/, async function (key, value) {
  const { ok, actualValue, reason } = checkHeader(this.response.rawHeaders, key, value);
  const msg = reason === 'missing'
    ? `Expected header "${key}" to be present`
    : `Expected header "${key}" to be "${value}", got "${actualValue}"`;
  chai.expect(ok, msg).to.be.true;
});

Then(/^The unsubscribe response should be returned in a timely manner(?: within (\d+)ms)?$/, async function (timeout) {
  const threshold = timeout ? Number(timeout) : getResponseTimeThreshold();
  chai.expect(this.response.responseTime).to.be.lessThan(threshold);
});

Then(/^The unsubscribe response should match the expected JSON schema$/, async function () {
  const requestPath = this.requestPath || getRequestPath(this.getEndpoint('unsubscribe'), this.baseUrl);
  await assertOpenApiResponse(
    { path: requestPath, method: 'post', statusCode: this.response.statusCode, domain: this.domain },
    this.response.body
  );
});
