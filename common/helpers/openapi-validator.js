/**
 * OpenAPI Validation Utilities for SPDCI Compliance Testing
 *
 * Provides request/response validation against OpenAPI specs.
 * Includes workarounds for known spec ambiguities.
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import SwaggerParser from '@apidevtools/swagger-parser';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let cached = null;

/**
 * Get the spec path for a domain
 */
function getSpecPath(domain) {
  const specFiles = {
    social: 'social_api_v1.0.0.yaml',
    crvs: 'crvs_api_v1.0.0.yaml',
    dr: 'dr_api_v1.0.0.yaml',
    fr: 'fr_api_v1.0.0.yaml',
    ibr: 'ibr_api_v1.0.0.yaml',
  };

  const specFile = specFiles[domain] || specFiles.social;
  return process.env.OPENAPI_SPEC_PATH || path.resolve(__dirname, `../../spec/${specFile}`);
}

/**
 * Load and cache OpenAPI spec
 */
async function loadOpenApi(domain = process.env.DOMAIN || 'social') {
  const specPath = getSpecPath(domain);
  const cacheKey = specPath;

  if (cached?.cacheKey === cacheKey) return cached;

  const openApi = await SwaggerParser.dereference(specPath);
  const ajv = new Ajv({
    allErrors: true,
    strict: false,
    validateFormats: true,
    allowUnionTypes: true,
  });
  addFormats(ajv);

  cached = {
    cacheKey,
    specPath,
    openApi,
    ajv,
    validators: new Map(),
  };

  return cached;
}

function normalizeMethod(method) {
  const m = String(method || '').toLowerCase();
  if (!m) throw new Error('OpenAPI validation requires an HTTP method');
  return m;
}

function normalizePath(p) {
  const s = String(p || '');
  if (!s) throw new Error('OpenAPI validation requires a path');
  return s.startsWith('/') ? s : `/${s}`;
}

function resolveSpecPath(openApi, opPath) {
  let p = normalizePath(opPath);
  const paths = openApi.paths || {};

  if (paths[p]) return p;

  // Match spec paths as suffixes for implementations with base paths
  const candidates = Object.keys(paths).filter(specPath => p.endsWith(specPath));
  if (candidates.length === 0) {
    throw new Error(`OpenAPI: unknown path "${p}"`);
  }

  candidates.sort((a, b) => b.length - a.length);
  return candidates[0];
}

function getOperation(openApi, opPath, method) {
  const p = resolveSpecPath(openApi, opPath);
  const m = normalizeMethod(method);
  const op = openApi.paths?.[p]?.[m];
  if (!op) {
    throw new Error(`OpenAPI: path "${p}" has no "${m.toUpperCase()}" operation`);
  }
  return op;
}

function getJsonSchemaFromRequest(op) {
  return op?.requestBody?.content?.['application/json']?.schema || null;
}

function getJsonSchemaFromResponse(op, statusCode) {
  const responses = op?.responses || {};
  const chosen = responses[String(statusCode)] || responses.default || null;
  return chosen?.content?.['application/json']?.schema || null;
}

async function getValidator(params) {
  const { openApi, ajv, validators } = await loadOpenApi(params.domain);
  const resolvedPath = resolveSpecPath(openApi, params.path);
  const key = `${params.direction}:${params.method}:${resolvedPath}:${params.statusCode ?? ''}`;

  const existing = validators.get(key);
  if (existing) return { validate: existing, ajv };

  const op = getOperation(openApi, resolvedPath, params.method);
  const schema = params.direction === 'request'
    ? getJsonSchemaFromRequest(op)
    : getJsonSchemaFromResponse(op, params.statusCode);

  if (!schema) {
    throw new Error(`OpenAPI: missing schema for ${params.direction} ${params.method.toUpperCase()} ${resolvedPath}`);
  }

  const validate = ajv.compile(schema);
  validators.set(key, validate);
  return { validate, ajv };
}

function formatAjvErrors(errors) {
  if (!errors || errors.length === 0) return '';
  return errors.map(e => `${e.instancePath || '(root)'}: ${e.message || 'invalid'}`).join('\n');
}

/**
 * Check if a search request has valid query structure based on its query_type.
 * Used to filter false-positive oneOf errors from ambiguous spec schemas.
 */
function isQueryStructureValidForType(body) {
  const searchRequest = body?.message?.search_request;
  if (!Array.isArray(searchRequest)) return false;

  for (const req of searchRequest) {
    const queryType = req?.search_criteria?.query_type;
    const query = req?.search_criteria?.query;

    if (queryType === 'expression' && query?.type && query?.value) return true;
    if (queryType === 'predicate' && Array.isArray(query)) return true;
    if (queryType === 'idtype-value' && query?.type && query?.value !== undefined) return true;
  }
  return false;
}

/**
 * Filter out known false-positive validation errors caused by ambiguous oneOf schemas.
 *
 * FIXME: TEMPORARY WORKAROUND FOR SPDCI SPEC AMBIGUITY
 * =====================================================
 * This function works around an issue in SPDCI OpenAPI specs (v1.0.0) where the
 * `oneOf` schemas for the search query field overlap, causing AJV validation to
 * fail even for correctly structured requests.
 *
 * PROBLEM: The spec defines `query` as oneOf [IdTypeValue, Expression, Predicate]
 * but these schemas share common properties (like `type`, `value`), causing AJV
 * to report "must match exactly one schema in oneOf" errors for valid payloads.
 *
 * WORKAROUND: We use `query_type` as a discriminator to determine which schema
 * the request intends to use, then filter out oneOf errors if the payload
 * structurally matches the intended schema.
 *
 * REMOVAL CRITERIA: This workaround should be removed when either:
 * 1. SPDCI spec adds a proper discriminator to the query oneOf schema
 * 2. SPDCI spec changes oneOf to anyOf for the query field
 * 3. SPDCI spec restructures query schemas to be mutually exclusive
 *
 * Affected specs: social_api_v1.0.0.yaml, fr_api_v1.0.0.yaml, crvs_api_v1.0.0.yaml
 * Related: SPEC_ISSUES_REPORT.md documents this and other spec issues
 *
 * @param {Array} errors - AJV validation errors
 * @param {object} body - Request body being validated
 * @returns {Array} Filtered errors with false positives removed
 */
