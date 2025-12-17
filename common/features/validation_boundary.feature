@tier=core
Feature: SPDCI string length boundary validation (common to all domains)

The SPDCI spec defines maximum lengths for string fields:
- transaction_id: maxLength 99
- correlation_id: maxLength 99
- subscription_code: maxLength 99
- status_reason_message: maxLength 999

These tests verify boundary conditions are properly enforced.

  # ============================================
  # TRANSACTION_ID BOUNDARY TESTS
  # ============================================

  @method=POST @endpoint=registry/search @req=DCI-VAL-BND-TXN-01
  Scenario: Search accepts transaction_id at max length (99 chars)
    Given A valid "async search" request payload is prepared for boundary testing
    When The transaction_id is set to exactly 99 characters
    And The boundary test request is sent to "async search"
    Then The request should be accepted or processed

  @method=POST @endpoint=registry/search @req=DCI-VAL-BND-TXN-02
  Scenario: Search rejects transaction_id exceeding max length
    Given A valid "async search" request payload is prepared for boundary testing
    When The transaction_id is set to 100 characters
    And The boundary test request is sent to "async search"
    Then The request should be rejected due to boundary violation

  # ============================================
  # REFERENCE_ID BOUNDARY TESTS
  # ============================================

  @method=POST @endpoint=registry/search @req=DCI-VAL-BND-REF-01
  Scenario: Search accepts reference_id at reasonable length
    Given A valid "async search" request payload is prepared for boundary testing
    When The reference_id is set to 50 characters
    And The boundary test request is sent to "async search"
    Then The request should be accepted or processed

  # ============================================
  # SUBSCRIPTION_CODE BOUNDARY TESTS
  # ============================================

  @method=POST @endpoint=registry/unsubscribe @req=DCI-VAL-BND-SUB-01
  Scenario: Unsubscribe accepts subscription_code at max length (99 chars)
    Given A valid "async unsubscribe" request payload is prepared for boundary testing
    When The subscription_code is set to exactly 99 characters
    And The boundary test request is sent to "async unsubscribe"
    Then The request should be accepted or processed

  @method=POST @endpoint=registry/unsubscribe @req=DCI-VAL-BND-SUB-02
  Scenario: Unsubscribe rejects subscription_code exceeding max length
    Given A valid "async unsubscribe" request payload is prepared for boundary testing
    When The subscription_code is set to 100 characters
    And The boundary test request is sent to "async unsubscribe"
    Then The request should be rejected due to boundary violation
