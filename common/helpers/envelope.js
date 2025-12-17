/**
 * SPDCI Message Envelope Builder
 *
 * All SPDCI APIs share the same envelope structure:
 * - signature (optional)
 * - header (MsgHeader)
 * - message (domain-specific payload)
 */

export function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getTimestamp() {
  return new Date().toISOString();
}

/**
 * Create a standard SPDCI message header
 */
export function createHeader(action, options = {}) {
  const {
    senderId = process.env.SENDER_ID || 'test-client',
    receiverId = process.env.RECEIVER_ID || 'registry-server',
    version = '1.0.0',
    totalCount = 1,
    isCallback = false,
    status = 'succ',
    senderUri = null,
  } = options;

  const header = {
    version,
    message_id: generateId(),
    message_ts: getTimestamp(),
    action,
    sender_id: senderId,
    receiver_id: receiverId,
    total_count: totalCount,
  };

  // Async requests need sender_uri for callbacks
  if (senderUri) {
    header.sender_uri = senderUri;
  }

  // Callback headers include status
  if (isCallback) {
    header.status = status;
    header.completed_count = totalCount;
  }

  return header;
}

/**
 * Create a complete SPDCI message envelope
 */
export function createEnvelope(action, message, options = {}) {
  const { signature = 'unsigned', headerOptions = {} } = options;

  return {
    signature,
    header: createHeader(action, headerOptions),
    message,
  };
}

/**
 * Create an ACK response
 */
export function createAckResponse(correlationId) {
  return {
    message: {
      ack_status: 'ACK',
      timestamp: getTimestamp(),
      correlation_id: correlationId,
    },
  };
}

/**
 * Create an ERR response
 */
export function createErrResponse(correlationId, errorCode, errorMessage) {
  return {
    message: {
      ack_status: 'ERR',
      timestamp: getTimestamp(),
      correlation_id: correlationId,
      error: {
        code: errorCode,
        message: errorMessage,
      },
    },
  };
}

/**
 * Extract common fields from a request body
 */
export function extractRequestInfo(body) {
  return {
    action: body?.header?.action,
    senderId: body?.header?.sender_id,
    receiverId: body?.header?.receiver_id,
    senderUri: body?.header?.sender_uri,
    transactionId: body?.message?.transaction_id,
    messageId: body?.header?.message_id,
  };
}
