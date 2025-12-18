@profile=fr-registry @tier=security
Feature: FR Registry signature validation

These scenarios verify SECURITY behavior for message signature validation
as defined by the OpenAPI spec.

  @smoke @method=POST @endpoint=registry/search @req=FR-SEC-SIG-RG-ASYNC-SEARCH-01
  Scenario: Async search validates signature
    Given A valid 'async search' request payload is prepared for signature testing
    When The request signature is set to an invalid value
    And The 'async search' request is sent with the invalid signature
    Then The request should be rejected due to invalid signature

  @smoke @method=POST @endpoint=registry/sync/search @req=FR-SEC-SIG-RG-SYNC-SEARCH-01
  Scenario: Sync search validates signature
    Given A valid 'sync search' request payload is prepared for signature testing
    When The request signature is set to an invalid value
    And The 'sync search' request is sent with the invalid signature
    Then The request should be rejected due to invalid signature
