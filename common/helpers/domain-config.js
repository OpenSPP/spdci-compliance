/**
 * SPDCI Domain Configuration Registry
 *
 * Centralized configuration for all SPDCI domains (Social, FR, CRVS, etc.).
 * Used by parameterized step definitions to generate domain-specific payloads
 * and validate responses without duplicating code across domains.
 */

/**
 * Domain configurations with all domain-specific values
 */
const domainConfigs = {
  social: {
    name: 'Social Registry',
    shortName: 'SR',
    spec: 'social_api_v1.0.0.yaml',

    // Environment variable prefix for endpoint overrides
    envPrefix: 'SR',

    // Default receiver ID for this domain
    defaultReceiverId: 'sr-server',

    // Record types used in responses
    recordTypes: ['Member', 'SRPerson', 'Person'],
    defaultRecordType: 'Member',

    // Identifier types for search queries
    identifierTypes: ['UIN', 'NIN', 'HOUSEHOLD_ID'],
    defaultIdentifierType: 'UIN',

    // Event types for subscriptions
    eventTypes: ['REGISTER', 'UPDATE', 'DEREGISTER'],
    defaultEventType: 'REGISTER',

    // Default test values for payloads
    testData: {
      // idtype-value query - strictly validated
      idTypeValue: {
        type: 'UIN',
        value: 'TEST-001',
      },
      // Expression query - envelope only validation per DCI spec
      // The DCI spec intentionally leaves expression query format implementation-specific.
      // We only validate the envelope structure { type, value }, not the value contents.
      // Implementations may use MongoDB-style, GraphQL, or custom query languages.
      expression: {
        sample_field: 'implementation-specific-query',
      },
      // Predicate query - strictly validated per DCI ExpPredicateWithCondition spec
      // Operators MUST be: gt, lt, eq, ge, le, in (per ExpOperator.yaml)
      predicate: [{
        seq_num: 1,
        expression1: { attribute_name: 'age', operator: 'lt', attribute_value: '25' },
        condition: 'and',
        expression2: { attribute_name: 'poverty_score', operator: 'lt', attribute_value: '2.5' },
      }],
      // Subscribe filter
      subscribeFilter: {
        type: 'UIN',
        value: 'TEST-001',
      },
      notifyRecordType: 'Member',
      // Unsubscribe codes
      subscriptionCodes: ['sub-test-001'],
    },

    // Endpoints (relative paths)
    endpoints: {
      syncSearch: 'registry/sync/search',
      asyncSearch: 'registry/search',
      onSearch: 'registry/on-search',
      subscribe: 'registry/subscribe',
      onSubscribe: 'registry/on-subscribe',
      unsubscribe: 'registry/unsubscribe',
      onUnsubscribe: 'registry/on-unsubscribe',
      syncTxnStatus: 'registry/sync/txn/status',
      asyncTxnStatus: 'registry/txn/status',
      onTxnStatus: 'registry/txn/on-status',
      notify: 'registry/notify',
    },

    // Callback paths (absolute)
    callbackPaths: {
      search: '/registry/on-search',
      subscribe: '/registry/on-subscribe',
      unsubscribe: '/registry/on-unsubscribe',
      'txn-status': '/registry/txn/on-status',
    },
  },

  fr: {
    name: 'Farmer Registry',
    shortName: 'FR',
    spec: 'fr_api_v1.0.0.yaml',

    envPrefix: 'FR',
    defaultReceiverId: 'fr-server',

    recordTypes: ['Farmer'],
    defaultRecordType: 'Farmer',

    identifierTypes: ['FARMER_ID', 'FARM_REG_NO', 'NIN'],
    defaultIdentifierType: 'FARMER_ID',

    eventTypes: ['REGISTER', 'UPDATE', 'DEREGISTER'],
    defaultEventType: 'REGISTER',

    testData: {
      idTypeValue: {
        type: 'FARMER_ID',
        value: 'FARMER-TEST-001',
      },
      // Expression query - envelope only validation (implementation-specific)
      expression: {
        sample_field: 'implementation-specific-query',
      },
      // Predicate query - strictly validated per DCI spec
      // Operators: gt, lt, eq, ge, le, in (NOT gte/lte)
      predicate: [{
        seq_num: 1,
        expression1: { attribute_name: 'farm_size', operator: 'ge', attribute_value: '5' },
        condition: 'and',
        expression2: { attribute_name: 'irrigation_type', operator: 'eq', attribute_value: 'drip' },
      }],
      subscribeFilter: {
        type: 'FARMER_ID',
        value: 'FARMER-TEST-001',
      },
      notifyRecordType: 'Farmer',
      subscriptionCodes: ['sub-fr-test-001'],
    },

    endpoints: {
      syncSearch: 'registry/sync/search',
      asyncSearch: 'registry/search',
      onSearch: 'registry/on-search',
      subscribe: 'registry/subscribe',
      onSubscribe: 'registry/on-subscribe',
      unsubscribe: 'registry/unsubscribe',
      onUnsubscribe: 'registry/on-unsubscribe',
      syncTxnStatus: 'registry/sync/txn/status',
      asyncTxnStatus: 'registry/txn/status',
      onTxnStatus: 'registry/txn/on-status',
      notify: 'registry/notify',
    },

    callbackPaths: {
      search: '/registry/on-search',
      subscribe: '/registry/on-subscribe',
      unsubscribe: '/registry/on-unsubscribe',
      'txn-status': '/registry/txn/on-status',
    },
  },

  crvs: {
    name: 'Civil Registration and Vital Statistics',
    shortName: 'CRVS',
    spec: 'crvs_api_v1.0.0.yaml',

    envPrefix: 'CRVS',
    defaultReceiverId: 'crvs-server',

    recordTypes: ['Person', 'CRVSPerson'],
    defaultRecordType: 'Person',

    identifierTypes: ['BRN', 'DRN', 'MRN', 'NIN'],
    defaultIdentifierType: 'BRN',

    eventTypes: ['BIRTH', 'DEATH', 'MARRIAGE', 'DIVORCE'],
    defaultEventType: 'BIRTH',

    testData: {
      idTypeValue: {
        type: 'BIRTH_REG_NO',
        value: 'BIRTH-TEST-001',
      },
      // Expression query - envelope only validation (implementation-specific)
      expression: {
        sample_field: 'implementation-specific-query',
      },
      // Predicate query - strictly validated per DCI spec
      // Operators: gt, lt, eq, ge, le, in (NOT gte/lte)
      predicate: [{
        seq_num: 1,
        expression1: { attribute_name: 'registration_date', operator: 'ge', attribute_value: '2020-01-01' },
        condition: 'and',
        expression2: { attribute_name: 'sex', operator: 'eq', attribute_value: 'male' },
      }],
      subscribeFilter: {
        type: 'BIRTH_REG_NO',
        value: 'BIRTH-TEST-001',
      },
      notifyRecordType: 'Person',
      subscriptionCodes: ['sub-crvs-test-001'],
    },

    endpoints: {
      syncSearch: 'registry/sync/search',
      asyncSearch: 'registry/search',
      onSearch: 'registry/on-search',
      subscribe: 'registry/subscribe',
      onSubscribe: 'registry/on-subscribe',
      unsubscribe: 'registry/unsubscribe',
      onUnsubscribe: 'registry/on-unsubscribe',
      syncTxnStatus: 'registry/sync/txn/status',
      asyncTxnStatus: 'registry/txn/status',
      onTxnStatus: 'registry/txn/on-status',
      notify: 'registry/notify',
    },

    callbackPaths: {
      search: '/registry/on-search',
      subscribe: '/registry/on-subscribe',
      unsubscribe: '/registry/on-unsubscribe',
      'txn-status': '/registry/txn/on-status',
    },
  },

  dr: {
    name: 'Disability Registry',
    shortName: 'DR',
    spec: 'dr_api_v1.0.0.yaml',

    envPrefix: 'DR',
    defaultReceiverId: 'dr-server',

    recordTypes: ['DisabledPerson', 'DRPerson', 'DisabilitySupport'],
    defaultRecordType: 'DisabledPerson',

    identifierTypes: ['UIN', 'NIN', 'DISABILITY_ID', 'MEMBER_ID'],
    defaultIdentifierType: 'DISABILITY_ID',

    eventTypes: ['register'],
    defaultEventType: 'register',

    testData: {
      idTypeValue: {
        type: 'DISABILITY_ID',
        value: 'DR-TEST-001',
      },
      expression: {
        query: {
          $and: [
            { disability_status: { $eq: 'Approved' } },
            { 'disability_details.impairment_type': { $eq: 'Mobility' } },
          ],
        },
      },
      predicate: [{
        seq_num: 1,
        expression1: { attribute_name: 'disability_status', operator: 'eq', attribute_value: 'Approved' },
        condition: 'and',
        expression2: { attribute_name: 'disability_details.impairment_type', operator: 'eq', attribute_value: 'Mobility' },
      }],
      subscribeFilter: {
        type: 'ns:org:QueryType:NoSql',
        value: {
          expression: {
            query: {
              disability_status: { $eq: 'Approved' },
            },
          },
        },
      },
      disabledCriteria: {
        query_type: 'expression',
        query: {
          'personal_details.member_identifier': {
            eq: 'DR-MEMBER-001',
          },
        },
      },
      notifyRecordType: 'DisabledPerson',
      subscriptionCodes: ['sub-dr-test-001'],
    },

    endpoints: {
      syncSearch: 'registry/sync/search',
      asyncSearch: 'registry/search',
      onSearch: 'registry/on-search',
      subscribe: 'registry/subscribe',
      onSubscribe: 'registry/on-subscribe',
      unsubscribe: 'registry/unsubscribe',
      onUnsubscribe: 'registry/on-unsubscribe',
      // DR OpenAPI defines async txn status only.
      syncTxnStatus: null,
      asyncTxnStatus: 'registry/txn/status',
      onTxnStatus: 'registry/txn/on-status',
      notify: 'registry/notify',
      syncDisabled: 'registry/sync/disabled',
      getDisabilityDetails: 'registry/sync/get-disability-details',
      getDisabilitySupport: 'registry/sync/get-disability-support',
    },

    callbackPaths: {
      search: '/registry/on-search',
      subscribe: '/registry/on-subscribe',
      unsubscribe: '/registry/on-unsubscribe',
      'txn-status': '/registry/txn/on-status',
    },
  },
};

