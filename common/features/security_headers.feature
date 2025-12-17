@tier=core @category=security
Feature: SPDCI Security Headers Compliance

  All SPDCI APIs must properly handle security headers.
  These tests verify common security requirements across all domains.

  Background:
    Given The API is available

  # ============================================
  # AUTHORIZATION HEADER TESTS
  # ============================================

  @smoke @req=SPDCI-SEC-AUTH-01
  Scenario: API requires Authorization header
    Given A search request without Authorization header
    When The request is sent
    Then The response should have status 401 or 403

  @smoke @req=SPDCI-SEC-AUTH-02
  Scenario: API rejects invalid Authorization token
    Given A search request with invalid Authorization token
    When The request is sent
    Then The response should have status 401 or 403

  @smoke @req=SPDCI-SEC-AUTH-03
  Scenario: API accepts valid Bearer token
    Given A valid search request with proper Authorization
    When The request is sent
    Then The response should not have status 401 or 403

  # ============================================
  # CONTENT-TYPE HEADER TESTS
  # ============================================

  @smoke @req=SPDCI-SEC-CONTENT-01
  Scenario: API requires Content-Type header
    Given A search request without Content-Type header
    When The request is sent
    Then The response should have status 400 or 415

  @smoke @req=SPDCI-SEC-CONTENT-02
  Scenario: API accepts application/json Content-Type
    Given A valid search request with Content-Type application/json
    When The request is sent
    Then The response should not have status 415
