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
  // Note: applyCommonHeaders is exported from ./helpers.js instead
  // The SR-specific version supports extraHeaders and DCI_AUTH_TOKEN
  validateRequiredHeaders,
} from '../../../../../common/helpers/headers.js';

export {
  assertOpenApiRequest,
  assertOpenApiResponse,
  assertOpenApiComponentResponse,
  assertHttpErrorResponse,
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
