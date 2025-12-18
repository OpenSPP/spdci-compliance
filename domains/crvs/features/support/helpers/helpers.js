/**
 * CRVS (Civil Registration and Vital Statistics) Compliance Test Helpers
 *
 * Domain-specific configuration and re-exports from common infrastructure.
 * This file provides CRVS-specific endpoint overrides and re-exports
 * payload factories bound to the 'crvs' domain.
 */

import {
  generateId,
  getTimestamp,
} from '../../../../../common/helpers/envelope.js';

import {
  getDomainConfig,
  getEndpoint,
  getCallbackPath,
} from '../../../../../common/helpers/domain-config.js';

import {
  createSearchRequestPayload as commonCreateSearchRequestPayload,
  createSearchRequestPayloadWithExpressionQuery as commonCreateSearchRequestPayloadWithExpressionQuery,
  createSearchRequestPayloadWithPredicateQuery as commonCreateSearchRequestPayloadWithPredicateQuery,
  createSubscribeRequestPayload as commonCreateSubscribeRequestPayload,
  createUnsubscribeRequestPayload as commonCreateUnsubscribeRequestPayload,
  createTxnStatusRequestPayload as commonCreateTxnStatusRequestPayload,
  createOnSearchPayload as commonCreateOnSearchPayload,
  createOnSubscribePayload as commonCreateOnSubscribePayload,
  createOnUnsubscribePayload as commonCreateOnUnsubscribePayload,
  createOnTxnStatusPayload as commonCreateOnTxnStatusPayload,
  createNotifyPayload as commonCreateNotifyPayload,
} from '../../../../../common/helpers/payloads.js';

export { generateId, getTimestamp };

// ============================================
// DOMAIN CONFIGURATION
// ============================================

const DOMAIN = 'crvs';
export const domainConfig = getDomainConfig(DOMAIN);

// ============================================
// CONFIGURATION
// ============================================

export const localhost = process.env.API_BASE_URL || 'http://127.0.0.1:3333/';

const responseTimeThreshold = Number(process.env.RESPONSE_TIME_THRESHOLD_MS) || 15000;
export const defaultResponseTime = responseTimeThreshold;
export const defaultExpectedResponseTime = responseTimeThreshold;

export const acceptHeader = { key: 'Accept', value: 'application/json' };
export const contentTypeHeader = { key: 'content-type', value: 'application/json; charset=utf-8' };

export const extraHeaders = parseExtraHeaders(
  process.env.EXTRA_HEADERS_JSON,
  process.env.EXTRA_HEADERS
);

const dciAuthToken = process.env.DCI_AUTH_TOKEN;
if (dciAuthToken && !extraHeaders.some(h => String(h?.key || '').toLowerCase() === 'authorization')) {
  const value = String(dciAuthToken).startsWith('Bearer ') ? String(dciAuthToken) : `Bearer ${dciAuthToken}`;
  extraHeaders.push({ key: 'Authorization', value });
}

// ============================================
// HEADER UTILITIES
// ============================================

function parseExtraHeaders(extraHeadersJson, extraHeadersString) {
  if (extraHeadersJson) {
    try {
      const parsed = JSON.parse(extraHeadersJson);
      if (Array.isArray(parsed)) {
        return parsed.filter(h => h && typeof h.key === 'string').map(h => ({ key: h.key, value: String(h.value ?? '') }));
      }
      if (parsed && typeof parsed === 'object') {
        return Object.entries(parsed).map(([key, value]) => ({ key, value: String(value ?? '') }));
      }
    } catch { /* fall through */ }
  }
  if (!extraHeadersString) return [];
  return extraHeadersString.split(';').map(s => s.trim()).filter(Boolean).map(pair => {
    const idx = pair.indexOf(':');
    if (idx <= 0) return null;
    return { key: pair.slice(0, idx).trim(), value: pair.slice(idx + 1).trim() };
  }).filter(Boolean);
}

export function hasHeader(rawHeaders, headerName) {
  if (!Array.isArray(rawHeaders)) return false;
  const lowerName = headerName.toLowerCase();
  for (let i = 0; i < rawHeaders.length; i += 2) {
    if (typeof rawHeaders[i] === 'string' && rawHeaders[i].toLowerCase() === lowerName) return true;
  }
  return false;
}

