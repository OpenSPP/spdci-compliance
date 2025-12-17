# SPDCI Compliance Test Suite

Unified compliance testing framework for SPDCI (Social Protection Digital Convergence Initiative) API standards.

## Supported Registries

| Domain | Spec | Status |
|--------|------|--------|
| Social Registry (SR) | `social_api_v1.0.0.yaml` | **Complete** |
| Civil Registration (CRVS) | `crvs_api_v1.0.0.yaml` | Not Implemented |
| Disbursement Registry (DR) | `dr_api_v1.0.0.yaml` | Not Implemented |
| Functional Registry (FR) | `fr_api_v1.0.0.yaml` | Not Implemented |
| ID & Beneficiary Registry (IBR) | `ibr_api_v1.0.0.yaml` | Not Implemented |

> **Note**: Only the Social Registry domain is currently implemented. Other domains have placeholder folders for future implementation.

## Project Structure

```
spdci-compliance/
├── common/                     # Shared infrastructure
│   ├── helpers/               # Request builders, validators, utilities
│   │   ├── index.js           # Re-exports all helpers
│   │   ├── envelope.js        # Message envelope (header, signature, message)
│   │   ├── headers.js         # Header builders and validators
│   │   ├── openapi-validator.js
│   │   └── callback-server.js # Callback server for async testing
│   ├── features/              # Shared test scenarios
│   │   ├── client_compliance.feature  # SPMIS client tests
│   │   ├── security_headers.feature   # Security header tests
│   │   └── support/           # Shared step definitions
│   └── mock-server/           # Mock registry for client testing
│       └── server.mjs
├── domains/                    # Domain-specific tests
│   ├── social/                # Social Registry (implemented)
│   │   ├── features/          # SR-specific scenarios
│   │   ├── payloads/          # SR-specific data generators
│   │   └── config.js          # SR endpoints, record types
│   ├── crvs/                  # Civil Registration (not implemented)
│   ├── dr/                    # Disbursement Registry (not implemented)
│   ├── fr/                    # Functional Registry (not implemented)
│   └── ibr/                   # ID & Beneficiary Registry (not implemented)
├── spec/                       # OpenAPI specifications
└── cucumber.cjs                # Cucumber configuration
```

## Shared vs Domain-Specific

### Shared (common/)

All SPDCI specs share:
- **Message envelope**: `signature`, `header`, `message` structure
- **Header format**: `version`, `message_id`, `sender_id`, `receiver_id`, `action`, etc.
- **Async pattern**: Request → ACK → Callback (on-*)
- **Error responses**: ACK/ERR with error codes
- **Security**: Authorization headers, signature validation
- **Endpoints pattern**: `/registry/search`, `/registry/subscribe`, `/registry/txn/status`

### Domain-Specific (domains/)

Each registry has:
- **Record types**: Person, Group, BirthCertificate, Disbursement, etc.
- **Query attributes**: Domain-specific searchable fields
- **Event types**: Domain-specific subscription events
- **Validation rules**: Domain-specific business logic

## Usage

### Run all tests
```bash
npm test
```

### Run tests for a specific domain
```bash
npm run test:social
npm run test:crvs
npm run test:dr
```

### Run by tier
```bash
npm run test:core    # Core compliance requirements
npm run test:smoke   # Quick smoke tests
```

### Run with specific tags
```bash
npx cucumber-js --tags '@profile=sr-registry and @tier=core'
npx cucumber-js --tags '@endpoint=registry/search'
npx cucumber-js --tags '@smoke'
```

## Environment Variables

### Connection

| Variable | Default | Description |
|----------|---------|-------------|
| `API_BASE_URL` | `http://127.0.0.1:3333/` | Target API base URL |
| `DOMAIN` | `social` | Active domain (social, crvs, dr, fr, ibr) |
| `OPENAPI_SPEC_PATH` | Auto-detected | Path to OpenAPI spec |
| `CALLBACK_SERVER_PORT` | `3336` | Callback receiver port |

### Authentication

The test suite does not assume any authentication mechanism by default. Configure auth using:

| Variable | Description |
|----------|-------------|
| `DCI_AUTH_TOKEN` | Bearer token (auto-prefixed with "Bearer " if needed) |
| `AUTH_TOKEN` | Alternative to DCI_AUTH_TOKEN |
| `EXTRA_HEADERS_JSON` | Additional headers as JSON: `{"Authorization":"Bearer xxx","X-Tenant":"abc"}` |
| `EXTRA_HEADERS` | Additional headers as string: `Authorization:Bearer xxx;X-Tenant:abc` |

**Example:**
```bash
# Using bearer token
DCI_AUTH_TOKEN=your-token-here npm run test:social

# Using custom headers for gateway/tenancy
EXTRA_HEADERS_JSON='{"Authorization":"Bearer xxx","X-Tenant-ID":"tenant1"}' npm run test:social
```

## Adding a New Domain

1. Create domain folder: `domains/<domain>/`
2. Add domain config: `domains/<domain>/config.js`
3. Add payloads: `domains/<domain>/payloads/`
4. Add domain-specific features: `domains/<domain>/features/`
5. Copy/symlink spec to `spec/`

## Test Profiles

### Registry Server Testing (`<domain>-registry`)

Test that a registry server correctly implements the SPDCI spec:

```bash
# Test a Social Registry server
API_BASE_URL=http://sr-server:8080 DOMAIN=social npm run test:social
```

### Client Testing (`spmis-client`)

Test that an SPMIS client correctly sends requests to registries:

```bash
# 1. Start the mock registry server
npm run mock-server

# 2. Configure your client to use http://localhost:3335

# 3. Run client compliance tests (requires client trigger API)
PROFILE=spmis-client CLIENT_TRIGGER_URL=http://your-client:8080/test/trigger npm test
```

The mock server:
- Validates incoming requests against the OpenAPI spec
- Records all requests for assertion
- Sends async callbacks to client's `sender_uri`
- Provides admin API for test control

See [common/mock-server/README.md](common/mock-server/README.md) for details.

## Acknowledgments

This project builds upon the work of the [Social Protection Digital Convergence Initiative (SPDCI)](https://spdci.org/):

- **API Standards**: [spdci/api-standards](https://github.com/spdci/api-standards) - The OpenAPI specifications this test suite validates against
- **Schemas**: [spdci/schemas](https://github.com/spdci/schemas) - JSON schemas for SPDCI data models

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

Apache 2.0 - See [LICENSE](LICENSE) for details.