/**
 * Get domain configuration
 * @param {string} domain - Domain identifier (social, fr, crvs, dr)
 * @returns {object} Domain configuration
 */
export function getDomainConfig(domain = process.env.DOMAIN || 'social') {
  const config = domainConfigs[domain];
  if (!config) {
    throw new Error(`Unknown domain: ${domain}. Valid domains: ${Object.keys(domainConfigs).join(', ')}`);
  }
  return config;
}

/**
 * Get endpoint for a domain, respecting environment variable overrides
 * @param {string} endpointName - Endpoint name (syncSearch, asyncSearch, etc.)
 * @param {string} domain - Domain identifier
 * @returns {string} Endpoint path
 */
export function getEndpoint(endpointName, domain = process.env.DOMAIN || 'social') {
  const config = getDomainConfig(domain);
  const configuredEndpoint = config.endpoints[endpointName];
  if (configuredEndpoint === null) {
    throw new Error(`Endpoint "${endpointName}" is not supported for domain "${domain}"`);
  }

  const envVarName = `${config.envPrefix}_${endpointName.replace(/([A-Z])/g, '_$1').toUpperCase()}_ENDPOINT`;
  const envPrefix = process.env[`${config.envPrefix}_ENDPOINT_PREFIX`] ?? 'registry/';

  // Check for environment variable override first
  const envOverride = process.env[envVarName];
  if (envOverride) {
    return envOverride;
  }

  // Return default endpoint
  return configuredEndpoint || `${envPrefix}${endpointName}`;
}

