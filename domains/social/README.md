# Social Registry Tests

Domain-specific compliance tests for SPDCI Social Registry API (`social_api_v1.0.0.yaml`).

## Test Categories

| Feature | Description |
|---------|-------------|
| `sr_search.feature` | Async search operations |
| `sr_sync_search.feature` | Sync search operations |
| `sr_search_query_types.feature` | Expression, predicate, idtype-value queries |
| `sr_subscribe.feature` | Subscription management |
| `sr_unsubscribe.feature` | Unsubscribe operations |
| `sr_txn_status.feature` | Transaction status queries |
| `sr_async_workflow.feature` | End-to-end async workflows |
| `sr_on-*.feature` | Callback endpoint tests |
| `sr_negative.feature` | Schema validation (negative tests) |
| `sr_security_*.feature` | Auth and signature validation |
| `sr_notify.feature` | Event notification |
| `sp_client.feature` | SPMIS client compliance |
| `sp_negative.feature` | Client-side negative tests |

## Running

```bash
npm run test:social

# Or with tags
npx cucumber-js --tags '@profile=sr-registry and @smoke'
```

## Requirements

See `requirements.json` for SR-specific requirement IDs (SR-*).
Common requirements (DCI-*) are in `common/requirements.json`.
