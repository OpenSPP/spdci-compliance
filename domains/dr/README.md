# DR (Disability Registry)

This domain contains core happy-path Disability Registry compliance coverage for the SPDCI registry APIs.

## Spec
- `dr_api_v1.0.0.yaml`

## Coverage
- Shared registry endpoints: search, subscribe, unsubscribe, and async transaction status
- Async workflow callback delivery from DR registry endpoints
- Subscriber callback receiver tests are tagged `@profile=dr-subscriber`
- Disability-specific sync endpoints:
  - `/registry/sync/disabled`
  - `/registry/sync/get-disability-details`
  - `/registry/sync/get-disability-support`
- Not yet covered: negative, security, and client-trigger scenarios at parity with SR, CRVS, and FR

## Run
```bash
DOMAIN=dr npm test -- --tags '@profile=dr-registry and @smoke'
DOMAIN=dr npm test -- --tags '@profile=dr-subscriber and @smoke'
npm run test:mock:dr
```