/**
 * Get callback path for an action
 * @param {string} action - Action name (search, subscribe, unsubscribe, txn-status)
 * @param {string} domain - Domain identifier
 * @returns {string|undefined} Callback path
 */
export function getCallbackPath(action, domain = process.env.DOMAIN || 'social') {
  const config = getDomainConfig(domain);
  return config.callbackPaths[action];
}

/**
 * Get default sender URI for an action (used in async requests)
 * @param {string} action - Action name
 * @param {string} domain - Domain identifier
 * @returns {string|undefined} Sender URI
 */
export function getDefaultSenderUri(action, domain = process.env.DOMAIN || 'social') {
  const base = process.env.CALLBACK_SERVER_BASE_URL;
  if (!base) return undefined;

  const callbackPath = getCallbackPath(action, domain);
  if (!callbackPath) return undefined;

  try {
    return new URL(callbackPath, base).toString();
  } catch {
    const normalizedBase = String(base).endsWith('/') ? String(base) : `${base}/`;
    const normalizedPath = String(callbackPath).startsWith('/') ? String(callbackPath).slice(1) : String(callbackPath);
    return `${normalizedBase}${normalizedPath}`;
  }
}

/**
 * Get receiver ID for a domain
 * @param {string} domain - Domain identifier
 * @returns {string} Receiver ID
 */
export function getReceiverId(domain = process.env.DOMAIN || 'social') {
  const config = getDomainConfig(domain);
  return process.env.DCI_RECEIVER_ID || config.defaultReceiverId;
}

/**
 * Get test data for a domain
 * @param {string} domain - Domain identifier
 * @returns {object} Test data configuration
 */
export function getTestData(domain = process.env.DOMAIN || 'social') {
  const config = getDomainConfig(domain);
  return config.testData;
}

/**
 * Get all available domains
 * @returns {string[]} List of domain identifiers
 */
export function getAvailableDomains() {
  return Object.keys(domainConfigs);
}

/**
 * Check if a domain is valid
 * @param {string} domain - Domain identifier
 * @returns {boolean} True if domain exists
 */
export function isValidDomain(domain) {
  return domain in domainConfigs;
}

export { domainConfigs };
