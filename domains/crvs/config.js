/**
 * CRVS (Civil Registration and Vital Statistics) Domain Configuration
 *
 * Domain-specific settings, record types, and query attributes for CRVS compliance testing.
 */

export const config = {
  domain: 'crvs',
  name: 'Civil Registration and Vital Statistics',
  spec: 'crvs_api_v1.0.0.yaml',

  // Record types supported by CRVS
  recordTypes: {
    person: 'CRVSPerson',
    birthCertificate: 'BirthCertificate',
    deathCertificate: 'DeathCertificate',
    marriageCertificate: 'MarriageCertificate',
  },

  // Registry type identifier
  registryType: 'ns:org:RegistryType:CRVS',

  // Query types supported
  queryTypes: ['idtype-value', 'expression', 'predicate'],

  // Identifier types for idtype-value queries
  identifierTypes: [
    'UIN',              // Unique Identification Number
    'BIRTH_REG_NO',     // Birth Registration Number
    'DEATH_REG_NO',     // Death Registration Number
    'MARRIAGE_REG_NO',  // Marriage Registration Number
    'NIN',              // National ID Number
  ],

  // Queryable attributes for predicate queries
  queryAttributes: [
    'date_of_birth',
    'date_of_death',
    'date_of_marriage',
    'place_of_birth',
    'place_of_death',
    'gender',
    'registration_date',
  ],

  // Event types for subscription (vital events)
  eventTypes: [
    'BIRTH',
    'DEATH',
    'MARRIAGE',
    'DIVORCE',
    'ADOPTION',
    'REGISTER',
    'UPDATE',
  ],

  // Response entity types
  responseEntities: ['Person', 'BirthCertificate', 'DeathCertificate'],
};

export default config;
