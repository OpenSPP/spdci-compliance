/**
 * SPDCI Parameterized Payload Factories
 *
 * Creates domain-agnostic payloads using domain configuration.
 * All payload factories accept a domain parameter and use domain-specific
 * test data from the domain configuration registry.
 *
 * SIGNATURE HANDLING
 * ==================
 * All envelopes include a `signature` field. The value is determined by:
 *
 * 1. DCI_SIGNATURE environment variable (if set)
 * 2. Default stub value 'unsigned-stub' (for structure testing)
 *
 * For full compliance testing with signature validation:
 * - Set DCI_SIGNATURE to a valid cryptographic signature
 * - Use withInvalidSignature() from signature.js for negative testing
 * - See common/helpers/signature.js for detailed documentation
 *
 * Example:
 * ```bash
 * # Structure testing (default)
 * npm run test:social
 *
 * # With real signature
 * DCI_SIGNATURE="eyJhbGciOiJSUzI1NiJ9..." npm run test:social
 * ```
 */

import { generateId, getTimestamp } from './envelope.js';
import { getDomainConfig, getDefaultSenderUri, getReceiverId } from './domain-config.js';
import { getSignature } from './signature.js';

// ============================================
// HEADER BUILDERS
// ============================================

/**
 * Create a DCI message header
 * @param {string} action - The action (search, subscribe, etc.)
 * @param {object} options - Options including domain and totalCount
 * @returns {object} Message header
 */
export function createHeader(action, options = {}) {
  const {
    domain = process.env.DOMAIN || 'social',
    totalCount = 1,
  } = options;

  const senderUri = process.env.DCI_SENDER_URI || getDefaultSenderUri(action, domain);
  const header = {
    version: '1.0.0',
    message_id: generateId(),
    message_ts: getTimestamp(),
    action: action,
    sender_id: process.env.DCI_SENDER_ID || 'test-client',
    sender_uri: senderUri,
    receiver_id: getReceiverId(domain),
    total_count: totalCount,
  };

  // Remove undefined sender_uri
  if (!header.sender_uri) delete header.sender_uri;

  return header;
}

/**
 * Create a DCI callback message header
 * @param {string} action - The action
 * @param {object} options - Options including status, totalCount, completedCount, domain
 * @returns {object} Callback header
 */
export function createCallbackHeader(action, options = {}) {
  const {
    domain = process.env.DOMAIN || 'social',
    status = 'succ',
    totalCount = 1,
    completedCount = 1,
  } = options;

  return {
    version: '1.0.0',
    message_id: generateId(),
    message_ts: getTimestamp(),
    action: action,
    status: status,
    total_count: totalCount,
    completed_count: completedCount,
    sender_id: process.env.DCI_SENDER_ID || 'test-client',
    receiver_id: getReceiverId(domain),
  };
}

// ============================================
// ENVELOPE BUILDERS
// ============================================

/**
 * Create a DCI envelope with signature
 *
 * The signature value comes from getSignature() which respects:
 * - DCI_SIGNATURE environment variable (for real signatures)
 * - Default stub 'unsigned-stub' (for structure testing)
 *
 * @param {string} action - The action
 * @param {object} message - The message payload
 * @param {object} options - Options including domain, totalCount
 * @returns {object} Complete envelope
 */
export function createEnvelope(action, message, options = {}) {
  return {
    signature: getSignature(),
    header: createHeader(action, options),
    message: message,
  };
}

/**
 * Create a DCI callback envelope with signature
 *
 * The signature value comes from getSignature() which respects:
 * - DCI_SIGNATURE environment variable (for real signatures)
 * - Default stub 'unsigned-stub' (for structure testing)
 *
 * @param {string} action - The action
 * @param {object} message - The message payload
 * @param {object} options - Options including status, totalCount, completedCount, domain
 * @returns {object} Complete callback envelope
 */
export function createCallbackEnvelope(action, message, options = {}) {
  return {
    signature: getSignature(),
    header: createCallbackHeader(action, options),
    message: message,
  };
}

// ============================================
// REQUEST PAYLOAD FACTORIES
// ============================================

/**
 * Create a search request payload with idtype-value query
 * @param {string} domain - Domain identifier
 * @returns {object} Search request envelope
 */
export function createSearchRequestPayload(domain = process.env.DOMAIN || 'social') {
  const config = getDomainConfig(domain);
  const testData = config.testData;

  return createEnvelope('search', {
    transaction_id: generateId(),
    search_request: [{
      reference_id: `ref-${generateId()}`,
      timestamp: getTimestamp(),
      search_criteria: {
        query_type: 'idtype-value',
        query: testData.idTypeValue,
      },
    }],
  }, { domain });
}

