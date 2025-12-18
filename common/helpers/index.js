/**
 * Common SPDCI Compliance Test Helpers
 *
 * Re-exports all shared utilities for easy importing.
 */

// Core utilities
export * from './envelope.js';
export * from './headers.js';

// Domain configuration (comprehensive)
export {
  getDomainConfig,
  getEndpoint,
  getCallbackPath,
  getDefaultSenderUri,
  getReceiverId,
  getTestData,
  getAvailableDomains,
  isValidDomain,
  domainConfigs,
} from './domain-config.js';

// Parameterized payload factories
export {
  createHeader,
  createCallbackHeader,
  createEnvelope,
  createCallbackEnvelope,
  createSearchRequestPayload,
  createSearchRequestPayloadWithExpressionQuery,
  createSearchRequestPayloadWithPredicateQuery,
  createSubscribeRequestPayload,
  createUnsubscribeRequestPayload,
  createTxnStatusRequestPayload,
  createOnSearchPayload,
  createOnSubscribePayload,
  createOnUnsubscribePayload,
  createOnTxnStatusPayload,
  createNotifyPayload,
  // Response schemas
  ackResponseSchema,
  searchResponseSchema,
  txnstatusResponseSchema,
  onsearchRequestSchema,
  regRecordsSchema,
  subscribeResponseSchema,
  unsubscribeResponseSchema,
  asyncsearchResponseSchema,
  onsearchResponseSchema,
  onsubscribeResponseSchema,
  onunsubscribeResponseSchema,
  asynctxnstatusResponseSchema,
  ontxnstatusResponseSchema,
} from './payloads.js';

// OpenAPI validation
export {
  assertOpenApiRequest,
  assertOpenApiResponse,
  getOpenApiSpec,
} from './openapi-validator.js';

// Callback server
export {
  startCallbackServer,
  stopCallbackServer,
  getCallbackUrl,
  getCallbacks,
  getCallbacksByAction,
  getLastCallback,
  clearCallbacks,
  waitForCallback,
  waitForCallbackAction,
} from './callback-server.js';

// Utility functions
export function getBaseUrl() {
  return process.env.API_BASE_URL || 'http://localhost:8080';
}

export function getFullUrl(endpointName, domain) {
  const { getEndpoint } = require('./domain-config.js');
  return getBaseUrl() + '/' + getEndpoint(endpointName, domain);
}
