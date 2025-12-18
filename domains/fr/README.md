# FR (Farmer Registry) Tests

Tests for SPDCI-compliant Farmer Registry implementations.

## Tests

- **Core Registry Tests**: Async/sync search, subscribe, unsubscribe, txn status
- **Negative Tests**: Schema-invalid request handling

## Running Tests

```bash
# Run all FR tests
npm run test:fr

# Run only smoke tests
DOMAIN=fr npm test -- --tags '@profile=fr-registry and @smoke'
```

## Configuration

Set these environment variables to configure the test target:

- `API_BASE_URL`: Target FR server (default: `http://127.0.0.1:3333/`)
- `DCI_AUTH_TOKEN`: Bearer token for authentication
- `CALLBACK_SERVER_BASE_URL`: Callback server URL for async workflows