/**
 * Create a search request payload with expression query
 * @param {string} domain - Domain identifier
 * @returns {object} Search request envelope
 */
export function createSearchRequestPayloadWithExpressionQuery(domain = process.env.DOMAIN || 'social') {
  const config = getDomainConfig(domain);
  const testData = config.testData;

  return createEnvelope('search', {
    transaction_id: generateId(),
    search_request: [{
      reference_id: `ref-${generateId()}`,
      timestamp: getTimestamp(),
      search_criteria: {
        query_type: 'expression',
        query: {
          type: 'ns:org:QueryType:expression',
          value: {
            expression: testData.expression,
          },
        },
      },
    }],
  }, { domain });
}

/**
 * Create a search request payload with predicate query
 * @param {string} domain - Domain identifier
 * @returns {object} Search request envelope
 */
export function createSearchRequestPayloadWithPredicateQuery(domain = process.env.DOMAIN || 'social') {
  const config = getDomainConfig(domain);
  const testData = config.testData;

  return createEnvelope('search', {
    transaction_id: generateId(),
    search_request: [{
      reference_id: `ref-${generateId()}`,
      timestamp: getTimestamp(),
      search_criteria: {
        query_type: 'predicate',
        query: testData.predicate,
      },
    }],
  }, { domain });
}

/**
 * Create a subscribe request payload
 * @param {string} domain - Domain identifier
 * @returns {object} Subscribe request envelope
 */
export function createSubscribeRequestPayload(domain = process.env.DOMAIN || 'social') {
  const config = getDomainConfig(domain);
  const testData = config.testData;

  return createEnvelope('subscribe', {
    transaction_id: generateId(),
    subscribe_request: [{
      reference_id: `ref-${generateId()}`,
      timestamp: getTimestamp(),
      subscribe_criteria: {
        reg_event_type: config.defaultEventType,
        filter: testData.subscribeFilter,
        notify_record_type: testData.notifyRecordType,
      },
    }],
  }, { domain });
}

/**
 * Create an unsubscribe request payload
 * @param {string} domain - Domain identifier
 * @returns {object} Unsubscribe request envelope
 */
export function createUnsubscribeRequestPayload(domain = process.env.DOMAIN || 'social') {
  const config = getDomainConfig(domain);
  const testData = config.testData;

  return createEnvelope('unsubscribe', {
    transaction_id: generateId(),
    timestamp: getTimestamp(),
    subscription_codes: testData.subscriptionCodes,
  }, { domain });
}

/**
 * Create a transaction status request payload
 * @param {string} domain - Domain identifier
 * @returns {object} Transaction status request envelope
 */
export function createTxnStatusRequestPayload(domain = process.env.DOMAIN || 'social') {
  const transactionId = generateId();

  return createEnvelope('txn-status', {
    transaction_id: transactionId,
    txnstatus_request: {
      reference_id: `ref-${generateId()}`,
      txn_type: 'search',
      attribute_type: 'transaction_id',
      attribute_value: transactionId,
    },
  }, { domain });
}

// ============================================
// CALLBACK PAYLOAD FACTORIES
// ============================================

/**
 * Create an on-search callback payload
 * @param {string} domain - Domain identifier
 * @returns {object} On-search callback envelope
 */
export function createOnSearchPayload(domain = process.env.DOMAIN || 'social') {
  const config = getDomainConfig(domain);

  return createCallbackEnvelope('on-search', {
    transaction_id: generateId(),
    correlation_id: generateId(),
    search_response: [{
      reference_id: `ref-${generateId()}`,
      timestamp: getTimestamp(),
      status: 'succ',
      data: {
        version: '1.0.0',
        reg_record_type: config.defaultRecordType,
        reg_records: [],
      },
    }],
  }, { domain });
}

/**
 * Create an on-subscribe callback payload
 * @param {string} domain - Domain identifier
 * @returns {object} On-subscribe callback envelope
 */
export function createOnSubscribePayload(domain = process.env.DOMAIN || 'social') {
  return createEnvelope('on-subscribe', {
    transaction_id: generateId(),
    correlation_id: generateId(),
    subscribe_response: [{
      reference_id: `ref-${generateId()}`,
      timestamp: getTimestamp(),
      status: 'succ',
      subscriptions: [{
        code: `sub-${generateId()}`,
        status: 'subscribe',
        timestamp: getTimestamp(),
      }],
    }],
  }, { domain });
}

