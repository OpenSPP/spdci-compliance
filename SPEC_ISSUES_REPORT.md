# SPDCI API Spec Issues Report

This document tracks inconsistencies found in the SPDCI OpenAPI specifications during compliance test development.

## Issues Merged Upstream

The following issues were reported via [PR #52](https://github.com/spdci/api-standards/pull/52) and are now fixed in the upstream specs.

### 1. Typo: `sunscription_codes` → `subscription_codes`

**Affected files:**
- `crvs_api_v1.0.0.yaml`
- `fr_api_v1.0.0.yaml`

**Description:**
The `UnSubscribeRequest` schema had a typo in the required field name. The field was defined as `subscription_codes` but the required array listed `sunscription_codes`.

**Status:** Merged upstream. No local fix needed.

---

### 2. `oneOf` should be `anyOf` for `attribute_value` in TxnStatusRequest

**Affected files:**
- `crvs_api_v1.0.0.yaml`
- `fr_api_v1.0.0.yaml`

**Description:**
The `attribute_value` field in TxnStatusRequest used `oneOf` which requires exactly one schema to match. This caused validation failures when the value is a simple string because multiple schemas could potentially match. The `social_api_v1.0.0.yaml` correctly used `anyOf`.

**Status:** Merged upstream. No local fix needed.

---

## Issues Still Requiring Local Fixes

### 3. `reg_records` type inconsistency in FR NotifyEventRequest

**Affected files:**
- `fr_api_v1.0.0.yaml` (NotifyEventRequest schema)

**Description:**
The `reg_records` field type is inconsistent across specs and even within the FR spec:
- `social_api_v1.0.0.yaml` SearchResponse: `type: array`
- `crvs_api_v1.0.0.yaml` SearchResponse: `type: array`
- `fr_api_v1.0.0.yaml` SearchResponse: `type: array` (fixed upstream)
- `fr_api_v1.0.0.yaml` NotifyEventRequest: `type: object` ← Still inconsistent

**Local fix applied:**
Changed `reg_records` in FR NotifyEventRequest from `type: object` to `type: array` with `items: { type: object }`.

---

## Spec Sync Notes

Our `spec/` directory copies were last synced from upstream on Feb 25, 2026 (commit `954f0c9` in spdci-api-standards). Key upstream changes included since our previous sync:

- CRVS: `identifier` field changed from single object to array in Person schema
- New ESS (Employment and Social Security) domain added
- Release YAML files regenerated with expanded inline schemas (previously used `$ref` pointers)

The upstream regeneration removed inline response schemas from some endpoint definitions (replacing them with just `description: "Successful response"`). Our OpenAPI validator handles this by falling back to the shared `Response` component.

## How These Issues Were Discovered

These issues were found while developing compliance tests that validate requests and responses against the OpenAPI specifications using AJV (Another JSON Schema Validator).
