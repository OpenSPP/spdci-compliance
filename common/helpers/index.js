/**
 * Common SPDCI Compliance Test Helpers
 *
 * Re-exports all shared utilities for easy importing.
 */

export * from './envelope.js';
export * from './headers.js';
export {
  assertOpenApiRequest,
  assertOpenApiResponse,
  getOpenApiSpec,
} from './openapi-validator.js';

// Domain configuration
const domains = {
  social: {
    name: 'Social Registry',
    spec: 'social_api_v1.0.0.yaml',
    endpoints: {
      search: '/registry/search',
      onSearch: '/registry/on-search',
      syncSearch: '/registry/sync/search',
      subscribe: '/registry/subscribe',
      onSubscribe: '/registry/on-subscribe',
      unsubscribe: '/registry/unsubscribe',
      onUnsubscribe: '/registry/on-unsubscribe',
      notify: '/registry/notify',
      txnStatus: '/registry/txn/status',
      txnOnStatus: '/registry/txn/on-status',
      syncTxnStatus: '/registry/sync/txn/status',
    },
  },
  crvs: {
    name: 'Civil Registration and Vital Statistics',
    spec: 'crvs_api_v1.0.0.yaml',
    endpoints: {
      search: '/registry/search',
      onSearch: '/registry/on-search',
      syncSearch: '/registry/sync/search',
      subscribe: '/registry/subscribe',
      onSubscribe: '/registry/on-subscribe',
      unsubscribe: '/registry/unsubscribe',
      onUnsubscribe: '/registry/on-unsubscribe',
      notify: '/registry/notify',
      txnStatus: '/registry/txn/status',
      txnOnStatus: '/registry/txn/on-status',
    },
  },
  dr: {
    name: 'Disbursement Registry',
    spec: 'dr_api_v1.0.0.yaml',
    endpoints: {
      // DR-specific endpoints
      search: '/registry/search',
      onSearch: '/registry/on-search',
      disburse: '/registry/disburse',
      onDisburse: '/registry/on-disburse',
    },
  },
  fr: {
    name: 'Functional Registry',
    spec: 'fr_api_v1.0.0.yaml',
    endpoints: {
      search: '/registry/search',
      onSearch: '/registry/on-search',
      syncSearch: '/registry/sync/search',
    },
  },
  ibr: {
    name: 'ID & Beneficiary Registry',
    spec: 'ibr_api_v1.0.0.yaml',
    endpoints: {
      search: '/registry/search',
      onSearch: '/registry/on-search',
      syncSearch: '/registry/sync/search',
      subscribe: '/registry/subscribe',
      onSubscribe: '/registry/on-subscribe',
    },
  },
};

export function getDomainConfig(domain = process.env.DOMAIN || 'social') {
  return domains[domain] || domains.social;
}

export function getEndpoint(endpointName, domain = process.env.DOMAIN || 'social') {
  const config = getDomainConfig(domain);
  return config.endpoints[endpointName];
}

export function getBaseUrl() {
  return process.env.API_BASE_URL || 'http://localhost:8080';
}

export function getFullUrl(endpointName, domain) {
  return getBaseUrl() + getEndpoint(endpointName, domain);
}
