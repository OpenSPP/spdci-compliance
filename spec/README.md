# OpenAPI Specifications

This folder contains OpenAPI specifications used for compliance testing. The specs
are synced from [spdci/api-standards](https://github.com/spdci/api-standards)
`release/yaml/` with minimal local fixes applied.

## Spec Sync Status

Last synced: Feb 25, 2026 (upstream commit `954f0c9`)

| Spec | Status |
|------|--------|
| `social_api_v1.0.0.yaml` | Synced, no local fixes needed |
| `crvs_api_v1.0.0.yaml` | Synced, no local fixes needed |
| `fr_api_v1.0.0.yaml` | Synced + local fix for `reg_records` type in NotifyEventRequest |
| `dr_api_v1.0.0.yaml` | Synced (tests not yet implemented) |
| `ibr_api_v1.0.0.yaml` | Synced (tests not yet implemented) |

## Local Fixes

### FR: `reg_records` type in NotifyEventRequest

The FR spec defines `reg_records` as `type: object` in the NotifyEventRequest
schema, but `type: array` in the SearchResponse schema. The Social and CRVS specs
both use `type: array` consistently. We fix the NotifyEventRequest to use
`type: array` with `items: { type: object }` for consistency.

See `SPEC_ISSUES_REPORT.md` for full details and upstream status.

## Validation Workarounds

Some validation issues are handled in code rather than spec modifications. See
`common/helpers/openapi-validator.js`:

| Function | Description |
|----------|-------------|
| `filterAmbiguousOneOfErrors()` | Filters false-positive oneOf errors for the `query` field where `expression` and `idtype-value` schemas overlap. Uses `query_type` as semantic discriminator. |
| `getFallbackResponseSchema()` | Falls back to the shared `Response` component when an endpoint's response has no inline schema (common in upstream-regenerated specs). |

## Upstream Issues

These issues have been reported to the SPDCI team:
- [api-standards#45](https://github.com/spdci/api-standards/issues/45) - Ambiguous oneOf schema for query field
- [api-standards#46](https://github.com/spdci/api-standards/issues/46) - Ambiguous oneOf schema for attribute_value field
- [api-standards#47](https://github.com/spdci/api-standards/issues/47) - Ambiguous oneOf schema for SubscriptionInfo.filter field
- [api-standards#49](https://github.com/spdci/api-standards/issues/49) - DR spec missing txn/status endpoints

## Test Data Requirements

For compliance tests to pass, the registry under test must be populated with
specific test data. See `docs/testing-your-registry.md` for the full guide.

### Required Records Per Domain

| Domain | Identifier Type | Value | Subscription Code |
|--------|-----------------|-------|-------------------|
| Social | `UIN` | `TEST-001` | `sub-test-001` |
| CRVS | `BRN` | `BIRTH-TEST-001` | `sub-crvs-test-001` |
| FR | `FARMER_ID` | `FARMER-TEST-001` | `sub-fr-test-001` |

### Query Type Validation Levels

| Query Type | Validation Level | Description |
|------------|------------------|-------------|
| `idtype-value` | **Strict** | Validates `{ type, value }` structure |
| `predicate` | **Strict** | Validates `ExpPredicateWithConditionList` structure per DCI spec. Operators must be: `gt`, `lt`, `eq`, `ge`, `le`, `in` |
| `expression` | **Envelope only** | Validates `{ type, value }` envelope exists, but `value` contents are NOT validated (implementation-specific) |
| `graphql` | **Envelope only** | Validates `{ type, value }` envelope, `value` is a GraphQL string |

## Updating Specifications

When syncing from upstream:

1. Copy files from `spdci-api-standards/release/yaml/` into this directory
2. Re-apply any local fixes listed above
3. Run mock tests (`npm run test:mock:social`, etc.) to verify
4. Update the sync date and status table in this README
5. Update `SPEC_ISSUES_REPORT.md` if any fixes are no longer needed