export function getHeaderValue(rawHeaders, headerName) {
  if (!Array.isArray(rawHeaders)) return null;
  const lowerName = headerName.toLowerCase();
  for (let i = 0; i < rawHeaders.length - 1; i += 2) {
    if (typeof rawHeaders[i] === 'string' && rawHeaders[i].toLowerCase() === lowerName) return rawHeaders[i + 1];
  }
  return null;
}

export function applyCommonHeaders(spec, options = {}) {
  const omit = new Set((options.omitHeaders || []).map(h => String(h).toLowerCase()));
  spec.withHeaders(acceptHeader.key, acceptHeader.value);
  spec.withHeaders(contentTypeHeader.key, contentTypeHeader.value);
  for (const header of extraHeaders) {
    if (omit.has(String(header?.key || '').toLowerCase())) continue;
    spec.withHeaders(header.key, header.value);
  }
  return spec;
}

export function getRequestPath(endpointOrUrl) {
  const raw = String(endpointOrUrl || '').trim();
  if (!raw) return '/';
  const base = String(localhost || '').endsWith('/') ? String(localhost) : `${String(localhost)}/`;
  try { return new URL(raw).pathname; } catch {
    try { return new URL(raw, base).pathname; } catch { return raw.startsWith('/') ? raw : `/${raw}`; }
  }
}

export function checkHeader(rawHeaders, headerName, expectedValue) {
  const actualValue = getHeaderValue(rawHeaders, headerName);
  if (actualValue == null) return { ok: false, actualValue: null, reason: 'missing' };
  if (expectedValue == null || expectedValue === '') return { ok: true, actualValue };
  const expected = String(expectedValue).trim();
  const actual = String(actualValue).trim();
  const headerLower = headerName.toLowerCase();
  if (headerLower === 'content-type') {
    const expectedHasParams = expected.includes(';');
    if (!expectedHasParams) {
      const actualMediaType = actual.split(';')[0].trim().toLowerCase();
      const expectedMediaType = expected.split(';')[0].trim().toLowerCase();
      return { ok: actualMediaType === expectedMediaType, actualValue };
    }
    return { ok: actual.toLowerCase() === expected.toLowerCase(), actualValue };
  }
  return { ok: actual.toLowerCase() === expected.toLowerCase(), actualValue };
}

// ============================================
// CALLBACK PATH HELPER
// ============================================

export function getCallbackPathForAction(action) {
  return getCallbackPath(action, DOMAIN);
}

// ============================================
// CRVS REQUEST PAYLOADS (delegating to common)
// ============================================

export function createSearchRequestPayload() {
  return commonCreateSearchRequestPayload(DOMAIN);
}

export function createSearchRequestPayloadWithExpressionQuery() {
  return commonCreateSearchRequestPayloadWithExpressionQuery(DOMAIN);
}

export function createSearchRequestPayloadWithPredicateQuery() {
  return commonCreateSearchRequestPayloadWithPredicateQuery(DOMAIN);
}

export function createSubscribeRequestPayload() {
  return commonCreateSubscribeRequestPayload(DOMAIN);
}

export function createUnsubscribeRequestPayload() {
  return commonCreateUnsubscribeRequestPayload(DOMAIN);
}

export function createTxnStatusRequestPayload() {
  return commonCreateTxnStatusRequestPayload(DOMAIN);
}

export function createOnSearchPayload() {
  return commonCreateOnSearchPayload(DOMAIN);
}

export function createOnSubscribePayload() {
  return commonCreateOnSubscribePayload(DOMAIN);
}

export function createOnUnsubscribePayload() {
  return commonCreateOnUnsubscribePayload(DOMAIN);
}

export function createOnTxnStatusPayload() {
  return commonCreateOnTxnStatusPayload(DOMAIN);
}

export function createNotifyPayload() {
  return commonCreateNotifyPayload(DOMAIN);
}

// ============================================
// CRVS ENDPOINTS (using common config with env overrides)
// ============================================

