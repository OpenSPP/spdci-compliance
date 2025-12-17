@profile=sr-registry @tier=core
Feature: SPDCI format validation compliance

The SPDCI spec defines specific formats for fields:
- Timestamps: ISO 8601 with timezone (format: date-time)
- Locale: ISO 639.3 language codes (pattern: ^[a-z]{3,3}$)

These tests verify that implementations properly validate field formats.

  # ============================================
  # TIMESTAMP FORMAT VALIDATION
  # ============================================

  @smoke @method=POST @endpoint=registry/search @req=SR-VAL-FMT-TS-01
  Scenario: Search rejects invalid timestamp format
    Given A valid "async search" request payload is prepared for format testing
    When The timestamp is set to an invalid format "not-a-timestamp"
    And The format test request is sent to "async search"
    Then The request should be rejected due to invalid format

  @smoke @method=POST @endpoint=registry/search @req=SR-VAL-FMT-TS-02
  Scenario: Search accepts valid ISO 8601 timestamp with timezone
    Given A valid "async search" request payload is prepared for format testing
    When The timestamp is set to a valid ISO 8601 format
    And The format test request is sent to "async search"
    Then The request should be accepted or processed

  @method=POST @endpoint=registry/subscribe @req=SR-VAL-FMT-TS-03
  Scenario: Subscribe rejects timestamp without timezone
    Given A valid "async subscribe" request payload is prepared for format testing
    When The timestamp is set to ISO 8601 without timezone "2024-01-15T10:30:00"
    And The format test request is sent to "async subscribe"
    Then The request should be rejected due to invalid format

  # ============================================
  # LOCALE FORMAT VALIDATION
  # ============================================

  @method=POST @endpoint=registry/search @req=SR-VAL-FMT-LOC-01
  Scenario: Search accepts valid ISO 639.3 locale code
    Given A valid "async search" request payload is prepared for format testing
    When The locale is set to valid ISO 639.3 code "eng"
    And The format test request is sent to "async search"
    Then The request should be accepted or processed

  @method=POST @endpoint=registry/search @req=SR-VAL-FMT-LOC-02
  Scenario: Search rejects invalid locale format - too short
    Given A valid "async search" request payload is prepared for format testing
    When The locale is set to invalid code "en"
    And The format test request is sent to "async search"
    Then The request should be rejected due to invalid format

  @method=POST @endpoint=registry/search @req=SR-VAL-FMT-LOC-03
  Scenario: Search rejects invalid locale format - uppercase
    Given A valid "async search" request payload is prepared for format testing
    When The locale is set to invalid code "ENG"
    And The format test request is sent to "async search"
    Then The request should be rejected due to invalid format
