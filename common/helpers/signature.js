/**
 * SPDCI Message Signature Utilities
 *
 * This module provides utilities for message signature handling in SPDCI compliance tests.
 *
 * SIGNATURE VALIDATION IN SPDCI
 * =============================
 * The SPDCI specification includes a `signature` field in the message envelope for
 * cryptographic verification of message integrity and non-repudiation. However:
 *
 * 1. The spec does not mandate a specific signing algorithm
 * 2. Implementations vary in whether signature validation is enforced
 * 3. Test environments often don't have PKI infrastructure
 *
 * TESTING MODES
 * =============
 * This test suite supports three signature testing modes:
 *
 * 1. STUB MODE (default): Uses placeholder signature 'unsigned-stub'
 *    - For API structure and workflow testing
 *    - Set: DCI_SIGNATURE not set (default)
 *
 * 2. INVALID SIGNATURE MODE: Tests that invalid signatures are rejected
 *    - Verifies implementations enforce signature validation
 *    - Set: DCI_SIGNATURE=any-valid-value, then tests mutate to invalid
 *
 * 3. VALID SIGNATURE MODE: Tests with real cryptographic signatures
 *    - For full compliance testing with PKI infrastructure
 *    - Set: DCI_SIGNATURE=<base64-encoded-signature>
 *    - Set: DCI_SIGNATURE_ALGORITHM=RS256|ES256|HS256 (optional)
 *
 * ENVIRONMENT VARIABLES
 * =====================
 * - DCI_SIGNATURE: Signature value to use in requests (default: 'unsigned-stub')
 * - DCI_SIGNATURE_ALGORITHM: Algorithm hint for signature generation
 * - DCI_SIGNATURE_PRIVATE_KEY: Private key for generating valid signatures (future)
 * - DCI_SIGNATURE_VALIDATION_ENABLED: Set to 'true' to run signature validation tests
 *
 * USAGE EXAMPLE
 * =============
 * ```bash
 * # Run tests without signature validation (structure testing)
 * npm run test:social
 *
 * # Run tests including signature validation
 * DCI_AUTH_TOKEN=xxx DCI_SIGNATURE_VALIDATION_ENABLED=true npm run test:social
 * ```
 */

/**
 * Signature validation test mode configuration
 */
export const signatureConfig = {
  /**
   * Whether signature validation tests should run.
   * These tests verify that implementations reject invalid signatures.
   * Requires DCI_AUTH_TOKEN to be set (to avoid failing on auth first).
   */
  validationEnabled: String(process.env.DCI_SIGNATURE_VALIDATION_ENABLED || '').toLowerCase() === 'true',

  /**
   * The default signature value used in requests.
   * In production testing, this should be a real cryptographic signature.
   */
  defaultSignature: process.env.DCI_SIGNATURE || 'unsigned-stub',

  /**
   * Signature algorithm hint (for future cryptographic signing support).
   * Common values: RS256, ES256, HS256
   */
  algorithm: process.env.DCI_SIGNATURE_ALGORITHM || null,
};

/**
 * Known invalid signature values for negative testing.
 * These values are intentionally malformed to test validation.
 */
export const INVALID_SIGNATURES = {
  empty: '',
  malformed: 'invalid-signature',
  truncated: 'eyJhbGciOiJSUzI1NiJ9.',  // Truncated JWT-like
  wrongFormat: '!@#$%^&*()',
  tooShort: 'abc',
};

/**
 * Get the signature value to use in test requests.
 *
 * @returns {string} Signature value
 */
export function getSignature() {
  return signatureConfig.defaultSignature;
}

/**
 * Check if signature validation tests should run.
 *
 * @returns {boolean} True if signature tests are enabled
 */
export function isSignatureValidationEnabled() {
  return signatureConfig.validationEnabled;
}

/**
 * Create a payload with an invalid signature for negative testing.
 *
 * @param {object} payload - Original payload with valid signature
 * @param {string} invalidType - Type of invalid signature ('empty', 'malformed', etc.)
 * @returns {object} New payload with invalid signature
 */
export function withInvalidSignature(payload, invalidType = 'malformed') {
  const invalid = INVALID_SIGNATURES[invalidType] || INVALID_SIGNATURES.malformed;
  const cloned = typeof structuredClone === 'function'
    ? structuredClone(payload)
    : JSON.parse(JSON.stringify(payload));
  cloned.signature = invalid;
  return cloned;
}

/**
 * Create a payload with a specific signature value.
 *
 * @param {object} payload - Original payload
 * @param {string} signature - Signature value to use
 * @returns {object} New payload with specified signature
 */
export function withSignature(payload, signature) {
  const cloned = typeof structuredClone === 'function'
    ? structuredClone(payload)
    : JSON.parse(JSON.stringify(payload));
  cloned.signature = signature;
  return cloned;
}

/**
 * Validate that a response indicates signature rejection.
 *
 * SPDCI implementations may reject invalid signatures in two ways:
 * 1. HTTP 4xx response (400 Bad Request, 401 Unauthorized, 403 Forbidden)
 * 2. HTTP 200 with ACK ERR and signature-related error code
 *
 * @param {object} response - HTTP response object
 * @returns {{valid: boolean, variant: string, errorCode?: string}}
 */
export function validateSignatureRejection(response) {
  const status = Number(response.statusCode);

  // HTTP error response
  if (status >= 400 && status < 500) {
    return {
      valid: true,
      variant: 'http_4xx',
      statusCode: status,
    };
  }

  // ACK ERR response
  if (status === 200) {
    const body = response.body;
    if (body?.message?.ack_status === 'ERR') {
      const errorCode = body?.message?.error?.code;
      const validCodes = ['err.signature.missing', 'err.signature.invalid', 'err.request.bad'];
      if (validCodes.includes(errorCode)) {
        return {
          valid: true,
          variant: 'ack_err',
          statusCode: status,
          errorCode,
        };
      }
    }
  }

  return {
    valid: false,
    variant: 'unexpected',
    statusCode: status,
    reason: `Expected HTTP 4xx or ACK ERR with signature error, got HTTP ${status}`,
  };
}

/**
 * Error codes that indicate signature validation failure.
 * Use these in assertions to verify signature rejection.
 */
export const SIGNATURE_ERROR_CODES = [
  'err.signature.missing',
  'err.signature.invalid',
];
