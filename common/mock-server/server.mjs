/**
 * SPDCI Mock Registry Server
 *
 * Domain-agnostic mock server for client compliance testing.
 * Validates incoming requests against OpenAPI specs and records them for assertions.
 *
 * Features:
 * - OpenAPI request validation (domain-configurable)
 * - Request recording with timestamps
 * - Configurable response behaviors (success, error, delay)
 * - Async callback support
 * - Admin API for test control
 *
 * Admin API:
 * - GET  /admin/healthcheck        - Health check
 * - GET  /admin/requests           - Get all recorded requests
 * - GET  /admin/requests/:endpoint - Get requests for specific endpoint
 * - DELETE /admin/requests         - Clear recordings
 * - POST /admin/config             - Configure response behaviors
 * - GET  /admin/config             - Get current configuration
 * - POST /admin/reset              - Reset to defaults
 * - POST /admin/trigger-callback   - Manually trigger a callback
 */

import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import SwaggerParser from '@apidevtools/swagger-parser';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================
// CONFIGURATION
// ============================================

const port = Number(process.env.PORT || 3335);
const domain = process.env.DOMAIN || 'social';

const specFiles = {
  social: 'social_api_v1.0.0.yaml',
  crvs: 'crvs_api_v1.0.0.yaml',
  dr: 'dr_api_v1.0.0.yaml',
  fr: 'fr_api_v1.0.0.yaml',
  ibr: 'ibr_api_v1.0.0.yaml',
};

const specPath = process.env.OPENAPI_SPEC_PATH ||
  path.resolve(__dirname, `../../spec/${specFiles[domain] || specFiles.social}`);

// Domain-specific record types
const domainRecordTypes = {
  social: 'Person',
  crvs: 'CRVSPerson',
  fr: 'Farmer',
  dr: 'DisasterRecord',
  ibr: 'IBRRecord',
};

const domainRegistryTypes = {
  social: 'ns:org:RegistryType:Social',
  crvs: 'ns:org:RegistryType:CRVS',
  fr: 'ns:org:RegistryType:FR',
  dr: 'ns:org:RegistryType:DR',
  ibr: 'ns:org:RegistryType:IBR',
};

// Response configuration
let responseConfig = {
  defaultDelay: 0,
  callbackDelay: 20,
  endpoints: {},
  callbacks: {
    enabled: true,
    failRate: 0,
  },
};

// Request recordings
const recordings = {
  requests: [],
  maxRecordings: 1000,
};

// OpenAPI validator cache
let openApiCache = null;

// ============================================
// UTILITY FUNCTIONS
// ============================================

