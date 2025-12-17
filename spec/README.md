# OpenAPI Specifications

This folder contains OpenAPI specifications used for compliance testing.

## Social Registry (`social_api_v1.0.0.yaml`)

The Social Registry specification is based on the official SPDCI specification from
[spdci/api-standards](https://github.com/spdci/api-standards) with the following
modifications to fix known issues:

### Typo Fixes

| Location | Original | Fixed |
|----------|----------|-------|
| SubscribeRequest.timestamp | `timesstamp` | `timestamp` |
| UnsubscribeRequest.subscription_codes | `sunscription_codes` | `subscription_codes` |
| UnsubscribeResponse.timestamp | `timesatmp` | `timestamp` |
| SubscriptionStatus.status enum | `subscibe` | `subscribe` |

### Structural Changes

| Change | Reason |
|--------|--------|
| `oneOf` → `anyOf` for SubscriptionStatus | Allows more flexible validation |
| Relaxed required fields in SubscribeRequest | Matches implementation reality |

### Upstream Issues

These issues have been reported to the SPDCI team:
- [api-standards#45](https://github.com/spdci/api-standards/issues/45) - Ambiguous oneOf schema for query field

## Other Specifications

The following specifications are not yet included:

- `crvs_api_v1.0.0.yaml` - Civil Registration and Vital Statistics
- `dr_api_v1.0.0.yaml` - Disbursement Registry
- `fr_api_v1.0.0.yaml` - Functional Registry
- `ibr_api_v1.0.0.yaml` - ID & Beneficiary Registry

These will be added when their respective domain tests are implemented.

## Updating Specifications

When updating a specification:

1. Document any modifications in this README
2. Prefer validation workarounds over spec modifications when possible
3. Report issues upstream to [spdci/api-standards](https://github.com/spdci/api-standards)
