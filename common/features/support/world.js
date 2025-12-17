/**
 * Cucumber World - Shared test context
 *
 * Provides common context and utilities available to all step definitions.
 */

import { setWorldConstructor, World } from '@cucumber/cucumber';
import { getDomainConfig, getBaseUrl } from '../../helpers/index.js';

class SpdciWorld extends World {
  constructor(options) {
    super(options);

    // Domain configuration
    this.domain = process.env.DOMAIN || 'social';
    this.domainConfig = getDomainConfig(this.domain);
    this.baseUrl = getBaseUrl();

    // Request/response state
    this.request = null;
    this.response = null;
    this.requestPayload = null;

    // Callback tracking
    this.callbacksReceived = [];

    // Recording (for mock server tests)
    this.recordings = [];
  }

  /**
   * Get full URL for an endpoint
   */
  getUrl(endpoint) {
    const path = this.domainConfig.endpoints[endpoint] || endpoint;
    return this.baseUrl + path;
  }

  /**
   * Store response for assertions
   */
  setResponse(response) {
    this.response = response;
  }

  /**
   * Record a callback received
   */
  recordCallback(callback) {
    this.callbacksReceived.push({
      timestamp: new Date().toISOString(),
      ...callback,
    });
  }
}

setWorldConstructor(SpdciWorld);
