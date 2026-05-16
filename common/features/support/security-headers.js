import chai from 'chai';
import pkg from 'pactum';
const { spec } = pkg;

import { Given, When, Then } from '@cucumber/cucumber';

import {
  createSearchRequestPayload,
  getEndpoint,
  assertOpenApiRequest,
} from '../../helpers/index.js';

const domain = process.env.DOMAIN || 'social';
const baseUrl = process.env.API_BASE_URL || 'http://127.0.0.1:3333/';

function makeUrl(endpoint) {
  return new URL(endpoint, baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`).toString();
}

function authValue(value) {
  return String(value).startsWith('Bearer ') ? String(value) : `Bearer ${value}`;
}

function prepareSearchRequest(headers = {}) {
  const endpoint = getEndpoint('asyncSearch', domain);
  const payload = createSearchRequestPayload(domain);
  return { endpoint, payload, headers };
}

Given(/^The API is available$/, function () {
  this.securityRequest = null;
});

Given(/^A search request without Authorization header$/, async function () {
  this.securityRequest = prepareSearchRequest({
    Accept: 'application/json',
    'Content-Type': 'application/json',
  });
  await assertOpenApiRequest({ path: this.securityRequest.endpoint, method: 'post', domain }, this.securityRequest.payload);
});

Given(/^A search request with invalid Authorization token$/, async function () {
  this.securityRequest = prepareSearchRequest({
    Accept: 'application/json',
    'Content-Type': 'application/json',
    Authorization: 'Bearer invalid-token',
  });
  await assertOpenApiRequest({ path: this.securityRequest.endpoint, method: 'post', domain }, this.securityRequest.payload);
});

Given(/^A valid search request with proper Authorization$/, async function () {
  const token = process.env.DCI_AUTH_TOKEN;
  chai.expect(token, 'DCI_AUTH_TOKEN is required for valid Authorization security-header tests').to.be.a('string').and.not.empty;
  this.securityRequest = prepareSearchRequest({
    Accept: 'application/json',
    'Content-Type': 'application/json',
    Authorization: authValue(token),
  });
  await assertOpenApiRequest({ path: this.securityRequest.endpoint, method: 'post', domain }, this.securityRequest.payload);
});

Given(/^A search request without Content-Type header$/, async function () {
  const token = process.env.DCI_AUTH_TOKEN;
  chai.expect(token, 'DCI_AUTH_TOKEN is required for Content-Type security-header tests').to.be.a('string').and.not.empty;
  this.securityRequest = prepareSearchRequest({
    Accept: 'application/json',
    Authorization: authValue(token),
  });
  await assertOpenApiRequest({ path: this.securityRequest.endpoint, method: 'post', domain }, this.securityRequest.payload);
});

Given(/^A valid search request with Content-Type application\/json$/, async function () {
  const token = process.env.DCI_AUTH_TOKEN;
  chai.expect(token, 'DCI_AUTH_TOKEN is required for Content-Type security-header tests').to.be.a('string').and.not.empty;
  this.securityRequest = prepareSearchRequest({
    Accept: 'application/json',
    'Content-Type': 'application/json',
    Authorization: authValue(token),
  });
  await assertOpenApiRequest({ path: this.securityRequest.endpoint, method: 'post', domain }, this.securityRequest.payload);
});

When(/^The request is sent$/, async function () {
  const { endpoint, payload, headers } = this.securityRequest;
  const request = spec().post(makeUrl(endpoint));
  for (const [key, value] of Object.entries(headers)) {
    request.withHeaders(key, value);
  }

  if (headers['Content-Type']) {
    this.response = await request.withJson(payload);
  } else {
    this.response = await request.withBody(JSON.stringify(payload));
  }
});

Then(/^The response should have status (\d+) or (\d+)$/, function (statusA, statusB) {
  chai.expect([Number(statusA), Number(statusB)]).to.include(Number(this.response?.statusCode));
});

Then(/^The response should not have status (\d+) or (\d+)$/, function (statusA, statusB) {
  chai.expect([Number(statusA), Number(statusB)]).not.to.include(Number(this.response?.statusCode));
});

Then(/^The response should have status (\d+)$/, function (status) {
  chai.expect(Number(this.response?.statusCode)).to.equal(Number(status));
});

Then(/^The response should not have status (\d+)$/, function (status) {
  chai.expect(Number(this.response?.statusCode)).not.to.equal(Number(status));
});
