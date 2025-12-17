/**
 * HTTP Header Utilities for SPDCI Compliance Testing
 */

/**
 * Apply common SPDCI headers to a request
 */
export function applyCommonHeaders(request, options = {}) {
  const {
    contentType = 'application/json',
    authorization = process.env.AUTH_TOKEN || 'Bearer test-token',
    correlationId = null,
  } = options;

  request.withHeaders({
    'Content-Type': contentType,
    'Authorization': authorization,
  });

  if (correlationId) {
    request.withHeaders({ 'X-Correlation-ID': correlationId });
  }

  return request;
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
