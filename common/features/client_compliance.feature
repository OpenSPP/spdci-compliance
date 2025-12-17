@profile=spmis-client @tier=core
Feature: SPMIS Client Compliance

  These tests validate that an SPMIS client implementation correctly:
  - Sends spec-valid requests to the registry
  - Includes required headers (Authorization, Content-Type)
  - Handles ACK/ERR responses appropriately
  - Receives and processes callbacks

  Prerequisites:
  - Mock registry server running with validation and recording enabled
  - Client configured to send requests to the mock registry
  - Client exposes a test trigger API or CLI

  # ============================================
  # SEARCH REQUEST TESTS
  # ============================================

  @smoke @req=SPDCI-CL-SEARCH-01
  Scenario: Client sends spec-valid search request
    Given The mock registry is ready and recordings are cleared
    When The client sends a search request
    Then The mock registry should have recorded 1 request to "/registry/search"
    And The recorded request should have a valid "header" object
    And The recorded request should have a valid "message" object
    And The recorded request header should have action "search"
    And The recorded request should pass OpenAPI validation

  @smoke @req=SPDCI-CL-SEARCH-ACK-01
  Scenario: Client receives and accepts ACK response
    Given The mock registry is ready and configured for success
    When The client sends a search request
    Then The client should receive an ACK response
    And The client should not report an error

  @smoke @req=SPDCI-CL-SEARCH-ERR-01
  Scenario: Client handles ERR response gracefully
    Given The mock registry is ready and configured to return error
    When The client sends a search request
    Then The client should receive an ERR response
    And The client should handle the error gracefully

  # ============================================
  # SUBSCRIBE REQUEST TESTS
  # ============================================

  @smoke @req=SPDCI-CL-SUBSCRIBE-01
  Scenario: Client sends spec-valid subscribe request
    Given The mock registry is ready and recordings are cleared
    When The client sends a subscribe request
    Then The mock registry should have recorded 1 request to "/registry/subscribe"
    And The recorded request should have a valid "header" object
    And The recorded request should have a valid "message" object
    And The recorded request header should have action "subscribe"
    And The recorded request should pass OpenAPI validation

  # ============================================
  # HEADER COMPLIANCE TESTS
  # ============================================

  @smoke @req=SPDCI-CL-AUTH-01
  Scenario: Client includes Authorization header
    Given The mock registry is ready and recordings are cleared
    When The client sends a search request
    Then The recorded request should have an "Authorization" header
    And The Authorization header should be a Bearer token

  @smoke @req=SPDCI-CL-CONTENTTYPE-01
  Scenario: Client sends correct Content-Type header
    Given The mock registry is ready and recordings are cleared
    When The client sends a search request
    Then The recorded request should have a "Content-Type" header
    And The Content-Type header should be "application/json"

  # ============================================
  # MESSAGE STRUCTURE TESTS
  # ============================================

  @smoke @req=SPDCI-CL-HEADER-VERSION-01
  Scenario: Client sends correct header version
    Given The mock registry is ready and recordings are cleared
    When The client sends a search request
    Then The recorded request header should have version "1.0.0"

  @smoke @req=SPDCI-CL-HEADER-SENDERID-01
  Scenario: Client includes sender_id in header
    Given The mock registry is ready and recordings are cleared
    When The client sends a search request
    Then The recorded request header should have a non-empty "sender_id"

  @smoke @req=SPDCI-CL-HEADER-RECEIVERID-01
  Scenario: Client includes receiver_id in header
    Given The mock registry is ready and recordings are cleared
    When The client sends a search request
    Then The recorded request header should have a non-empty "receiver_id"

  @smoke @req=SPDCI-CL-HEADER-SENDERURI-01
  Scenario: Client includes sender_uri for async requests
    Given The mock registry is ready and recordings are cleared
    When The client sends a search request
    Then The recorded request header should have a valid "sender_uri" URL

  @smoke @req=SPDCI-CL-MSG-TXNID-01
  Scenario: Client includes transaction_id in message
    Given The mock registry is ready and recordings are cleared
    When The client sends a search request
    Then The recorded request message should have a non-empty "transaction_id"
