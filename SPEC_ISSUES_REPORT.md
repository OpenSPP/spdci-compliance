# SPDCI API Spec Issues Report

This document tracks inconsistencies found in the SPDCI OpenAPI specifications during compliance test development.

## Issues Found and Fixed Locally

### 1. Typo: `sunscription_codes` → `subscription_codes`

**Affected files:**
- `crvs_api_v1.0.0.yaml` (line ~1798)
- `fr_api_v1.0.0.yaml` (line ~1544)

**Description:**
The `UnSubscribeRequest` schema has a typo in the required field name. The field is defined as `subscription_codes` but the required array lists `sunscription_codes`.

**Fix:**
Change `sunscription_codes` to `subscription_codes` in the required array.

---

### 2. `oneOf` should be `anyOf` for `attribute_value` in TxnStatusRequest

**Affected files:**
- `crvs_api_v1.0.0.yaml` (line ~1608)
- `fr_api_v1.0.0.yaml` (line ~1624)

**Description:**
The `attribute_value` field in `TxnStatusRequest` uses `oneOf` which requires exactly one schema to match. This causes validation failures when the value is a simple string (like a transaction_id) because multiple schemas could potentially match.

The `social_api_v1.0.0.yaml` correctly uses `anyOf` for this field.

**Fix:**
Change `oneOf` to `anyOf` for the `attribute_value` field in TxnStatusRequest schema.

---

### 3. `reg_records` type inconsistency

**Affected files:**
- `fr_api_v1.0.0.yaml` (line ~1102)

**Description:**
In the `SearchResponse` schema, the `reg_records` field type is inconsistent across specs:
- `social_api_v1.0.0.yaml`: `type: array` (line ~1151)
- `crvs_api_v1.0.0.yaml`: `type: array` (line ~1207)
- `fr_api_v1.0.0.yaml`: `type: object` (line ~1102) ← Inconsistent

**Fix:**
Change `reg_records` in FR spec from `type: object` to `type: array` with `items` definition to match social and CRVS specs.

---

## How These Issues Were Discovered

These issues were found while developing compliance tests that validate requests and responses against the OpenAPI specifications using AJV (Another JSON Schema Validator).

## Local Fixes Applied

All issues have been fixed locally in our fork. The fixes are minimal and only address the inconsistencies without changing the intended functionality of the APIs.
