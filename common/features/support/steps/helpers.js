/**
 * Common Step Definition Helpers
 *
 * Shared utilities used across all domain step definitions.
 */

// ============================================
// CONFIGURATION
// ============================================

export const acceptHeader = {
  key: 'Accept',
  value: 'application/json',
};

export const contentTypeHeader = {
  key: 'content-type',
  value: 'application/json; charset=utf-8',
};

// Parse extra headers from environment variables
export const extraHeaders = parseExtraHeaders(
  process.env.EXTRA_HEADERS_JSON,
  process.env.EXTRA_HEADERS
);

// Add auth token if provided
const dciAuthToken = process.env.DCI_AUTH_TOKEN;
if (dciAuthToken && !extraHeaders.some(h => String(h?.key || '').toLowerCase() === 'authorization')) {
  const value = String(dciAuthToken).startsWith('Bearer ') ? String(dciAuthToken) : `Bearer ${dciAuthToken}`;
  extraHeaders.push({ key: 'Authorization', value });
}

// ============================================
// HEADER UTILITIES
// ============================================

/**
 * Parse extra headers from JSON or string format
 */
function parseExtraHeaders(extraHeadersJson, extraHeadersString) {
  if (extraHeadersJson) {
    try {
      const parsed = JSON.parse(extraHeadersJson);
      if (Array.isArray(parsed)) {
        return parsed
          .filter(h => h && typeof h.key === 'string')
          .map(h => ({ key: h.key, value: String(h.value ?? '') }));
      }
      if (parsed && typeof parsed === 'object') {
        return Object.entries(parsed).map(([key, value]) => ({
          key,
          value: String(value ?? ''),
        }));
      }
    } catch {
      // fall through to string parsing
    }
  }

  if (!extraHeadersString) return [];
  return extraHeadersString
    .split(';')
    .map(s => s.trim())
    .filter(Boolean)
    .map(pair => {
      const idx = pair.indexOf(':');
      if (idx <= 0) return null;
      return { key: pair.slice(0, idx).trim(), value: pair.slice(idx + 1).trim() };
    })
    .filter(Boolean);
}

/**
 * Check if a header exists (case-insensitive)
 */
export function hasHeader(rawHeaders, headerName) {
  if (!Array.isArray(rawHeaders)) return false;
  const lowerName = headerName.toLowerCase();
  for (let i = 0; i < rawHeaders.length; i += 2) {
    if (typeof rawHeaders[i] === 'string' && rawHeaders[i].toLowerCase() === lowerName) {
      return true;
    }
  }
  return false;
}

/**
 * Get header value (case-insensitive)
 */
export function getHeaderValue(rawHeaders, headerName) {
  if (!Array.isArray(rawHeaders)) return null;
  const lowerName = headerName.toLowerCase();
  for (let i = 0; i < rawHeaders.length - 1; i += 2) {
    if (typeof rawHeaders[i] === 'string' && rawHeaders[i].toLowerCase() === lowerName) {
      return rawHeaders[i + 1];
    }
  }
  return null;
}

/**
 * Apply common headers to a pactum spec object
 */
export function applyCommonHeaders(spec, options = {}) {
  const omit = new Set((options.omitHeaders || []).map(h => String(h).toLowerCase()));
  spec.withHeaders(acceptHeader.key, acceptHeader.value);
  spec.withHeaders(contentTypeHeader.key, contentTypeHeader.value);
  for (const header of extraHeaders) {
    if (omit.has(String(header?.key || '').toLowerCase())) continue;
    spec.withHeaders(header.key, header.value);
  }
  return spec;
}

/**
 * Compute the request path for OpenAPI validation
 */
export function getRequestPath(endpointOrUrl, baseUrl = process.env.API_BASE_URL || 'http://127.0.0.1:3333/') {
  const raw = String(endpointOrUrl || '').trim();
  if (!raw) return '/';

  const base = String(baseUrl || '').endsWith('/') ? String(baseUrl) : `${String(baseUrl)}/`;

  try {
    return new URL(raw).pathname;
  } catch {
    try {
      return new URL(raw, base).pathname;
    } catch {
      return raw.startsWith('/') ? raw : `/${raw}`;
    }
  }
}

/**
 * Validate a response header value
 */
export function checkHeader(rawHeaders, headerName, expectedValue) {
  const actualValue = getHeaderValue(rawHeaders, headerName);
  if (actualValue == null) {
    return { ok: false, actualValue: null, reason: 'missing' };
  }

  if (expectedValue == null || expectedValue === '') {
    return { ok: true, actualValue };
  }

  const expected = String(expectedValue).trim();
  const actual = String(actualValue).trim();
  const headerLower = headerName.toLowerCase();

  if (headerLower === 'content-type') {
    const expectedHasParams = expected.includes(';');
    if (!expectedHasParams) {
      const actualMediaType = actual.split(';')[0].trim().toLowerCase();
      const expectedMediaType = expected.split(';')[0].trim().toLowerCase();
      return { ok: actualMediaType === expectedMediaType, actualValue };
    }
    return { ok: actual.toLowerCase() === expected.toLowerCase(), actualValue };
  }

  return { ok: actual.toLowerCase() === expected.toLowerCase(), actualValue };
}

/**
 * Get default response time threshold
 */
export function getResponseTimeThreshold() {
  return Number(process.env.RESPONSE_TIME_THRESHOLD_MS) || 15000;
}

/**
 * Get callback wait timeout
 */
export function getCallbackWaitMs() {
  const raw = process.env.CALLBACK_WAIT_MS;
  const parsed = raw ? Number(raw) : NaN;
  if (!Number.isFinite(parsed) || parsed <= 0) return 120000;
  return parsed;
}

/**
 * Extract ACK status from response body
 */
export function getAckStatus(body) {
  return body?.message?.ack_status;
}

/**
 * Extract correlation ID from ACK response
 */
export function getAckCorrelationId(body) {
  return body?.message?.correlation_id;
}
