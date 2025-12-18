@profile=fr-client @tier=core
Feature: FR Client sends spec-compliant requests

These tests verify that an FR client implementation sends requests
that conform to the SPDCI Farmer Registry API specification.

Client compliance tests validate:
- Request payloads match OpenAPI schema
- Required headers are present
- Message structure is correct
- Query types are properly formatted

  # ============================================
  # CORE REQUEST VALIDATION
  # ============================================

  @smoke @method=POST @endpoint=registry/search @req=FR-CORE-CL-SEARCH-01
  Scenario: Client sends spec-valid search request
    Given The client prepares a search request
    When The request payload is built
    Then The search request payload should be OpenAPI-valid
    And The request should include a message body with search_request

  @smoke @method=POST @endpoint=registry/subscribe @req=FR-CORE-CL-SUBSCRIBE-01
  Scenario: Client sends spec-valid subscribe request
    Given The client prepares a subscribe request
    When The request payload is built
    Then The subscribe request payload should be OpenAPI-valid
    And The request should include a message body with subscribe_request

  @smoke @method=POST @endpoint=registry/unsubscribe @req=FR-CORE-CL-UNSUBSCRIBE-01
  Scenario: Client sends spec-valid unsubscribe request
    Given The client prepares an unsubscribe request
    When The request payload is built
    Then The unsubscribe request payload should be OpenAPI-valid
    And The request should include a message body with unsubscribe_request

  @smoke @method=POST @endpoint=registry/sync/search @req=FR-CORE-CL-SYNC-SEARCH-01
  Scenario: Client sends spec-valid sync search request
    Given The client prepares a sync search request
    When The request payload is built
    Then The sync search request payload should be OpenAPI-valid

  # ============================================
  # RESPONSE HANDLING
  # ============================================

  @smoke @method=POST @endpoint=registry/search @req=FR-CORE-CL-SEARCH-ACK-01
  Scenario: Client accepts ACK response from FR
    Given The client sends a valid search request
    When The server responds with ACK status
    Then The client should accept the ACK response
    And The response should contain correlation_id

  @smoke @method=POST @endpoint=registry/search @req=FR-CORE-CL-SEARCH-ERR-01
  Scenario: Client handles ERR response from FR
    Given The client sends a valid search request
    When The server responds with ERR status
    Then The client should handle the ERR response gracefully
    And The response should contain an error object

  # ============================================
  # HEADER COMPLIANCE
  # ============================================

  @smoke @method=POST @endpoint=registry/search @req=FR-CORE-CL-CONTENTTYPE-01
  Scenario: Client sends correct Content-Type header
    Given The client prepares a search request
    When The request headers are built
    Then The Content-Type header should be "application/json"

  @smoke @method=POST @endpoint=registry/search @req=FR-CORE-CL-HEADER-VERSION-01
  Scenario: Client sends correct header version
    Given The client prepares a search request
    When The request payload is built
    Then The header version should be "1.0.0"

  @smoke @method=POST @endpoint=registry/search @req=FR-CORE-CL-HEADER-SENDERID-01
  Scenario: Client includes sender_id in message header
    Given The client prepares a search request
    When The request payload is built
    Then The header should include sender_id

  @smoke @method=POST @endpoint=registry/search @req=FR-CORE-CL-HEADER-RECEIVERID-01
  Scenario: Client includes receiver_id in message header
    Given The client prepares a search request
    When The request payload is built
    Then The header should include receiver_id

  @smoke @method=POST @endpoint=registry/search @req=FR-CORE-CL-HEADER-SENDERURI-01
  Scenario: Client includes sender_uri for async callbacks
    Given The client prepares a search request with callback
    When The request payload is built with sender_uri
    Then The header should include sender_uri

  @smoke @method=POST @endpoint=registry/search @req=FR-CORE-CL-MSG-TXNID-01
  Scenario: Client includes transaction_id in message
    Given The client prepares a search request
    When The request payload is built
    Then The message should include transaction_id

  # ============================================
  # SECURITY COMPLIANCE
  # ============================================

  @tier=security @smoke @method=POST @endpoint=registry/search @req=FR-SEC-CL-AUTH-01
  Scenario: Client includes Authorization header with Bearer token
    Given The client prepares a search request
    When The request headers are built for authenticated endpoint
    Then The Authorization header should be present
    And The Authorization header should use Bearer scheme

  # ============================================
  # QUERY TYPE SUPPORT
  # ============================================

  @smoke @method=POST @endpoint=registry/search @req=FR-CORE-CL-QUERY-IDTYPE-01
  Scenario: Client can send idtype-value query
    Given The client prepares a search request with idtype-value query
    When The request payload is built
    Then The query type should be "idtype-value"
    And The query should contain type and value fields

  @smoke @method=POST @endpoint=registry/search @req=FR-CORE-CL-QUERY-EXPRESSION-01
  Scenario: Client can send expression query
    Given The client prepares a search request with expression query
    When The request payload is built
    Then The query type should be "expression"
    And The query should contain expression fields

  @smoke @method=POST @endpoint=registry/search @req=FR-CORE-CL-QUERY-PREDICATE-01
  Scenario: Client can send predicate query
    Given The client prepares a search request with predicate query
    When The request payload is built
    Then The query type should be "predicate"
    And The query should be an array of predicates
