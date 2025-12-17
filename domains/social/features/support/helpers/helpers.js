/**
 * Social Registry (SR) Compliance Test Helpers
 *
 * Domain-specific configuration, payloads, endpoints, and schemas for SR testing.
 * Common utilities are imported from the shared helpers module.
 */

// Import common utilities
import {
  generateId,
  getTimestamp,
} from '../../../../../common/helpers/envelope.js';

// Re-export for backward compatibility
export { generateId, getTimestamp };

// ============================================
// CONFIGURATION
// ============================================

export const localhost = process.env.API_BASE_URL || 'http://127.0.0.1:3333/';
export const defaultResponseTime = 15000;
export const defaultExpectedResponseTime = 15000;

export const acceptHeader = {
  key: 'Accept',
  value: 'application/json',
};

export const contentTypeHeader = {
  key: 'content-type',
  value: 'application/json; charset=utf-8',
};

// Optional extra request headers (for gateways/tenancy/auth, etc.)
export const extraHeaders = parseExtraHeaders(
  process.env.EXTRA_HEADERS_JSON,
  process.env.EXTRA_HEADERS
);

// Optional convenience: provide a bearer token
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
        return parsed
          .filter(h => h && typeof h.key === 'string')
          .map(h => ({ key: h.key, value: String(h.value ?? '') }));
      }
      if (parsed && typeof parsed === 'object') {
        return Object.entries(parsed).map(([key, value]) => ({
          key,
          value: String(value ?? ''),
        }));
      }
    } catch {
      // fall through to string parsing
    }
  }

  if (!extraHeadersString) return [];
  return extraHeadersString
    .split(';')
    .map(s => s.trim())
    .filter(Boolean)
    .map(pair => {
      const idx = pair.indexOf(':');
      if (idx <= 0) return null;
      return { key: pair.slice(0, idx).trim(), value: pair.slice(idx + 1).trim() };
    })
    .filter(Boolean);
}

/**
 * Check if a header exists (case-insensitive)
 */
export function hasHeader(rawHeaders, headerName) {
  if (!Array.isArray(rawHeaders)) return false;
  const lowerName = headerName.toLowerCase();
  for (let i = 0; i < rawHeaders.length; i += 2) {
    if (typeof rawHeaders[i] === 'string' && rawHeaders[i].toLowerCase() === lowerName) {
      return true;
    }
  }
  return false;
}

/**
 * Get header value (case-insensitive)
 */
export function getHeaderValue(rawHeaders, headerName) {
  if (!Array.isArray(rawHeaders)) return null;
  const lowerName = headerName.toLowerCase();
  for (let i = 0; i < rawHeaders.length - 1; i += 2) {
    if (typeof rawHeaders[i] === 'string' && rawHeaders[i].toLowerCase() === lowerName) {
      return rawHeaders[i + 1];
    }
  }
  return null;
}

/**
 * Apply common headers to a pactum spec object
 */
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

/**
 * Compute the request path for OpenAPI validation
 */
export function getRequestPath(endpointOrUrl) {
  const raw = String(endpointOrUrl || '').trim();
  if (!raw) return '/';

  const base = String(localhost || '').endsWith('/') ? String(localhost) : `${String(localhost)}/`;

  try {
    return new URL(raw).pathname;
  } catch {
    try {
      return new URL(raw, base).pathname;
    } catch {
      return raw.startsWith('/') ? raw : `/${raw}`;
    }
  }
}

/**
 * Validate a response header value
 */
