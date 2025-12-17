/**
 * Social Registry Helpers Index
 *
 * Re-exports utilities from common helpers and domain-specific helpers.
 * Step definitions should import from this index for consistency.
 */

// Re-export common utilities
export {
  generateId,
  getTimestamp,
  createHeader,
  createEnvelope,
  createAckResponse,
  createErrResponse,
  extractRequestInfo,
} from '../../../../../common/helpers/envelope.js';

export {
  applyCommonHeaders,
  checkHeader,
  validateRequiredHeaders,
  getHeaderValue,
} from '../../../../../common/helpers/headers.js';

export {
  assertOpenApiRequest,
  assertOpenApiResponse,
  getOpenApiSpec,
} from '../../../../../common/helpers/openapi-validator.js';

export {
  startCallbackServer,
  stopCallbackServer,
  getCallbackUrl,
  getCallbacks,
  getCallbacksByAction,
  getLastCallback,
  clearCallbacks,
  waitForCallback,
  waitForCallbackAction,
} from '../../../../../common/helpers/callback-server.js';

// Re-export domain-specific helpers (endpoints, payloads, schemas)
export * from './helpers.js';
