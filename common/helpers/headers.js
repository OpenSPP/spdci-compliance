/**
 * HTTP Header Utilities for SPDCI Compliance Testing
 *
 * These utilities are generic and don't assume any specific auth mechanism.
 * Configure authentication via environment variables:
 *   - AUTH_TOKEN: Bearer token value (will be prefixed with "Bearer " if needed)
 *   - EXTRA_HEADERS_JSON: JSON object/array of additional headers
 */

/**
 * Apply common SPDCI headers to a request
 *
 * @param {object} request - Pactum spec object
 * @param {object} options - Configuration options
 * @param {string} [options.contentType] - Content-Type header value
 * @param {string} [options.authorization] - Authorization header value (omit to skip)
 * @param {string} [options.correlationId] - X-Correlation-ID header value
 * @param {string[]} [options.omitHeaders] - Header names to omit (case-insensitive)
 */
export function applyCommonHeaders(request, options = {}) {
  const {
    contentType = 'application/json',
    authorization = getDefaultAuthorization(),
    correlationId = null,
    omitHeaders = [],
  } = options;

  const omit = new Set(omitHeaders.map(h => String(h).toLowerCase()));

  if (!omit.has('content-type')) {
    request.withHeaders({ 'Content-Type': contentType });
  }

  if (authorization && !omit.has('authorization')) {
    request.withHeaders({ 'Authorization': authorization });
  }

  if (correlationId && !omit.has('x-correlation-id')) {
    request.withHeaders({ 'X-Correlation-ID': correlationId });
  }

  return request;
}

/**
 * Get default authorization from environment
 * Returns null if not configured (no auth by default)
 */
function getDefaultAuthorization() {
  const token = process.env.AUTH_TOKEN;
  if (!token) return null;
  return token.startsWith('Bearer ') ? token : `Bearer ${token}`;
}

/**
 * Check if a header exists and optionally matches a value (case-insensitive)
 */
export function checkHeader(rawHeaders, headerName, expectedValue = null) {
  // rawHeaders is an array like ['Content-Type', 'application/json', ...]
  const headerNameLower = headerName.toLowerCase();

  for (let i = 0; i < rawHeaders.length; i += 2) {
    if (rawHeaders[i].toLowerCase() === headerNameLower) {
      const actualValue = rawHeaders[i + 1];

      if (expectedValue === null) {
        return { ok: true, actualValue };
      }

      const matches = actualValue.toLowerCase().includes(expectedValue.toLowerCase());
      return {
        ok: matches,
        actualValue,
        reason: matches ? null : 'mismatch',
      };
    }
  }

  return { ok: false, actualValue: null, reason: 'missing' };
}

/**
 * Validate required SPDCI headers are present
 */
export function validateRequiredHeaders(rawHeaders) {
  const required = ['content-type', 'authorization'];
  const errors = [];

  for (const header of required) {
    const { ok, reason } = checkHeader(rawHeaders, header);
    if (!ok) {
      errors.push(`Missing required header: ${header}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Extract specific header value (case-insensitive)
 */
export function getHeaderValue(rawHeaders, headerName) {
  const { ok, actualValue } = checkHeader(rawHeaders, headerName);
  return ok ? actualValue : null;
}
