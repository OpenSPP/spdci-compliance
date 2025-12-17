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
├── common/                     # Shared infrastructure (60-70% of codebase)
│   ├── helpers/               # Request builders, validators, utilities
│   │   ├── envelope.js        # Message envelope (header, signature, message)
│   │   ├── headers.js         # Header builders and validators
│   │   ├── openapi-validator.js
│   │   └── callbacks.js       # Callback server utilities
│   ├── features/              # Shared test scenarios
│   │   ├── security_auth.feature
│   │   ├── security_headers.feature
│   │   ├── async_workflow.feature
│   │   └── support/           # Shared step definitions
│   └── mock-server/           # Generic mock server with domain plugins
│       └── server.mjs
├── domains/                    # Domain-specific tests
│   ├── social/                # Social Registry
│   │   ├── features/          # SR-specific scenarios
│   │   ├── payloads/          # SR-specific data generators
│   │   └── config.js          # SR endpoints, record types
│   ├── crvs/                  # Civil Registration
│   ├── dr/                    # Disbursement Registry
│   ├── fr/                    # Functional Registry
│   └── ibr/                   # ID & Beneficiary Registry
├── spec/                       # OpenAPI specifications (symlinks or copies)
└── cucumber.js                 # Cucumber configuration
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
npx cucumber-js --tags '@domain=social and @tier=core'
npx cucumber-js --tags '@endpoint=registry/search'
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `API_BASE_URL` | `http://localhost:8080` | Target API base URL |
| `DOMAIN` | `social` | Active domain (social, crvs, dr, fr, ibr) |
| `PROFILE` | `sr-registry` | Test profile |
| `TIER` | `core` | Test tier (core, extended, optional) |
| `OPENAPI_SPEC_PATH` | Auto-detected | Path to OpenAPI spec |
| `CALLBACK_SERVER_PORT` | `3336` | Callback receiver port |

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
