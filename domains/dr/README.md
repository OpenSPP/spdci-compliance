# DR (Disability Registry)

This domain contains core happy-path Disability Registry compliance coverage for the SPDCI registry APIs.

## Spec
- `dr_api_v1.0.0.yaml`

## Coverage
- Shared registry endpoints: search, subscribe, unsubscribe, notify, callbacks, and async transaction status
- Disability-specific sync endpoints:
  - `/registry/sync/disabled`
  - `/registry/sync/get-disability-details`
  - `/registry/sync/get-disability-support`
- Not yet covered: negative, security, and client-trigger scenarios at parity with SR, CRVS, and FR

## Run
```bash
DOMAIN=dr npm test -- --tags '@profile=dr-registry and @smoke'
npm run test:mock:dr
```