const endpointPrefix = process.env.CRVS_ENDPOINT_PREFIX ?? 'registry/';

export const searchEndpoint = process.env.CRVS_SYNC_SEARCH_ENDPOINT || getEndpoint('syncSearch', DOMAIN) || `${endpointPrefix}sync/search`;
export const subscribeEndpoint = process.env.CRVS_SUBSCRIBE_ENDPOINT || getEndpoint('subscribe', DOMAIN) || `${endpointPrefix}subscribe`;
export const unsubscribeEndpoint = process.env.CRVS_UNSUBSCRIBE_ENDPOINT || getEndpoint('unsubscribe', DOMAIN) || `${endpointPrefix}unsubscribe`;
export const asyncsearchEndpoint = process.env.CRVS_SEARCH_ENDPOINT || getEndpoint('asyncSearch', DOMAIN) || `${endpointPrefix}search`;
export const onsearchEndpoint = process.env.CRVS_ON_SEARCH_ENDPOINT || getEndpoint('onSearch', DOMAIN) || `${endpointPrefix}on-search`;
export const onsubscribeEndpoint = process.env.CRVS_ON_SUBSCRIBE_ENDPOINT || getEndpoint('onSubscribe', DOMAIN) || `${endpointPrefix}on-subscribe`;
export const onunsubscribeEndpoint = process.env.CRVS_ON_UNSUBSCRIBE_ENDPOINT || getEndpoint('onUnsubscribe', DOMAIN) || `${endpointPrefix}on-unsubscribe`;
export const txnstatusEndpoint = process.env.CRVS_SYNC_TXN_STATUS_ENDPOINT || getEndpoint('syncTxnStatus', DOMAIN) || `${endpointPrefix}sync/txn/status`;
export const asynctxnstatusEndpoint = process.env.CRVS_TXN_STATUS_ENDPOINT || getEndpoint('asyncTxnStatus', DOMAIN) || `${endpointPrefix}txn/status`;
export const ontxnstatusEndpoint = process.env.CRVS_TXN_ON_STATUS_ENDPOINT || getEndpoint('onTxnStatus', DOMAIN) || `${endpointPrefix}txn/on-status`;
export const notifyEndpoint = process.env.CRVS_NOTIFY_ENDPOINT || getEndpoint('notify', DOMAIN) || `${endpointPrefix}notify`;

// ============================================
// CRVS RESPONSE SCHEMAS
// ============================================

const ackResponseSchema = {
  type: 'object',
  required: ['message'],
  properties: {
    message: {
      type: 'object',
      required: ['ack_status', 'timestamp', 'correlation_id'],
      properties: {
        ack_status: { type: 'string' },
        timestamp: { type: 'string' },
        error: { type: ['object', 'null'] },
        correlation_id: { type: 'string' },
      },
    },
  },
};

export const subscribeResponseSchema = ackResponseSchema;
export const unsubscribeResponseSchema = ackResponseSchema;
export const asyncsearchResponseSchema = ackResponseSchema;
export const onsearchResponseSchema = ackResponseSchema;
export const onsubscribeResponseSchema = ackResponseSchema;
export const onunsubscribeResponseSchema = ackResponseSchema;
export const asynctxnstatusResponseSchema = ackResponseSchema;
export const ontxnstatusResponseSchema = ackResponseSchema;

export const searchResponseSchema = {
  type: "object",
  properties: {
    transaction_id: { type: ["integer", "string"] },
    correlation_id: { type: "string" },
    txnstatus_response: {
      type: "object",
      properties: {
        transaction_id: { type: ["integer", "string"] },
        correlation_id: { type: "string" },
        search_response: { type: "array" }
      }
    }
  }
};

export const txnstatusResponseSchema = {
  type: 'object',
  required: ['transaction_id', 'correlation_id', 'txnstatus_response'],
  properties: {
    transaction_id: { type: ['integer', 'string'] },
    correlation_id: { type: 'string' },
    txnstatus_response: {
      type: 'object',
      properties: {
        transaction_id: { type: ['integer', 'string'] },
        correlation_id: { type: 'string', maxLength: 99 },
      }
    },
  }
};
