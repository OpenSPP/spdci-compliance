/**
 * Social Registry Domain Configuration
 *
 * Domain-specific settings, record types, and query attributes for SR compliance testing.
 */

export const config = {
  domain: 'social',
  name: 'Social Registry',
  spec: 'social_api_v1.0.0.yaml',

  // Record types supported by Social Registry
  recordTypes: {
    person: 'SRPerson',
    group: 'SRGroup',
    member: 'SRMember',
  },

  // Registry type identifier
  registryType: 'ns:org:RegistryType:Social',

  // Query types supported
  queryTypes: ['idtype-value', 'expression', 'predicate'],

  // Identifier types for idtype-value queries
  identifierTypes: [
    'UIN',           // Unique Identification Number
    'MOBILE',        // Mobile phone number
    'EMAIL',         // Email address
    'NIN',           // National ID Number
    'HOUSEHOLD_ID',  // Household identifier
  ],

  // Queryable attributes for predicate queries
  queryAttributes: [
    'age',
    'gender',
    'poverty_score',
    'location',
    'district',
    'postal_code',
    'group_size',
  ],

  // Event types for subscription
  eventTypes: [
    'REGISTER',
    'UPDATE',
    'DELETE',
    'LINK',
    'UNLINK',
  ],

  // Response entity types
  responseEntities: ['Group', 'Member'],
};

export default config;
