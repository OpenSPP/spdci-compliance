import path from 'node:path';
import { fileURLToPath } from 'node:url';

import SwaggerParser from '@apidevtools/swagger-parser';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

let cached;

function getDefaultSpecPath() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  // Path from domains/social/features/support/helpers/ to spec/
  return path.resolve(__dirname, '../../../../../spec/social_api_v1.0.0.yaml');
}

async function loadOpenApi() {
  if (cached) return cached;

  const specPath = process.env.OPENAPI_SPEC_PATH || getDefaultSpecPath();
  const openApi = await SwaggerParser.dereference(specPath);

  const ajv = new Ajv({
    allErrors: true,
    strict: false,
    validateFormats: true,
    allowUnionTypes: true,
  });
  addFormats(ajv);

  cached = {
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

// Path segment to strip when matching against spec paths.
// E.g., if API uses /registry/social/search but spec uses /registry/search,
// set OPENAPI_PATH_STRIP="social/" to remove the "social/" segment before matching.
const pathStripSegment = process.env.OPENAPI_PATH_STRIP || '';

function resolveSpecPath(openApi, opPath) {
  let p = normalizePath(opPath);
  const paths = openApi.paths || {};

  // Apply path stripping if configured
  if (pathStripSegment && p.includes(pathStripSegment)) {
    p = p.replace(pathStripSegment, '');
    // Clean up any double slashes
    p = p.replace(/\/+/g, '/');
  }

  if (paths[p]) return p;

  // Some implementations mount the API under a base path (e.g. "/namespace/v1.0.0").
  // Accept validation input using the *full* request path by matching spec paths as suffixes.
  const candidates = Object.keys(paths).filter(specPath => p.endsWith(specPath));
  if (candidates.length === 0) {
    throw new Error(`OpenAPI: unknown path "${p}" (spec: ${openApi?.info?.title || 'unknown'})`);
  }

  candidates.sort((a, b) => b.length - a.length);
  return candidates[0];
}

function getOperation(openApi, opPath, method) {
  const p = resolveSpecPath(openApi, opPath);
  const m = normalizeMethod(method);

  const pathItem = openApi.paths?.[p];
  const op = pathItem?.[m];
  if (!op) {
    throw new Error(`OpenAPI: path "${p}" has no "${m.toUpperCase()}" operation`);
  }
  return op;
}

function getJsonSchemaFromRequest(op) {
  return op?.requestBody?.content?.['application/json']?.schema || null;
}

function getJsonSchemaFromResponse(op, statusCode) {
  const code = String(statusCode ?? '');
  const responses = op?.responses || {};

  // Prefer explicit status code, otherwise fall back to "default".
  const chosen = responses[code] || responses.default || null;
  return chosen?.content?.['application/json']?.schema || null;
}

function getCacheKey({ path: opPath, method, direction, statusCode }) {
  return `${direction}:${normalizeMethod(method)}:${normalizePath(opPath)}:${statusCode ?? ''}`;
}

async function getValidator(params) {
  const { openApi, ajv, validators } = await loadOpenApi();

  const resolvedPath = resolveSpecPath(openApi, params.path);
  const key = getCacheKey({ ...params, path: resolvedPath });
  const existing = validators.get(key);
  if (existing) return { validate: existing, ajv };

  const op = getOperation(openApi, resolvedPath, params.method);
  const schema =
    params.direction === 'request'
      ? getJsonSchemaFromRequest(op)
      : getJsonSchemaFromResponse(op, params.statusCode);

  if (!schema) {
    throw new Error(
      `OpenAPI: missing application/json schema for ${params.direction} ${params.method.toUpperCase()} ${normalizePath(params.path)}`
    );
  }

  const validate = ajv.compile(schema);
  validators.set(key, validate);
  return { validate, ajv };
}

async function getComponentResponseValidator(responseName) {
  const { openApi, ajv, validators } = await loadOpenApi();

  const key = `componentResponse:${responseName}`;
  const existing = validators.get(key);
  if (existing) return { validate: existing, ajv };

  const component = openApi?.components?.responses?.[responseName];
  const schema = component?.content?.['application/json']?.schema || null;
  if (!schema) {
    throw new Error(`OpenAPI: missing application/json schema for components.responses.${responseName}`);
  }

  const validate = ajv.compile(schema);
  validators.set(key, validate);
  return { validate, ajv };
}

function formatAjvErrors(errors) {
  if (!errors || errors.length === 0) return '';
  return errors
    .map(e => {
      const where = e.instancePath || '(root)';
      const msg = e.message || 'invalid';
      return `${where}: ${msg}`;
    })
    .join('\n');
}

/**
 * Check if a search request has valid query structure based on its query_type.
 * Returns true if the query structure matches the declared query_type.
 */
function isQueryStructureValidForType(body) {
  const searchRequest = body?.message?.search_request;
  if (!Array.isArray(searchRequest)) return false;

  for (const req of searchRequest) {
    const queryType = req?.search_criteria?.query_type;
    const query = req?.search_criteria?.query;

    // If query_type is 'expression' and query has type/value structure, this is valid
    if (queryType === 'expression' && query?.type && query?.value) {
      return true;
    }
    // If query_type is 'predicate' and query is an array, this is valid
    if (queryType === 'predicate' && Array.isArray(query)) {
      return true;
    }
    // If query_type is 'idtype-value' and query has type/value, this is valid
    if (queryType === 'idtype-value' && query?.type && query?.value !== undefined) {
      return true;
    }
  }
  return false;
}

/**
 * Filter out known false-positive validation errors caused by ambiguous oneOf schemas.
 *
 * The SPDCI spec has overlapping schemas in the query field's oneOf:
 * - Expression query: { type: string, value: object }
 * - ID-type query: { type: string, value: oneOf[string, int, number, bool, object] }
 *
 * Both schemas match when value is an object, causing "must match exactly one schema"
 * errors. Since query_type serves as the actual discriminator, we filter these out.
 *
 * Additionally, when the query oneOf fails, it causes cascading failures:
 * - SearchRequest validation fails (because query is invalid)
 * - Message oneOf fails (because SearchRequest didn't match)
 * We filter these cascading errors when the query structure is actually valid.
 */
function filterAmbiguousOneOfErrors(errors, body) {
  if (!errors || errors.length === 0) return errors;

  // Check if the query structure is valid based on query_type
  const queryIsValid = isQueryStructureValidForType(body);

  return errors.filter(err => {
    // Filter out oneOf errors for the query field
    if (err.keyword === 'oneOf' && err.instancePath?.includes('/query')) {
      if (queryIsValid) {
        return false; // Filter out this error
      }
    }

    // If query structure is valid, also filter out cascading errors from message oneOf
    if (queryIsValid) {
      // Filter out message-level oneOf error
      if (err.keyword === 'oneOf' && err.instancePath === '/message') {
        return false;
      }
      // Filter out required property errors from EncryptedMessage schema
      // (these appear because Ajv tries both schemas in the oneOf)
      if (err.keyword === 'required' && err.instancePath === '/message') {
        const encryptedMsgProps = ['header', 'ciphertext', 'encrypted_key', 'tag', 'iv'];
        if (encryptedMsgProps.includes(err.params?.missingProperty)) {
          return false;
        }
      }
    }

    return true;
  });
}

export async function assertOpenApiRequest({ path: opPath, method }, body) {
  const { validate, ajv } = await getValidator({ path: opPath, method, direction: 'request' });
  const rawOk = validate(body);
  if (!rawOk) {
    // Filter out ambiguous oneOf errors for the query field
    const filteredErrors = filterAmbiguousOneOfErrors(validate.errors, body);
    if (filteredErrors.length > 0) {
      const details = formatAjvErrors(filteredErrors) || ajv.errorsText(filteredErrors);
      throw new Error(`OpenAPI request validation failed for ${method.toUpperCase()} ${normalizePath(opPath)}\n${details}`);
    }
  }
}

export async function assertOpenApiResponse({ path: opPath, method, statusCode }, body) {
  const { validate, ajv } = await getValidator({
    path: opPath,
    method,
    direction: 'response',
    statusCode,
  });
  const ok = validate(body);
  if (!ok) {
    const details = formatAjvErrors(validate.errors) || ajv.errorsText(validate.errors);
    throw new Error(
      `OpenAPI response validation failed for ${method.toUpperCase()} ${normalizePath(opPath)} (status ${statusCode})\n${details}`
    );
  }
}

export async function assertOpenApiComponentResponse(responseName, body) {
  const { validate, ajv } = await getComponentResponseValidator(responseName);
  const ok = validate(body);
  if (!ok) {
    const details = formatAjvErrors(validate.errors) || ajv.errorsText(validate.errors);
    throw new Error(`OpenAPI component response validation failed for ${responseName}\n${details}`);
  }
}

export async function assertHttpErrorResponse(body) {
  return assertOpenApiComponentResponse('HttpErrorResponse', body);
}