function nowIso() {
  return new Date().toISOString();
}

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function json(res, statusCode, body) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body, null, 2));
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.setEncoding('utf8');
    req.on('data', chunk => (data += chunk));
    req.on('end', () => {
      if (!data) return resolve(null);
      try {
        resolve(JSON.parse(data));
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// OPENAPI VALIDATION
// ============================================

async function loadOpenApi() {
  if (openApiCache) return openApiCache;

  try {
    const openApi = await SwaggerParser.dereference(specPath);
    const ajv = new Ajv({
      allErrors: true,
      strict: false,
      validateFormats: true,
      allowUnionTypes: true,
    });
    addFormats(ajv);

    openApiCache = { openApi, ajv, validators: new Map() };
    console.log(`[mock-server] Loaded OpenAPI spec: ${openApi.info.title} v${openApi.info.version}`);
    return openApiCache;
  } catch (e) {
    console.error(`[mock-server] Failed to load OpenAPI spec from ${specPath}:`, e.message);
    return null;
  }
}

function getRequestSchema(openApi, path, method) {
  const pathItem = openApi.paths?.[path];
  if (!pathItem) return null;
  const operation = pathItem[method.toLowerCase()];
  if (!operation) return null;
  return operation?.requestBody?.content?.['application/json']?.schema || null;
}

/**
 * Check if query structure is valid based on query_type (for filtering false-positive oneOf errors)
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
 * Filter out known false-positive validation errors from ambiguous oneOf schemas
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

async function validateRequest(path, method, body) {
  const cache = await loadOpenApi();
  if (!cache) {
    return { valid: true, errors: [], warning: 'OpenAPI spec not loaded' };
  }

  const { openApi, ajv, validators } = cache;
  const schema = getRequestSchema(openApi, path, method);

  if (!schema) {
    return { valid: true, errors: [], warning: `No schema found for ${method} ${path}` };
  }

  const cacheKey = `${method}:${path}`;
  let validate = validators.get(cacheKey);
  if (!validate) {
    validate = ajv.compile(schema);
    validators.set(cacheKey, validate);
  }

  const rawValid = validate(body);
  let errors = rawValid ? [] : validate.errors.map(e => ({
    path: e.instancePath || '(root)',
    message: e.message,
    keyword: e.keyword,
  }));

  errors = filterAmbiguousOneOfErrors(errors, body);
  const valid = errors.length === 0;

  return { valid, errors };
}

// ============================================
// REQUEST RECORDING
// ============================================

function recordRequest(endpoint, method, headers, body, validation) {
  const record = {
    id: generateId(),
    timestamp: nowIso(),
    endpoint,
    method,
    headers: Object.fromEntries(
      Object.entries(headers).filter(([k]) =>
        ['content-type', 'authorization', 'x-correlation-id'].includes(k.toLowerCase())
      )
    ),
    body,
    validation,
    transactionId: body?.message?.transaction_id,
    action: body?.header?.action,
    senderId: body?.header?.sender_id,
    senderUri: body?.header?.sender_uri,
  };

  recordings.requests.push(record);

  if (recordings.requests.length > recordings.maxRecordings) {
    recordings.requests = recordings.requests.slice(-recordings.maxRecordings);
  }

  return record;
}

function getRecordings(endpoint = null) {
  if (!endpoint) return recordings.requests;
  return recordings.requests.filter(r => r.endpoint === endpoint);
}

function clearRecordings() {
  const count = recordings.requests.length;
  recordings.requests = [];
  return count;
}

// ============================================
// RESPONSE BUILDERS
// ============================================

function ackResponse(correlationId) {
  return {
    message: {
      ack_status: 'ACK',
      timestamp: nowIso(),
      correlation_id: correlationId,
    },
  };
}

function errResponse(correlationId, code, message) {
  return {
    message: {
      ack_status: 'ERR',
      timestamp: nowIso(),
      correlation_id: correlationId,
      error: { code, message },
    },
  };
}

function callbackHeader(action, { senderId, receiverId, status = 'succ' } = {}) {
  return {
    version: '1.0.0',
    message_id: generateId(),
    message_ts: nowIso(),
    action,
    status,
    total_count: 1,
    completed_count: 1,
    sender_id: senderId || 'mock-registry',
    receiver_id: receiverId || 'spmis-client',
  };
}

function searchResponseMessage({ transactionId, correlationId }) {
  return {
    transaction_id: transactionId,
    correlation_id: correlationId,
    search_response: [
      {
        reference_id: `ref-${generateId()}`,
        timestamp: nowIso(),
        status: 'succ',
        data: {
          version: '1.0.0',
          reg_type: domainRegistryTypes[domain] || domainRegistryTypes.social,
          reg_record_type: domainRecordTypes[domain] || domainRecordTypes.social,
          reg_records: [],
        },
      },
    ],
  };
}

function txnStatusResponseMessage({ transactionId, correlationId }) {
  return {
    transaction_id: transactionId,
    correlation_id: correlationId,
    txnstatus_response: {
      txn_type: 'search',
      txn_status: {
        transaction_id: transactionId,
        correlation_id: correlationId,
        search_response: [],
      },
    },
  };
}

function subscribeResponseMessage({ transactionId, correlationId }) {
  return {
    transaction_id: transactionId,
    correlation_id: correlationId,
    subscribe_response: [
      {
        reference_id: `ref-${generateId()}`,
        timestamp: nowIso(),
        status: 'succ',
        subscriptions: [
          { code: `sub-${generateId()}`, status: 'subscribe', timestamp: nowIso() },
        ],
      },
    ],
  };
}

function unsubscribeResponseMessage({ transactionId, correlationId }) {
  return {
    transaction_id: transactionId,
    correlation_id: correlationId,
    timestamp: nowIso(),
    status: 'succ',
    subscription_status: [{ code: 'sub-test-001', status: 'unsubscribe' }],
  };
}

// ============================================
// CALLBACK HANDLING
// ============================================

async function postJson(url, body) {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    console.log(`[mock-server] Callback to ${url}: ${response.status}`);
    return { success: true, status: response.status };
  } catch (e) {
    console.error(`[mock-server] Callback failed to ${url}:`, e?.message || e);
    return { success: false, error: e?.message };
  }
}

async function scheduleCallback(senderUri, payload, recordId) {
  if (!senderUri) return;
  if (!responseConfig.callbacks.enabled) return;

  if (responseConfig.callbacks.failRate > 0) {
    if (Math.random() * 100 < responseConfig.callbacks.failRate) {
      console.log(`[mock-server] Simulating callback failure`);
      return;
    }
  }

  setTimeout(async () => {
    const result = await postJson(senderUri, payload);
    const record = recordings.requests.find(r => r.id === recordId);
    if (record) {
      record.callback = { sentAt: nowIso(), url: senderUri, ...result };
    }
  }, responseConfig.callbackDelay);
}

// ============================================
// ADMIN API HANDLERS
// ============================================

async function handleAdmin(req, res, urlPath) {
  if (req.method === 'GET' && urlPath === '/admin/healthcheck') {
    const cache = await loadOpenApi();
    json(res, 200, {
      status: 'ok',
      domain,
      openApiLoaded: !!cache,
      recordingsCount: recordings.requests.length,
    });
    return true;
  }

  if (req.method === 'GET' && urlPath === '/admin/requests') {
    json(res, 200, { count: recordings.requests.length, requests: recordings.requests });
    return true;
  }

  if (req.method === 'GET' && urlPath.startsWith('/admin/requests/')) {
    const endpoint = '/' + decodeURIComponent(urlPath.slice('/admin/requests/'.length));
    const filtered = getRecordings(endpoint);
    json(res, 200, { endpoint, count: filtered.length, requests: filtered });
    return true;
  }

  if (req.method === 'DELETE' && urlPath === '/admin/requests') {
    json(res, 200, { cleared: clearRecordings() });
    return true;
  }

  if (req.method === 'GET' && urlPath === '/admin/config') {
    json(res, 200, responseConfig);
    return true;
  }

  if (req.method === 'POST' && urlPath === '/admin/config') {
    const body = await readJson(req);
    responseConfig = { ...responseConfig, ...body };
    json(res, 200, { updated: true, config: responseConfig });
    return true;
  }

  if (req.method === 'POST' && urlPath === '/admin/reset') {
    clearRecordings();
    responseConfig = {
      defaultDelay: 0,
      callbackDelay: 20,
      endpoints: {},
      callbacks: { enabled: true, failRate: 0 },
    };
    json(res, 200, { reset: true });
    return true;
  }

  if (req.method === 'POST' && urlPath === '/admin/trigger-callback') {
    const body = await readJson(req);
    if (!body?.url || !body?.payload) {
      json(res, 400, { error: 'Missing url or payload' });
      return true;
    }
    const result = await postJson(body.url, body.payload);
    json(res, 200, result);
    return true;
  }

  return false;
}

// ============================================
// REGISTRY API HANDLERS
// ============================================

async function handleRegistryEndpoint(req, res, urlPath, body) {
  const correlationId = generateId();
  const transactionId = body?.message?.transaction_id || generateId();
  const senderUri = body?.header?.sender_uri;
  const senderId = body?.header?.receiver_id || 'mock-registry';
  const receiverId = body?.header?.sender_id || 'spmis-client';

  const validation = await validateRequest(urlPath, 'POST', body);
  const record = recordRequest(urlPath, 'POST', req.headers, body, validation);

  const endpointConfig = responseConfig.endpoints[urlPath] || {};
  const delay = endpointConfig.delay ?? responseConfig.defaultDelay;
  if (delay > 0) await sleep(delay);

  if (!validation.valid && endpointConfig.strictValidation) {
    json(res, 200, errResponse(correlationId, 'err.request.invalid', 'Validation failed'));
    return;
  }

  if (endpointConfig.status === 'error') {
    json(res, 200, errResponse(correlationId, endpointConfig.errorCode || 'err.server', endpointConfig.errorMessage || 'Configured error'));
    return;
  }

  if (!body?.header) {
    json(res, 200, errResponse(correlationId, 'err.request.bad', 'Missing header'));
    return;
  }

  if (!body?.message) {
    json(res, 200, errResponse(correlationId, 'err.request.bad', 'Missing message'));
    return;
  }

  // Async endpoints
  if (urlPath === '/registry/search') {
    json(res, 202, ackResponse(correlationId));
    scheduleCallback(senderUri, {
      signature: 'unsigned-mock',
      header: callbackHeader('on-search', { senderId, receiverId }),
      message: searchResponseMessage({ transactionId, correlationId }),
    }, record.id);
    return;
  }

  if (urlPath === '/registry/subscribe') {
    json(res, 202, ackResponse(correlationId));
    scheduleCallback(senderUri, {
      signature: 'unsigned-mock',
      header: callbackHeader('on-subscribe', { senderId, receiverId }),
      message: subscribeResponseMessage({ transactionId, correlationId }),
    }, record.id);
    return;
  }

  if (urlPath === '/registry/unsubscribe') {
    json(res, 202, ackResponse(correlationId));
    scheduleCallback(senderUri, {
      signature: 'unsigned-mock',
      header: callbackHeader('on-unsubscribe', { senderId, receiverId }),
      message: unsubscribeResponseMessage({ transactionId, correlationId }),
    }, record.id);
    return;
  }

  if (urlPath === '/registry/txn/status') {
    json(res, 202, ackResponse(correlationId));
    scheduleCallback(senderUri, {
      signature: 'unsigned-mock',
      header: callbackHeader('txn-on-status', { senderId, receiverId }),
      message: txnStatusResponseMessage({ transactionId, correlationId }),
    }, record.id);
    return;
  }

  // Sync endpoints
  if (urlPath === '/registry/sync/search') {
    json(res, 200, {
      signature: 'unsigned-mock',
      header: callbackHeader('on-search', { senderId, receiverId }),
      message: searchResponseMessage({ transactionId, correlationId }),
    });
    return;
  }

  if (urlPath === '/registry/sync/txn/status') {
    json(res, 200, {
      signature: 'unsigned-mock',
      header: callbackHeader('txn-on-status', { senderId, receiverId }),
      message: txnStatusResponseMessage({ transactionId, correlationId }),
    });
    return;
  }

  res.statusCode = 404;
  res.end();
}

// ============================================
// MAIN SERVER
// ============================================

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const urlPath = url.pathname.replace(/\/+$/g, '') || '/';

  console.log(`[mock-server] ${req.method} ${urlPath}`);

  if (urlPath.startsWith('/admin')) {
    const handled = await handleAdmin(req, res, urlPath);
    if (handled) return;
  }

  if (req.method === 'GET' && urlPath === '/healthcheck') {
    json(res, 200, { status: 'ok' });
    return;
  }

  if (req.method !== 'POST') {
    res.statusCode = 404;
    res.end();
    return;
  }

  let body;
  try {
    body = await readJson(req);
  } catch {
    json(res, 400, { error: 'Invalid JSON' });
    return;
  }

  await handleRegistryEndpoint(req, res, urlPath, body);
});

async function start() {
  await loadOpenApi();
  server.listen(port, '0.0.0.0', () => {
    console.log(`[mock-server] Mock ${domain} registry on :${port}`);
    console.log(`[mock-server] Admin API: http://localhost:${port}/admin/`);
  });
}

start();
