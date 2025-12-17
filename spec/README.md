# OpenAPI Specifications

This folder contains OpenAPI specifications used for compliance testing.

## Social Registry (`social_api_v1.0.0.yaml`)

The Social Registry specification is based on the official SPDCI specification from
[spdci/api-standards](https://github.com/spdci/api-standards) with the following
modifications to fix known issues:

### Typo Fixes

| Location | Original | Fixed |
|----------|----------|-------|
| UnsubscribeRequest.timestamp | `timesstamp` | `timestamp` |
| UnsubscribeRequest.subscription_codes | `sunscription_codes` | `subscription_codes` |
| UnSubscribeResponse.timestamp | `timesatmp` | `timestamp` |
| TxnStatusRequest.txn_type enum | `subscibe` | `subscribe` |
| TxnStatusResponse.txn_type enum | `subscibe` | `subscribe` |

### Schema Corrections

These changes fix inconsistencies between the OpenAPI spec and the JSON-LD schemas:

| Location | Change | Reason |
|----------|--------|--------|
| SubscriptionInfo.required | Changed from `[subscription_code, timestamp, subscribe_criteria]` to `[code, status, timestamp]` | Original spec had incorrect field names that don't exist in the schema. The actual schema uses `code` and `status` fields. |
| SubscriptionInfo.notify_record_type | Removed nested `required` block | The nested required array was incorrectly placed under a `$ref` property |

### Workarounds for Upstream Issues

These changes work around known issues in the upstream spec pending fixes:

| Location | Change | Upstream Issue | Reason |
|----------|--------|----------------|--------|
| TxnStatusRequest.attribute_value | `oneOf` → `anyOf` | [#46](https://github.com/spdci/api-standards/issues/46) | `transaction_id` and `correlation_id` schemas are structurally identical (both `string, maxLength: 99`), causing valid requests to fail oneOf validation. The `attribute_type` field serves as semantic discriminator but OpenAPI validators cannot use it. |

### Validation Workarounds

Some validation issues are handled in code rather than spec modifications. See `common/helpers/openapi-validator.js`:

| Function | Upstream Issue | Description |
|----------|----------------|-------------|
| `filterAmbiguousOneOfErrors()` | [#45](https://github.com/spdci/api-standards/issues/45) | Filters false-positive oneOf errors for the `query` field where `expression` and `idtype-value` schemas overlap. Uses `query_type` as semantic discriminator since OpenAPI validators cannot. |

### Upstream Issues

These issues have been reported to the SPDCI team:
- [api-standards#45](https://github.com/spdci/api-standards/issues/45) - Ambiguous oneOf schema for query field
- [api-standards#46](https://github.com/spdci/api-standards/issues/46) - Ambiguous oneOf schema for attribute_value field

## Other Specifications

The following specifications are not yet included:

- `crvs_api_v1.0.0.yaml` - Civil Registration and Vital Statistics
- `dr_api_v1.0.0.yaml` - Disbursement Registry
- `fr_api_v1.0.0.yaml` - Functional Registry
- `ibr_api_v1.0.0.yaml` - ID & Beneficiary Registry

These will be added when their respective domain tests are implemented.

## Test Data Requirements

For the compliance tests to pass, the Social Registry under test must be populated
with specific test data. The tests use hard-coded identifiers that must exist in
the registry.

### Required Registry Records

| Identifier Type | Value | Used By |
|-----------------|-------|---------|
| UIN | `TEST-001` | Search tests (idtype-value queries) |

### Required Subscriptions

| Subscription Code | Used By |
|-------------------|---------|
| `sub-test-001` | Unsubscribe tests, on-unsubscribe callback tests |

### Query Test Data

For expression and predicate query tests to return results, the registry should
contain records matching these criteria:

| Query Type | Criteria | Description |
|------------|----------|-------------|
| Expression | `poverty_score < 5`, `location = "central_region"`, `group_size < 5` | Group records with these attributes |
| Predicate | `age < 25`, `poverty_score < 2.5` | Person records matching these conditions |

### Environment Variables for Test Configuration

Tests use environment variables to configure identifiers. Override these to use
different test data:

| Variable | Default | Description |
|----------|---------|-------------|
| `DCI_SENDER_ID` | `test-client` | Sender identifier in message headers |
| `DCI_RECEIVER_ID` | `sr-server` | Receiver identifier in message headers |
| `DCI_SENDER_URI` | Auto-generated | Callback URL for async operations |
| `DCI_AUTH_TOKEN` | None | Bearer token for authentication |
| `API_BASE_URL` | `http://127.0.0.1:3333/` | Base URL of the SR under test |
| `CALLBACK_SERVER_BASE_URL` | None | Base URL for callback server |
| `RESPONSE_TIME_THRESHOLD_MS` | `15000` | Maximum response time threshold |

### Seed Data Script

Implementations should provide a seed script that creates the required test data.
Example structure for OpenSPP:

```python
# Create test person with UIN
partner = env['res.partner'].create({
    'name': 'Test Person 001',
    'spp_id_type': 'UIN',
    'spp_id_value': 'TEST-001',
})

# Create test subscription
subscription = env['spp.subscription'].create({
    'code': 'sub-test-001',
    'status': 'subscribe',
    ...
})
```

## Updating Specifications

When updating a specification:

1. Document any modifications in this README
2. Prefer validation workarounds over spec modifications when possible
3. Report issues upstream to [spdci/api-standards](https://github.com/spdci/api-standards)
