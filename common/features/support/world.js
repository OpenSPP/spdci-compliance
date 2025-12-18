/**
 * Cucumber World - Shared test context
 *
 * Provides common context and utilities available to all step definitions.
 */

import { setWorldConstructor, World } from '@cucumber/cucumber';
import {
  getDomainConfig,
  getEndpoint,
  getTestData,
  getCallbackPath,
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
} from '../../helpers/index.js';

class SpdciWorld extends World {
  constructor(options) {
    super(options);

    // Domain configuration
    this.domain = process.env.DOMAIN || 'social';
    this.domainConfig = getDomainConfig(this.domain);
    this.testData = getTestData(this.domain);
    this.baseUrl = process.env.API_BASE_URL || 'http://127.0.0.1:3333/';

    // Response time threshold (test timeout accommodation, not SLA)
    this.responseTimeThreshold = Number(process.env.RESPONSE_TIME_THRESHOLD_MS) || 15000;

    // Request/response state
    this.request = null;
    this.response = null;
    this.requestPayload = null;
    this.payload = null; // Alias for backward compatibility

    // Callback tracking
    this.callbacksReceived = [];
    this.workflow = null; // For async workflow tests

    // Recording (for mock server tests)
    this.recordings = [];

    // Bind payload factories with domain
    this._bindPayloadFactories();
  }

  /**
   * Bind payload factory methods to this world instance with domain pre-filled
   */
  _bindPayloadFactories() {
    const domain = this.domain;

    this.payloads = {
      createSearchRequestPayload: () => createSearchRequestPayload(domain),
      createSearchRequestPayloadWithExpressionQuery: () => createSearchRequestPayloadWithExpressionQuery(domain),
      createSearchRequestPayloadWithPredicateQuery: () => createSearchRequestPayloadWithPredicateQuery(domain),
      createSubscribeRequestPayload: () => createSubscribeRequestPayload(domain),
      createUnsubscribeRequestPayload: () => createUnsubscribeRequestPayload(domain),
      createTxnStatusRequestPayload: () => createTxnStatusRequestPayload(domain),
      createOnSearchPayload: () => createOnSearchPayload(domain),
      createOnSubscribePayload: () => createOnSubscribePayload(domain),
      createOnUnsubscribePayload: () => createOnUnsubscribePayload(domain),
      createOnTxnStatusPayload: () => createOnTxnStatusPayload(domain),
      createNotifyPayload: () => createNotifyPayload(domain),
    };
  }

  /**
   * Get endpoint path for this domain
   * @param {string} endpointName - Endpoint name (syncSearch, asyncSearch, etc.)
   * @returns {string} Endpoint path
   */
  getEndpoint(endpointName) {
    return getEndpoint(endpointName, this.domain);
  }

  /**
   * Get full URL for an endpoint
   * @param {string} endpointName - Endpoint name or path
   * @returns {string} Full URL
   */
  getUrl(endpointName) {
    const endpoint = this.getEndpoint(endpointName) || endpointName;
    const base = this.baseUrl.endsWith('/') ? this.baseUrl : `${this.baseUrl}/`;
    const path = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    return `${base}${path}`;
  }

  /**
   * Get callback path for an action
   * @param {string} action - Action name (search, subscribe, etc.)
   * @returns {string|undefined} Callback path
   */
  getCallbackPath(action) {
    return getCallbackPath(action, this.domain);
  }

  /**
   * Store response for assertions
   * @param {object} response - Response object
   */
  setResponse(response) {
    this.response = response;
  }

  /**
   * Store payload for later use
   * @param {object} payload - Request payload
   */
  setPayload(payload) {
    this.payload = payload;
    this.requestPayload = payload;
  }

  /**
   * Record a callback received
   * @param {object} callback - Callback data
   */
  recordCallback(callback) {
    this.callbacksReceived.push({
      timestamp: new Date().toISOString(),
      ...callback,
    });
  }

  /**
   * Clear callback recordings
   */
  clearCallbacks() {
    this.callbacksReceived = [];
  }

  /**
   * Store workflow state for async tests
   * @param {object} workflowData - Workflow data
   */
  setWorkflow(workflowData) {
    this.workflow = {
      ...this.workflow,
      ...workflowData,
    };
  }
}

setWorldConstructor(SpdciWorld);
