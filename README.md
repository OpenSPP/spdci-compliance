# SPDCI Compliance Test Suite

Unified compliance testing framework for SPDCI (Social Protection Digital Convergence Initiative) API standards.

## Supported Registries

| Domain | Spec | Status |
|--------|------|--------|
| Social Registry (SR) | `social_api_v1.0.0.yaml` | **In Progress** |
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

- **`<domain>-registry`**: Test registry server compliance (SR, CRVS, etc.)
- **`spmis-client`**: Test SPMIS client compliance against mock server
- **`spmis-subscriber`**: Test subscription/notification handling

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT
