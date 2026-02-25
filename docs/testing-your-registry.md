# Testing Your Registry for SPDCI Compliance

This guide is for teams building or maintaining a registry (Social Registry, CRVS,
Farmer Registry, etc.) who want to validate that their implementation conforms to the
[SPDCI API standards](https://github.com/spdci/api-standards).

The test suite sends real HTTP requests to your running registry and checks that the
responses match the OpenAPI specification -- structure, status codes, headers, async
callback behavior, error handling, and more.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Try It with the Mock Server First](#try-it-with-the-mock-server-first)
- [What Gets Tested](#what-gets-tested)
- [Endpoints Your Registry Must Implement](#endpoints-your-registry-must-implement)
- [Message Envelope Structure](#message-envelope-structure)
- [Seeding Test Data](#seeding-test-data)
- [Running the Tests](#running-the-tests)
  - [Smoke Tests (Start Here)](#smoke-tests-start-here)
  - [Core Compliance](#core-compliance)
  - [Full Suite](#full-suite)
  - [Running Specific Test Categories](#running-specific-test-categories)
- [Configuring Authentication](#configuring-authentication)
- [Testing Async Workflows (Callbacks)](#testing-async-workflows-callbacks)
- [Reading the Test Report](#reading-the-test-report)
- [Domain-Specific Notes](#domain-specific-notes)
  - [Social Registry](#social-registry)
  - [CRVS](#crvs)
  - [Farmer Registry](#farmer-registry)
- [Environment Variable Reference](#environment-variable-reference)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

- **Node.js** >= 18
- **npm** (included with Node.js)
- Your registry running and accessible over HTTP/HTTPS

## Quick Start

```bash
# 1. Clone and install
git clone https://github.com/OpenSPP/spdci-compliance.git
cd spdci-compliance
npm install

# 2. Run smoke tests against your registry
API_BASE_URL=http://your-registry:8080 npm run test:smoke

# 3. View results
open results/report.html
```

If smoke tests pass, move on to the full domain suite:

```bash
# Social Registry
API_BASE_URL=http://your-registry:8080 npm run test:social

# CRVS
API_BASE_URL=http://your-registry:8080 npm run test:crvs

# Farmer Registry
API_BASE_URL=http://your-registry:8080 npm run test:fr
```

---

## Try It with the Mock Server First

Before connecting to a real registry, run the tests against the built-in mock server
to see what passing and failing tests look like:

```bash
# Social Registry mock
npm run test:mock:social

# CRVS mock
npm run test:mock:crvs

# Farmer Registry mock
npm run test:mock:fr
```

The mock server starts automatically, validates requests against the OpenAPI spec, and
returns spec-compliant responses. Some tests (auth, callbacks) will fail against the
mock -- this is expected. Use this to understand the test output before hooking up your
real registry.

---

## What Gets Tested

The test suite validates compliance at several levels:

| Category | What It Checks |
|----------|----------------|
| **Endpoint availability** | All required SPDCI endpoints respond |
| **Message envelope** | Requests/responses use the correct `signature` / `header` / `message` structure |
| **OpenAPI schema** | Response bodies match the OpenAPI spec (field names, types, required fields) |
| **Async workflow** | Request &rarr; ACK &rarr; Callback pattern works correctly |
| **Error handling** | Invalid requests return proper ACK/ERR responses with error codes |
| **Query types** | `idtype-value`, `expression`, and `predicate` queries are handled |
| **Security** | Authorization headers are validated; missing/invalid tokens are rejected |
| **Format** | Timestamps follow ISO 8601, locale codes follow ISO 639-3 |
| **Pagination** | Pagination parameters (`page_size`, `page_number`) are respected |
| **Boundary** | String field length limits are enforced |

---

## Endpoints Your Registry Must Implement

All SPDCI domains share the same endpoint structure. Every endpoint accepts `POST`
requests with a JSON body wrapped in the standard envelope.

### Core Endpoints (Required)

| Endpoint | Action | Description |
|----------|--------|-------------|
| `/registry/search` | `search` | Async search -- returns ACK, sends results via callback |
| `/registry/sync/search` | `search` | Sync search -- returns results directly |
| `/registry/subscribe` | `subscribe` | Subscribe to registry events |
| `/registry/unsubscribe` | `unsubscribe` | Cancel a subscription |
| `/registry/txn/status` | `txn-status` | Query the status of a previous transaction |
| `/registry/sync/txn/status` | `txn-status` | Sync version of transaction status |

### Callback Endpoints (Required for Async)

Your registry must call these endpoints on the **client's** `sender_uri` to deliver
async results. The test suite starts a callback server to receive them.

| Endpoint | Action | Triggered By |
|----------|--------|--------------|
| `/registry/on-search` | `on-search` | Async search |
| `/registry/on-subscribe` | `on-subscribe` | Async subscribe |
| `/registry/on-unsubscribe` | `on-unsubscribe` | Async unsubscribe |
| `/registry/txn/on-status` | `txn-on-status` | Async txn status |
| `/registry/notify` | `notify` | Subscription event |

---

## Message Envelope Structure

Every SPDCI request and response uses this envelope:

```json
{
  "signature": "...",
  "header": {
    "version": "1.0.0",
    "message_id": "unique-id",
    "message_ts": "2024-01-15T10:30:00.000Z",
    "action": "search",
    "sender_id": "client-id",
    "sender_uri": "http://callback-server/registry/on-search",
    "receiver_id": "registry-id",
    "total_count": 1
  },
  "message": {
    "transaction_id": "txn-123",
    "search_request": [...]
  }
}
```

The `sender_uri` is set automatically when the callback server is enabled (see
[Testing Async Workflows](#testing-async-workflows-callbacks)).

### ACK Response (Async Endpoints)

Async endpoints return an ACK immediately, then send the full response to the
client's `sender_uri` via callback. Note: ACK responses do not include the full
`signature` / `header` wrapper -- only `message`:

```json
{
  "message": {
    "ack_status": "ACK",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "correlation_id": "msg-id-from-request"
  }
}
```

### ERR Response

When a request is invalid:

```json
{
  "message": {
    "ack_status": "ERR",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "correlation_id": "msg-id-from-request",
    "error": {
      "code": "err.request.bad",
      "message": "Invalid search criteria"
    }
  }
}
```

---

## Seeding Test Data

The test suite uses hard-coded identifiers. Your registry must contain matching
records for the tests to pass.

### Social Registry

| What | Identifier Type | Value |
|------|-----------------|-------|
| Person record | `UIN` | `TEST-001` |
| Active subscription | (code) | `sub-test-001` |

For predicate query tests to return results, include records matching:
- `age < 25`
- `poverty_score < 2.5`

### CRVS

| What | Identifier Type | Value |
|------|-----------------|-------|
| Birth record | `BRN` | `BIRTH-TEST-001` |
| Active subscription | (code) | `sub-crvs-test-001` |

For predicate queries: records with `registration_date >= 2020-01-01` and `sex = male`.

### Farmer Registry

| What | Identifier Type | Value |
|------|-----------------|-------|
| Farmer record | `FARMER_ID` | `FARMER-TEST-001` |
| Active subscription | (code) | `sub-fr-test-001` |

For predicate queries: records with `farm_size >= 5` and `irrigation_type = drip`.

### What Happens If Test Data Is Missing?

- **Search tests**: Will fail because no results are returned for the test identifiers
- **Unsubscribe tests**: Will fail because `sub-test-001` (or domain equivalent) doesn't exist
- **Predicate tests**: May pass structurally but return empty results (this is acceptable
  for envelope-level validation, but some scenarios expect results)

---

## Running the Tests

The `npm run test:*` scripts set `DOMAIN` automatically. When using raw
`npx cucumber-js` commands, you must set `DOMAIN` yourself (defaults to `social`
if unset).

### Smoke Tests (Start Here)

Smoke tests check basic connectivity and endpoint availability. They include a mix
of search, subscribe, security, and schema validation scenarios tagged `@smoke`:

```bash
# Smoke tests default to the social domain
API_BASE_URL=http://your-registry:8080 npm run test:smoke

# For other domains, set DOMAIN explicitly
DOMAIN=crvs API_BASE_URL=http://your-registry:8080 npm run test:smoke
```

### Core Compliance

Core tests (`@tier=core`) cover the main SPDCI behavior. Note that security tests
use `@tier=security` and are not included in `test:core` -- run them separately or
via the full suite:

```bash
API_BASE_URL=http://your-registry:8080 npm run test:core
```

### Full Suite

Run all tests for a specific domain:

```bash
# Social Registry
API_BASE_URL=http://your-registry:8080 npm run test:social

# CRVS
API_BASE_URL=http://your-registry:8080 npm run test:crvs

# Farmer Registry
API_BASE_URL=http://your-registry:8080 npm run test:fr
```

### Running Specific Test Categories

Use Cucumber tags to run specific subsets. Always set `DOMAIN` when using `npx`
directly:

```bash
# Only search tests (social)
DOMAIN=social API_BASE_URL=http://your-registry:8080 \
  npx cucumber-js --tags '@profile=sr-registry and @endpoint=registry/search'

# Only security tests (social)
DOMAIN=social API_BASE_URL=http://your-registry:8080 \
  npx cucumber-js --tags '@profile=sr-registry and @tier=security'

# Only async workflow tests (social)
DOMAIN=social API_BASE_URL=http://your-registry:8080 \
  CALLBACK_SERVER_ENABLED=true \
  npx cucumber-js --tags '@needs-callback'
```

---

## Configuring Authentication

The test suite does not assume any specific auth mechanism. Configure it through
environment variables:

### Bearer Token

```bash
API_BASE_URL=http://your-registry:8080 \
  DCI_AUTH_TOKEN=your-token-here \
  npm run test:social
```

The token is automatically prefixed with `Bearer ` if needed.

### Custom Headers

For API gateways, multi-tenancy, or non-standard auth:

```bash
# JSON format
API_BASE_URL=http://your-registry:8080 \
  EXTRA_HEADERS_JSON='{"Authorization":"Bearer xxx","X-Tenant-ID":"tenant1"}' \
  npm run test:social

# Semicolon-delimited format
API_BASE_URL=http://your-registry:8080 \
  EXTRA_HEADERS="Authorization:Bearer xxx;X-Tenant-ID:tenant1" \
  npm run test:social
```

### Sender / Receiver IDs

Some registries validate sender and receiver identifiers. Override the defaults:

```bash
DCI_SENDER_ID=openimis-client \
  DCI_RECEIVER_ID=openimis-sr \
  API_BASE_URL=http://your-registry:8080 \
  npm run test:social
```

---

## Testing Async Workflows (Callbacks)

SPDCI async endpoints work in three steps:

1. **Client sends request** with a `sender_uri` in the header
2. **Registry responds with ACK** immediately
3. **Registry sends results** to the client's `sender_uri` as a callback

The test suite includes a built-in callback server. It is **disabled by default**
and must be explicitly enabled:

```bash
CALLBACK_SERVER_ENABLED=true \
  CALLBACK_SERVER_HOST=your-test-machine \
  API_BASE_URL=http://your-registry:8080 \
  npm run test:social
```

When enabled:
- The callback server starts on port `CALLBACK_SERVER_PORT` (default: `3336`)
- `CALLBACK_SERVER_HOST` controls the hostname advertised in `sender_uri` (default:
  `127.0.0.1`). Set this to an address your registry can reach.
- The test suite automatically constructs `sender_uri` values pointing to the callback
  server.

**Important**: Your registry must be able to make HTTP requests to the callback
server. If your registry runs in a container or VM, set `CALLBACK_SERVER_HOST` to
an address routable from inside that environment.

If you cannot set up callback connectivity, the async workflow tests (tagged
`@needs-callback`) will fail but other tests will still run.

### Adjusting Timeouts

There are two separate timeout values for async testing:

- **`CALLBACK_WAIT_MS`** (default: `120000` / 2 minutes) -- how long the test suite
  polls for a callback response from your registry. This is the one to increase if
  your registry processes requests slowly.

- **`CUCUMBER_STEP_TIMEOUT_MS`** (default: `60000` for callback hooks) -- the
  Cucumber framework step timeout. Must be >= `CALLBACK_WAIT_MS`.

```bash
CALLBACK_SERVER_ENABLED=true \
  CALLBACK_WAIT_MS=180000 \
  CUCUMBER_STEP_TIMEOUT_MS=200000 \
  API_BASE_URL=http://your-registry:8080 \
  npm run test:social
```

---

## Reading the Test Report

After a test run, open `results/report.html` in a browser. The report shows:

- **Pass/fail counts** per feature and scenario
- **Requirement IDs** (e.g., `SR-CORE-RG-ASYNC-SEARCH-01`) linking each test to a
  specific compliance requirement
- **Response details** for failed tests, including actual vs expected values

### Requirement ID Prefixes

| Prefix | Meaning |
|--------|---------|
| `SR-*` | Social Registry requirements |
| `CRVS-*` | CRVS requirements |
| `FR-*` | Farmer Registry requirements |
| `DCI-*` | Common requirements (apply to all domains) |

### Test Tiers

| Tier | Meaning |
|------|---------|
| `core` | Required for basic SPDCI compliance |
| `security` | Authentication and signature validation |
| `extended` | Additional behavior recommended by the spec |
| `optional` | Nice-to-have features |

---

## Domain-Specific Notes

### Social Registry

**Domain key**: `social`
**OpenAPI spec**: `social_api_v1.0.0.yaml`
**Profile tag**: `@profile=sr-registry`

Record types: `Member`, `SRPerson`, `Person`
Subscription event types: `REGISTER`, `NewHouseHoldMember`
Identifier types: `UIN`, `MOBILE`, `EMAIL`, `NIN`, `HOUSEHOLD_ID`

```bash
API_BASE_URL=http://your-sr:8080 npm run test:social
```

### CRVS

**Domain key**: `crvs`
**OpenAPI spec**: `crvs_api_v1.0.0.yaml`
**Profile tag**: `@profile=crvs-registry`

Record types: `Person`, `CRVSPerson`
Subscription event types: `BIRTH`, `DEATH`, `MARRIAGE`, `DIVORCE`
  (free-form string in the spec; these are practical short-form conventions)
Identifier types: `UIN`, `BRN`, `DRN`, `MRN`, `NIN`

```bash
API_BASE_URL=http://your-crvs:8080 npm run test:crvs
```

### Farmer Registry

**Domain key**: `fr`
**OpenAPI spec**: `fr_api_v1.0.0.yaml`
**Profile tag**: `@profile=fr-registry`

Record types: `Farmer`
Subscription event types: `register` (lowercase, per spec enum)
Identifier types: `FARMER_ID`, `FARM_ID`, `NIN`

```bash
API_BASE_URL=http://your-fr:8080 npm run test:fr
```

---

## Environment Variable Reference

### Connection

| Variable | Default | Description |
|----------|---------|-------------|
| `API_BASE_URL` | `http://127.0.0.1:3333/` | Base URL of your registry |
| `DOMAIN` | `social` | Domain to test: `social`, `crvs`, `fr` |
| `OPENAPI_SPEC_PATH` | Auto-detected | Path to OpenAPI spec (usually not needed) |

### Authentication

| Variable | Default | Description |
|----------|---------|-------------|
| `DCI_AUTH_TOKEN` | None | Bearer token |
| `AUTH_TOKEN` | None | Alternative to `DCI_AUTH_TOKEN` |
| `EXTRA_HEADERS_JSON` | None | Additional headers as JSON |
| `EXTRA_HEADERS` | None | Additional headers as `Key:Value;Key:Value` |

### Identity

| Variable | Default | Description |
|----------|---------|-------------|
| `DCI_SENDER_ID` | `test-client` | Sender ID in message headers |
| `DCI_RECEIVER_ID` | `sr-server` / `crvs-server` / `fr-server` | Receiver ID (domain-specific default) |
| `DCI_SENDER_URI` | Auto-generated | Callback URL for async operations |

### Callback Server

| Variable | Default | Description |
|----------|---------|-------------|
| `CALLBACK_SERVER_ENABLED` | `false` | Set to `true` to start the callback server |
| `CALLBACK_SERVER_HOST` | `127.0.0.1` | Hostname advertised in `sender_uri` |
| `CALLBACK_SERVER_PORT` | `3336` | Port for the callback receiver |
| `CALLBACK_SERVER_BASE_URL` | Auto-generated | Override the full callback base URL |

### Timeouts

| Variable | Default | Description |
|----------|---------|-------------|
| `CALLBACK_WAIT_MS` | `120000` | Max time (ms) to wait for a callback from the registry |
| `CUCUMBER_STEP_TIMEOUT_MS` | `60000` | Cucumber step timeout (must be >= `CALLBACK_WAIT_MS`) |
| `RESPONSE_TIME_THRESHOLD_MS` | `15000` | Max acceptable response time for performance checks |

---

## Troubleshooting

### "Connection refused" errors

Your registry is not reachable at the `API_BASE_URL`. Verify connectivity:

```bash
curl -s -o /dev/null -w '%{http_code}' \
  http://your-registry:8080/registry/sync/search -X POST \
  -H "Content-Type: application/json" \
  -d '{"signature":"","header":{"version":"1.0.0","message_id":"test","message_ts":"2024-01-01T00:00:00Z","action":"search","sender_id":"test","receiver_id":"test","total_count":1},"message":{"transaction_id":"test","search_request":[{"reference_id":"ref-1","timestamp":"2024-01-01T00:00:00Z","search_criteria":{"query_type":"idtype-value","query":{"type":"UIN","value":"TEST-001"}}}]}}'
```

Any HTTP response (even 401 or 500) confirms connectivity. No response means a
network issue.

### All async workflow tests fail

The callback server is not enabled or not reachable. Check:
- Is `CALLBACK_SERVER_ENABLED=true` set?
- Is `CALLBACK_SERVER_HOST` set to an address your registry can reach?
- If your registry is in Docker/VM, is the port mapped correctly?

### Search tests fail with "no results"

Your registry doesn't contain the expected test data. See
[Seeding Test Data](#seeding-test-data).

### Schema validation errors

The response body doesn't match the OpenAPI spec. The error message will show:
- Which field failed validation
- What was expected vs what was received

Common causes:
- Missing required fields in the response
- Wrong data types (e.g., string instead of integer)
- Incorrect enum values

### Authentication tests fail unexpectedly

If your registry doesn't enforce auth, security tests that expect rejection of
unauthenticated requests will fail. This is expected -- those tests validate that
your registry properly secures its endpoints.

### Tests are too slow

For async tests, increase the callback wait time:

```bash
CALLBACK_WAIT_MS=180000 CUCUMBER_STEP_TIMEOUT_MS=200000 npm run test:social
```

For performance threshold assertions only:

```bash
RESPONSE_TIME_THRESHOLD_MS=30000 npm run test:social
```
