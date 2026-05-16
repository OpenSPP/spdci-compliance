/**
 * Disability Registry Domain Configuration
 *
 * Domain-specific settings, record types, and query attributes for DR compliance testing.
 */

export const config = {
  domain: 'dr',
  name: 'Disability Registry',
  spec: 'dr_api_v1.0.0.yaml',

  recordTypes: {
    disabledPerson: 'DisabledPerson',
    drPerson: 'DRPerson',
    disabilitySupport: 'DisabilitySupport',
  },

  registryType: 'ns:org:RegistryType:DR',

  queryTypes: ['idtype-value', 'expression', 'predicate'],

  identifierTypes: [
    'UIN',
    'NIN',
    'DISABILITY_ID',
    'MEMBER_ID',
  ],

  queryAttributes: [
    'disability_status',
    'disability_level',
    'disability_details.impairment_type',
    'disability_details.impairment_level',
    'personal_details.member_identifier',
  ],

  eventTypes: [
    'register',
  ],

  responseEntities: ['DisabledPerson', 'DisabilitySupport'],
};

export default config;
