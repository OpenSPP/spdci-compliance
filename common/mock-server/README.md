# SPDCI Mock Registry Server

Domain-agnostic mock server for testing SPMIS client compliance against SPDCI registry APIs.

## Features

- **OpenAPI Validation**: Validates incoming requests against the configured domain spec
- **Request Recording**: Records all requests with timestamps, headers, and validation results
- **Configurable Responses**: Configure success/error responses, delays, callback behavior
- **Admin API**: REST API for test control and assertions
- **Async Callbacks**: Sends callbacks to client's sender_uri for async workflows

## Quick Start

```bash
# Start mock server for Social Registry
DOMAIN=social node common/mock-server/server.mjs

# Start for a different domain
DOMAIN=crvs node common/mock-server/server.mjs
```

Default port: 3335 (configurable via `PORT` env var)

## Admin API

### Health Check
```bash
GET /admin/healthcheck
```

### Get Recordings
```bash
GET /admin/requests           # All recordings
GET /admin/requests/registry%2Fsearch  # Filter by endpoint
```

### Clear Recordings
```bash
DELETE /admin/requests
```

### Configure Responses
```bash
POST /admin/config
{
  "defaultDelay": 100,
  "endpoints": {
    "/registry/search": {
      "status": "error",
      "errorCode": "err.test",
      "errorMessage": "Test error"
    }
  },
  "callbacks": {
    "enabled": true,
    "failRate": 10
  }
}
```

### Reset to Defaults
```bash
POST /admin/reset
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3335 | Server port |
| `DOMAIN` | social | Domain to load spec for |
| `OPENAPI_SPEC_PATH` | Auto | Path to OpenAPI spec |

## Recording Structure

Each recorded request contains:

```json
{
  "id": "1234567890-abc123",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "endpoint": "/registry/search",
  "method": "POST",
  "headers": {
    "content-type": "application/json",
    "authorization": "Bearer token..."
  },
  "body": { ... },
  "validation": {
    "valid": true,
    "errors": []
  },
  "transactionId": "txn-123",
  "action": "search",
  "senderId": "spmis-client",
  "senderUri": "http://client:8080/callback",
  "callback": {
    "sentAt": "2024-01-15T10:30:00.050Z",
    "url": "http://client:8080/callback",
    "success": true,
    "status": 200
  }
}
```

## Client Testing Flow

1. Start the mock server
2. Configure your SPMIS client to use `http://localhost:3335` as registry URL
3. Trigger client actions (search, subscribe, etc.)
4. Use admin API to verify recorded requests
5. Assert requests pass validation and have correct structure
