/**
 * Social Registry Search Request Payloads
 *
 * Generates spec-compliant search request payloads for SR compliance testing.
 */

import { createEnvelope, generateId, getTimestamp } from '../../../common/helpers/index.js';
import config from '../config.js';

/**
 * Create a search request with idtype-value query
 */
export function createIdTypeSearchPayload(idType = 'UIN', idValue = 'TEST-001') {
  return createEnvelope('search', {
    transaction_id: generateId(),
    search_request: [
      {
        reference_id: `ref-${generateId()}`,
        timestamp: getTimestamp(),
        search_criteria: {
          query_type: 'idtype-value',
          query: {
            type: idType,
            value: idValue,
          },
        },
      },
    ],
  });
}

/**
 * Create a search request with expression query
 */
export function createExpressionSearchPayload(expression = null) {
  const defaultExpression = {
    collection: 'Group',
    query: {
      '$and': [
        { 'poverty_score': { '$lt': 5 } },
        { 'location': { '$eq': 'central_region' } },
      ],
    },
  };

  return createEnvelope('search', {
    transaction_id: generateId(),
    search_request: [
      {
        reference_id: `ref-${generateId()}`,
        timestamp: getTimestamp(),
        search_criteria: {
          query_type: 'expression',
          query: {
            type: 'ns:org:QueryType:expression',
            value: {
              expression: expression || defaultExpression,
            },
          },
        },
      },
    ],
  });
}

/**
 * Create a search request with predicate query
 */
export function createPredicateSearchPayload(predicates = null) {
  const defaultPredicates = [
    {
      seq_num: 1,
      expression1: {
        attribute_name: 'age',
        operator: 'lt',
        attribute_value: '25',
      },
      condition: 'and',
      expression2: {
        attribute_name: 'poverty_score',
        operator: 'lt',
        attribute_value: '2.5',
      },
    },
  ];

  return createEnvelope('search', {
    transaction_id: generateId(),
    search_request: [
      {
        reference_id: `ref-${generateId()}`,
        timestamp: getTimestamp(),
        search_criteria: {
          query_type: 'predicate',
          query: predicates || defaultPredicates,
        },
      },
    ],
  });
}

export default {
  createIdTypeSearchPayload,
  createExpressionSearchPayload,
  createPredicateSearchPayload,
};
