@profile=fr-registry @tier=security
Feature: FR Registry bearer auth enforcement

These scenarios verify SECURITY behavior for bearer auth as defined by the OpenAPI spec.

  @smoke @method=POST @endpoint=registry/search @req=FR-SEC-AUTH-RG-ASYNC-SEARCH-01
  Scenario: Async search enforces bearer auth
    Given A valid 'async search' request payload is prepared for auth testing
    When The 'async search' request is sent without Authorization
    Then The request should be rejected as unauthorized

  @smoke @method=POST @endpoint=registry/subscribe @req=FR-SEC-AUTH-RG-ASYNC-SUBSCRIBE-01
  Scenario: Async subscribe enforces bearer auth
    Given A valid 'async subscribe' request payload is prepared for auth testing
    When The 'async subscribe' request is sent without Authorization
    Then The request should be rejected as unauthorized

  @smoke @method=POST @endpoint=registry/unsubscribe @req=FR-SEC-AUTH-RG-ASYNC-UNSUBSCRIBE-01
  Scenario: Async unsubscribe enforces bearer auth
    Given A valid 'async unsubscribe' request payload is prepared for auth testing
    When The 'async unsubscribe' request is sent without Authorization
    Then The request should be rejected as unauthorized

  @smoke @method=POST @endpoint=registry/txn/status @req=FR-SEC-AUTH-RG-ASYNC-TXNSTATUS-01
  Scenario: Async txn status enforces bearer auth
    Given A valid 'async txn status' request payload is prepared for auth testing
    When The 'async txn status' request is sent without Authorization
    Then The request should be rejected as unauthorized

  @smoke @method=POST @endpoint=registry/sync/search @req=FR-SEC-AUTH-RG-SYNC-SEARCH-01
  Scenario: Sync search enforces bearer auth
    Given A valid 'sync search' request payload is prepared for auth testing
    When The 'sync search' request is sent without Authorization
    Then The request should be rejected as unauthorized

  @smoke @method=POST @endpoint=registry/sync/txn/status @req=FR-SEC-AUTH-RG-SYNC-TXNSTATUS-01
  Scenario: Sync txn status enforces bearer auth
    Given A valid 'sync txn status' request payload is prepared for auth testing
    When The 'sync txn status' request is sent without Authorization
    Then The request should be rejected as unauthorized
