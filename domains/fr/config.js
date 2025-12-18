/**
 * FR (Farmer Registry) Domain Configuration
 *
 * Domain-specific settings, record types, and query attributes for FR compliance testing.
 */

export const config = {
  domain: 'fr',
  name: 'Farmer Registry',
  spec: 'fr_api_v1.0.0.yaml',

  // Record types supported by Farmer Registry
  recordTypes: {
    farmer: 'Farmer',
    farmInfo: 'FarmInfo',
    farmingActivities: 'FarmingActivities',
    cropDetails: 'CropDetails',
    liveStockDetails: 'LiveStockDetails',
  },

  // Registry type identifier
  registryType: 'ns:org:RegistryType:Farmer',

  // Query types supported
  queryTypes: ['idtype-value', 'expression', 'predicate'],

  // Identifier types for idtype-value queries
  identifierTypes: [
    'UIN',           // Unique Identification Number
    'FARMER_ID',     // Farmer Registration ID
    'FARM_ID',       // Farm Identifier
    'NIN',           // National ID Number
    'MOBILE',        // Mobile phone number
  ],

  // Queryable attributes for predicate queries
  queryAttributes: [
    'farm_size',
    'crop_type',
    'livestock_type',
    'location',
    'district',
    'land_tenure',
    'irrigation_type',
  ],

  // Event types for subscription
  eventTypes: [
    'REGISTER',
    'UPDATE',
    'DELETE',
    'HARVEST',
    'PLANTING',
  ],

  // Response entity types
  responseEntities: ['Farmer', 'FarmInfo'],
};

export default config;