function filterAmbiguousOneOfErrors(errors, body) {
  if (!errors || errors.length === 0) return errors;

  const queryIsValid = isQueryStructureValidForType(body);

  return errors.filter(err => {
    if (err.keyword === 'oneOf' && err.instancePath?.includes('/query')) {
      if (queryIsValid) return false;
    }

    if (queryIsValid) {
      if (err.keyword === 'oneOf' && err.instancePath === '/message') return false;
      if (err.keyword === 'required' && err.instancePath === '/message') {
        const encryptedMsgProps = ['header', 'ciphertext', 'encrypted_key', 'tag', 'iv'];
        if (encryptedMsgProps.includes(err.params?.missingProperty)) return false;
      }
    }

    return true;
  });
}

/**
 * Validate a request body against OpenAPI spec
 */
export async function assertOpenApiRequest({ path: opPath, method, domain }, body) {
  const { validate, ajv } = await getValidator({ path: opPath, method, direction: 'request', domain });
  const rawOk = validate(body);

  if (!rawOk) {
    const filteredErrors = filterAmbiguousOneOfErrors(validate.errors, body);
    if (filteredErrors.length > 0) {
      const details = formatAjvErrors(filteredErrors);
      throw new Error(`OpenAPI request validation failed for ${method.toUpperCase()} ${normalizePath(opPath)}\n${details}`);
    }
  }
}

/**
 * Validate a body against a named component from the OpenAPI spec.
 *
 * Looks for the component in the following locations (in order):
 * 1. components/schemas/{componentName} - direct schema definition
 * 2. components/responses/{componentName} - response definition (extracts schema from content)
 */
export async function assertOpenApiComponentResponse(componentName, body, domain) {
  const { openApi, ajv, validators } = await loadOpenApi(domain);
  const key = `component:${componentName}`;

  let validate = validators.get(key);
  if (!validate) {
    // First try components/schemas
    let schema = openApi.components?.schemas?.[componentName];

    // If not found, try components/responses and extract the schema
    if (!schema) {
      const response = openApi.components?.responses?.[componentName];
      if (response) {
        schema = response.content?.['application/json']?.schema;
      }
    }

    if (!schema) {
      throw new Error(`OpenAPI: component "${componentName}" not found in schemas or responses`);
    }
    validate = ajv.compile(schema);
    validators.set(key, validate);
  }

  const ok = validate(body);
  if (!ok) {
    const details = formatAjvErrors(validate.errors);
    throw new Error(`OpenAPI component validation failed for "${componentName}"\n${details}`);
  }
}

/**
 * Validate that a body represents a valid HTTP error response.
 *
 * INTEROPERABILITY NOTE: This function accepts multiple error formats to accommodate
 * different implementation approaches. The SPDCI spec primarily defines the DCI error
 * envelope format, but implementations may use other standard formats for HTTP 4xx errors.
 *
 * Accepted formats (in priority order):
 *
 * 1. DCI Error Envelope (SPDCI-native):
 *    { message: { ack_status: "ERR", error: { code: "err.request.bad", message: "..." } } }
 *
 * 2. RFC 7807 Problem Details (HTTP standard):
 *    { type: "...", title: "...", status: 400, detail: "..." }
 *
 * 3. Simple error object (common fallback):
 *    { error: "...", code: "...", message: "..." }
 *
 * For strict SPDCI compliance, implementations SHOULD use format #1.
 * Formats #2 and #3 are accepted for interoperability with HTTP frameworks.
 */
export async function assertHttpErrorResponse(body) {
  if (!body || typeof body !== 'object') {
    throw new Error('HTTP error response body must be an object');
  }

  // Priority 1: DCI error envelope format (SPDCI-native, preferred)
  if (body.message?.error || body.message?.ack_status === 'ERR') {
    return;
  }

  // Priority 2: RFC 7807 Problem Details format (HTTP standard)
  if (body.type || body.title || body.status || body.detail) {
    return;
  }

  // Priority 3: Simple error object (common fallback)
  if (body.error || body.code || body.message) {
    return;
  }

  throw new Error('HTTP error response does not match expected error format');
}

/**
 * Validate a response body against OpenAPI spec
 */
export async function assertOpenApiResponse({ path: opPath, method, statusCode, domain }, body) {
  const { validate, ajv } = await getValidator({
    path: opPath,
    method,
    direction: 'response',
    statusCode,
    domain,
  });

  const ok = validate(body);
  if (!ok) {
    const details = formatAjvErrors(validate.errors);
    throw new Error(`OpenAPI response validation failed for ${method.toUpperCase()} ${normalizePath(opPath)} (${statusCode})\n${details}`);
  }
}

/**
 * Get the loaded OpenAPI spec (for introspection)
 */
export async function getOpenApiSpec(domain) {
  const { openApi } = await loadOpenApi(domain);
  return openApi;
}
