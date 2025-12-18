# CRVS (Civil Registration and Vital Statistics) Registry Tests

Tests for SPDCI-compliant Civil Registration and Vital Statistics registries.

## Tests

- **Core Registry Tests**: Async/sync search, subscribe, unsubscribe, txn status
- **Negative Tests**: Schema-invalid request handling

## Running Tests

```bash
# Run all CRVS tests
npm run test:crvs

# Run only smoke tests
DOMAIN=crvs npm test -- --tags '@profile=crvs-registry and @smoke'
```

## Configuration

Set these environment variables to configure the test target:

- `API_BASE_URL`: Target CRVS server (default: `http://127.0.0.1:3333/`)
- `DCI_AUTH_TOKEN`: Bearer token for authentication
- `CALLBACK_SERVER_BASE_URL`: Callback server URL for async workflows
