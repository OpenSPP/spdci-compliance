import chai from 'chai';
import pkg from 'pactum';
const { spec } = pkg;

import { Given, When, Then } from '@cucumber/cucumber';

import {
  assertOpenApiRequest,
  assertOpenApiResponse,
} from '../../../../common/helpers/index.js';

import {
  applyCommonHeaders,
  checkHeader,
  getRequestPath,
  getResponseTimeThreshold,
} from '../../../../common/features/support/steps/helpers.js';

const operations = {
  'disability status': {
    endpointName: 'syncDisabled',
    payloadFactoryName: 'createDisabledRequestPayload',
  },
  'disability details': {
    endpointName: 'getDisabilityDetails',
    payloadFactoryName: 'createGetDisabilityDetailsRequestPayload',
  },
  'disability support': {
    endpointName: 'getDisabilitySupport',
    payloadFactoryName: 'createGetDisabilitySupportRequestPayload',
  },
};

function getOperation(name) {
  const key = String(name || '').trim().toLowerCase();
  const operation = operations[key];
  if (!operation) {
    throw new Error(`Unknown DR operation "${name}". Valid operations: ${Object.keys(operations).join(', ')}`);
  }
  return { key, ...operation };
}

async function sendDrRequest(world, operationName) {
  const operation = getOperation(operationName);
  const endpoint = world.getEndpoint(operation.endpointName);
  const url = world.baseUrl + endpoint;
  const requestPath = getRequestPath(endpoint, world.baseUrl);
  const payload = world.payloads[operation.payloadFactoryName]();

  const requestSpec = spec();
  applyCommonHeaders(requestSpec.post(url));

  await assertOpenApiRequest({ path: requestPath, method: 'post', domain: world.domain }, payload);
  const response = await requestSpec.withJson(payload);

  world.currentOperation = operation;
  world.requestPath = requestPath;
  world.payload = payload;
  world.response = response;
}

Given(/^System wants to check disability status in DR$/, function () {
  this.currentOperation = getOperation('disability status');
});

Given(/^System wants to get disability details from DR$/, function () {
  this.currentOperation = getOperation('disability details');
});

Given(/^System wants to get disability support from DR$/, function () {
  this.currentOperation = getOperation('disability support');
});

When(/^A POST request to DR (disability status|disability details|disability support) is sent$/, async function (operationName) {
  await sendDrRequest(this, operationName);
});

Then(/^The DR (?:disability status|disability details|disability support) response should be received$/, async function () {
  chai.expect(this.response).to.exist;
});

Then(/^The DR (?:disability status|disability details|disability support) response should have status (\d+)$/, async function (status) {
  chai.expect(this.response.statusCode).to.equal(Number(status));
});

Then(/^The DR (?:disability status|disability details|disability support) response should have status (\d+) or (\d+)$/, async function (statusA, statusB) {
  const allowed = [Number(statusA), Number(statusB)];
  chai.expect(
    allowed,
    `Expected status ${statusA} or ${statusB}, got ${this.response.statusCode}`
  ).to.include(Number(this.response.statusCode));
});

Then(/^The DR (?:disability status|disability details|disability support) response should have "([^"]*)": "([^"]*)" header$/, async function (key, value) {
  const { ok, actualValue, reason } = checkHeader(this.response.rawHeaders, key, value);
  const msg = reason === 'missing'
    ? `Expected header "${key}" to be present`
    : `Expected header "${key}" to be "${value}", got "${actualValue}"`;
  chai.expect(ok, msg).to.be.true;
});

Then(/^The DR (?:disability status|disability details|disability support) response should be returned in a timely manner$/, async function () {
  chai.expect(this.response.responseTime).to.be.lessThan(getResponseTimeThreshold());
});

Then(/^The DR (?:disability status|disability details|disability support) response should match the expected JSON schema$/, async function () {
  await assertOpenApiResponse(
    {
      path: this.requestPath,
      method: 'post',
      statusCode: this.response.statusCode,
      domain: this.domain,
    },
    this.response.body
  );
});

Then(/^The DR disability status response should contain disabled_status$/, async function () {
  const responses = this.response.body?.message?.disabled_response;
  chai.expect(responses, 'Expected message.disabled_response').to.be.an('array').and.not.empty;
  chai.expect(responses[0]).to.have.property('disabled_status');
});

Then(/^The DR disability details response should contain disability details records$/, async function () {
  const records = this.response.body?.message?.search_response?.[0]?.data?.reg_records;
  chai.expect(records, 'Expected message.search_response[0].data.reg_records').to.be.an('array').and.not.empty;
  chai.expect(records[0]).to.have.property('disability_details');
});

Then(/^The DR disability support response should contain disability support records$/, async function () {
  const records = this.response.body?.message?.search_response?.[0]?.data?.reg_records;
  chai.expect(records, 'Expected message.search_response[0].data.reg_records').to.be.an('array').and.not.empty;
});