/**
 * Create an on-unsubscribe callback payload
 * @param {string} domain - Domain identifier
 * @returns {object} On-unsubscribe callback envelope
 */
export function createOnUnsubscribePayload(domain = process.env.DOMAIN || 'social') {
  const config = getDomainConfig(domain);
  const testData = config.testData;

  return createEnvelope('on-unsubscribe', {
    transaction_id: generateId(),
    correlation_id: generateId(),
    timestamp: getTimestamp(),
    status: 'succ',
    subscription_status: [{
      code: testData.subscriptionCodes[0],
      status: 'unsubscribe',
    }],
  }, { domain });
}

/**
 * Create a txn-on-status callback payload
 * @param {string} domain - Domain identifier
 * @returns {object} Transaction on-status callback envelope
 */
export function createOnTxnStatusPayload(domain = process.env.DOMAIN || 'social') {
  const transactionId = generateId();

  return createCallbackEnvelope('txn-on-status', {
    transaction_id: transactionId,
    correlation_id: generateId(),
    txnstatus_response: {
      txn_type: 'search',
      txn_status: {
        transaction_id: transactionId,
        correlation_id: generateId(),
        search_response: [],
      },
    },
  }, { domain });
}

/**
 * Create a notify callback payload
 * @param {string} domain - Domain identifier
 * @returns {object} Notify callback envelope
 */
export function createNotifyPayload(domain = process.env.DOMAIN || 'social') {
  const config = getDomainConfig(domain);

  return createCallbackEnvelope('notify', {
    transaction_id: generateId(),
    notify_event: [{
      reference_id: `ref-${generateId()}`,
      timestamp: getTimestamp(),
      data: {
        version: '1.0.0',
        reg_record_type: config.defaultRecordType,
        reg_records: {},
      },
      locale: 'eng',
    }],
  }, { domain });
}

// ============================================
// RESPONSE SCHEMAS
// ============================================

/**
 * ACK response schema used by most async endpoints
 */
export const ackResponseSchema = {
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

/**
 * Search response schema for sync search
 */
export const searchResponseSchema = {
  type: 'object',
  properties: {
    transaction_id: { type: ['integer', 'string'] },
    correlation_id: { type: 'string' },
    txnstatus_response: {
      type: 'object',
      properties: {
        transaction_id: { type: ['integer', 'string'] },
        correlation_id: { type: 'string' },
        search_response: { type: 'array' },
      },
    },
  },
};

/**
 * Transaction status response schema
 */
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
      },
    },
  },
};

/**
 * On-search request schema for callback validation
 */
export const onsearchRequestSchema = {
  '$schema': 'https://json-schema.org/draft/2020-12/schema',
  type: 'object',
  properties: {
    message: {
      type: 'object',
      properties: {
        transaction_id: { type: ['integer', 'string'] },
        correlation_id: { type: 'string' },
        search_response: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              reference_id: { type: 'string' },
              timestamp: { type: 'string' },
              status: { type: 'string', enum: ['rcvd', 'processed', 'failed', 'succ', 'rjct', 'part'] },
              status_reason_code: { type: 'string' },
              status_reason_message: { type: 'string' },
              data: { type: 'object' },
              pagination: { type: 'object' },
              locale: { type: 'string', enum: ['en', 'fr', 'ar'] },
            },
          },
        },
      },
      required: ['transaction_id', 'correlation_id', 'search_response'],
    },
  },
  required: ['message'],
};

/**
 * Reg records schema for response validation
 */
export const regRecordsSchema = {
  type: 'object',
  properties: {
    identifier: {
      type: 'object',
      properties: {
        identifier_type: { type: 'string' },
        identifier_value: { type: 'string' },
      },
    },
    death_date: { type: 'string', format: 'date-time' },
    death_place: { type: 'string' },
    address: { type: 'object' },
    marital_status: { type: 'string' },
    marriage_date: { type: 'string', format: 'date-time' },
    divorce_date: { type: 'string', format: 'date-time' },
    parent1_identifier: { type: 'object' },
    parent2_identifier: { type: 'object' },
  },
};

// Schema aliases for backward compatibility
export const subscribeResponseSchema = ackResponseSchema;
export const unsubscribeResponseSchema = ackResponseSchema;
export const asyncsearchResponseSchema = ackResponseSchema;
export const onsearchResponseSchema = ackResponseSchema;
export const onsubscribeResponseSchema = ackResponseSchema;
export const onunsubscribeResponseSchema = ackResponseSchema;
export const asynctxnstatusResponseSchema = ackResponseSchema;
export const ontxnstatusResponseSchema = ackResponseSchema;