export function checkHeader(rawHeaders, headerName, expectedValue) {
  const actualValue = getHeaderValue(rawHeaders, headerName);
  if (actualValue == null) {
    return { ok: false, actualValue: null, reason: 'missing' };
  }

  if (expectedValue == null || expectedValue === '') {
    return { ok: true, actualValue };
  }

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
// SR-SPECIFIC ENVELOPE BUILDERS
// ============================================

function callbackPathForAction(action) {
  switch (String(action || '')) {
    case 'search': return '/registry/on-search';
    case 'subscribe': return '/registry/on-subscribe';
    case 'unsubscribe': return '/registry/on-unsubscribe';
    case 'txn-status': return '/registry/txn/on-status';
    default: return undefined;
  }
}

function getDefaultSenderUriForAction(action) {
  const base = process.env.CALLBACK_SERVER_BASE_URL;
  if (!base) return undefined;

  const callbackPath = callbackPathForAction(action);
  if (!callbackPath) return undefined;

  try {
    return new URL(callbackPath, base).toString();
  } catch {
    const normalizedBase = String(base).endsWith('/') ? String(base) : `${base}/`;
    const normalizedPath = String(callbackPath).startsWith('/') ? String(callbackPath).slice(1) : String(callbackPath);
    return `${normalizedBase}${normalizedPath}`;
  }
}

export function getCallbackPathForAction(action) {
  return callbackPathForAction(action);
}

/**
 * Create a DCI message header for SR
 */
export function createHeader(action, totalCount = 1) {
  const senderUri = process.env.DCI_SENDER_URI || getDefaultSenderUriForAction(action);
  const header = {
    version: "1.0.0",
    message_id: generateId(),
    message_ts: getTimestamp(),
    action: action,
    sender_id: process.env.DCI_SENDER_ID || "test-client",
    sender_uri: senderUri,
    receiver_id: process.env.DCI_RECEIVER_ID || "sr-server",
    total_count: totalCount,
  };
  if (!header.sender_uri) delete header.sender_uri;
  return header;
}

/**
 * Create a DCI callback message header
 */
export function createCallbackHeader(action, status = "succ", totalCount = 1, completedCount = 1) {
  return {
    version: "1.0.0",
    message_id: generateId(),
    message_ts: getTimestamp(),
    action: action,
    status: status,
    total_count: totalCount,
    completed_count: completedCount,
    sender_id: process.env.DCI_SENDER_ID || "test-client",
    receiver_id: process.env.DCI_RECEIVER_ID || "sr-server",
  };
}

/**
 * Create a DCI envelope with signature
 */
export function createEnvelope(action, message, totalCount = 1) {
  return {
    signature: process.env.DCI_SIGNATURE || "unsigned-stub",
    header: createHeader(action, totalCount),
    message: message,
  };
}

/**
 * Create a DCI callback envelope with signature
 */
export function createCallbackEnvelope(action, message, status = "succ", totalCount = 1, completedCount = 1) {
  return {
    signature: process.env.DCI_SIGNATURE || "unsigned-stub",
    header: createCallbackHeader(action, status, totalCount, completedCount),
    message: message,
  };
}

// ============================================
// SR REQUEST PAYLOADS
// ============================================

export function createSearchRequestPayload() {
  return createEnvelope("search", {
    transaction_id: generateId(),
    search_request: [{
      reference_id: `ref-${generateId()}`,
      timestamp: getTimestamp(),
      search_criteria: {
        query_type: "idtype-value",
        query: { type: "UIN", value: "TEST-001" },
      },
    }]
  });
}

export function createSearchRequestPayloadWithExpressionQuery() {
  return createEnvelope("search", {
    transaction_id: generateId(),
    search_request: [{
      reference_id: `ref-${generateId()}`,
      timestamp: getTimestamp(),
      search_criteria: {
        query_type: "expression",
        query: {
          type: "ns:org:QueryType:expression",
          value: {
            expression: {
              collection: "Group",
              query: {
                "$and": [
                  { "poverty_score": { "$lt": 5 } },
                  { "location": { "$eq": "central_region" } },
                  { "group_size": { "$lt": 5 } }
                ]
              }
            }
          }
        },
      },
    }]
  });
}

export function createSearchRequestPayloadWithPredicateQuery() {
  return createEnvelope("search", {
    transaction_id: generateId(),
    search_request: [{
      reference_id: `ref-${generateId()}`,
      timestamp: getTimestamp(),
      search_criteria: {
        query_type: "predicate",
        query: [{
          seq_num: 1,
          expression1: { attribute_name: "age", operator: "lt", attribute_value: "25" },
          condition: "and",
          expression2: { attribute_name: "poverty_score", operator: "lt", attribute_value: "2.5" }
        }],
      },
    }]
  });
}

export function createSubscribeRequestPayload() {
  return createEnvelope("subscribe", {
    transaction_id: generateId(),
    subscribe_request: [{
      reference_id: `ref-${generateId()}`,
      timestamp: getTimestamp(),
      subscribe_criteria: {
        reg_event_type: "REGISTER",
        filter: { type: "UIN", value: "TEST-001" },
        notify_record_type: "Member",
      },
    }]
  });
}

export function createUnsubscribeRequestPayload() {
  return createEnvelope("unsubscribe", {
    transaction_id: generateId(),
    timestamp: getTimestamp(),
    subscription_codes: ["sub-test-001"],
  });
}

export function createTxnStatusRequestPayload() {
  const transactionId = generateId();
  return createEnvelope("txn-status", {
    transaction_id: transactionId,
    txnstatus_request: {
      reference_id: `ref-${generateId()}`,
      txn_type: "search",
      attribute_type: "transaction_id",
      attribute_value: transactionId,
    },
  });
}

export function createOnSearchPayload() {
  return createCallbackEnvelope("on-search", {
    transaction_id: generateId(),
    correlation_id: generateId(),
    search_response: [{
      reference_id: `ref-${generateId()}`,
      timestamp: getTimestamp(),
      status: "succ",
      data: { version: "1.0.0", reg_records: [] }
    }]
  });
}

export function createOnSubscribePayload() {
  return createEnvelope("on-subscribe", {
    transaction_id: generateId(),
    correlation_id: generateId(),
    subscribe_response: [{
      reference_id: `ref-${generateId()}`,
      timestamp: getTimestamp(),
      status: "succ",
      subscriptions: [{ code: `sub-${generateId()}`, status: "subscribe", timestamp: getTimestamp() }]
    }]
  });
}

export function createOnUnsubscribePayload() {
  return createEnvelope("on-unsubscribe", {
    transaction_id: generateId(),
    correlation_id: generateId(),
    timestamp: getTimestamp(),
    status: "succ",
    subscription_status: [{ code: "sub-test-001", status: "unsubscribe" }],
  });
}

export function createOnTxnStatusPayload() {
  const transactionId = generateId();
  return createCallbackEnvelope("txn-on-status", {
    transaction_id: transactionId,
    correlation_id: generateId(),
    txnstatus_response: {
      txn_type: "search",
      txn_status: {
        transaction_id: transactionId,
        correlation_id: generateId(),
        search_response: [],
      }
    }
  });
}

export function createNotifyPayload() {
  return createCallbackEnvelope("notify", {
    transaction_id: generateId(),
    notify_event: [{
      reference_id: `ref-${generateId()}`,
      timestamp: getTimestamp(),
      data: { version: "1.0.0", reg_record_type: "SRPerson", reg_records: {} },
      locale: "eng",
    }]
  });
}

// ============================================
// SR ENDPOINTS
// ============================================

const endpointPrefix = process.env.SR_ENDPOINT_PREFIX ?? 'registry/';

export const searchEndpoint = process.env.SR_SYNC_SEARCH_ENDPOINT || `${endpointPrefix}sync/search`;
export const subscribeEndpoint = process.env.SR_SUBSCRIBE_ENDPOINT || `${endpointPrefix}subscribe`;
export const unsubscribeEndpoint = process.env.SR_UNSUBSCRIBE_ENDPOINT || `${endpointPrefix}unsubscribe`;
export const asyncsearchEndpoint = process.env.SR_SEARCH_ENDPOINT || `${endpointPrefix}search`;
export const onsearchEndpoint = process.env.SR_ON_SEARCH_ENDPOINT || `${endpointPrefix}on-search`;
export const onsubscribeEndpoint = process.env.SR_ON_SUBSCRIBE_ENDPOINT || `${endpointPrefix}on-subscribe`;
export const onunsubscribeEndpoint = process.env.SR_ON_UNSUBSCRIBE_ENDPOINT || `${endpointPrefix}on-unsubscribe`;
export const txnstatusEndpoint = process.env.SR_SYNC_TXN_STATUS_ENDPOINT || `${endpointPrefix}sync/txn/status`;
export const asynctxnstatusEndpoint = process.env.SR_TXN_STATUS_ENDPOINT || `${endpointPrefix}txn/status`;
export const ontxnstatusEndpoint = process.env.SR_TXN_ON_STATUS_ENDPOINT || `${endpointPrefix}txn/on-status`;
export const notifyEndpoint = process.env.SR_NOTIFY_ENDPOINT || `${endpointPrefix}notify`;

// ============================================
// SR RESPONSE SCHEMAS
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

export const onsearchRequestSchema = {
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  type: "object",
  properties: {
    message: {
      type: "object",
      properties: {
        transaction_id: { type: ["integer", "string"] },
        correlation_id: { type: "string" },
        search_response: {
          type: "array",
          items: {
            type: "object",
            properties: {
              reference_id: { type: "string" },
              timestamp: { type: "string" },
              status: { type: "string", enum: ["rcvd", "processed", "failed", "succ", "rjct", "part"] },
              status_reason_code: { type: "string" },
              status_reason_message: { type: "string" },
              data: { type: "object" },
              pagination: { type: "object" },
              locale: { type: "string", enum: ["en", "fr", "ar"] }
            }
          }
        }
      },
      required: ["transaction_id", "correlation_id", "search_response"]
    }
  },
  required: ["message"]
};

export const regRecordsSchema = {
  type: "object",
  properties: {
    identifier: {
      type: "object",
      properties: {
        identifier_type: { type: "string" },
        identifier_value: { type: "string" }
      },
    },
    death_date: { type: "string", format: "date-time" },
    death_place: { type: "string" },
    address: { type: "object" },
    marital_status: { type: "string" },
    marriage_date: { type: "string", format: "date-time" },
    divorce_date: { type: "string", format: "date-time" },
    parent1_identifier: { type: "object" },
    parent2_identifier: { type: "object" }
  },
};
