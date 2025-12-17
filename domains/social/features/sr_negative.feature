@profile=sr-registry @tier=core
Feature: SR Registry rejects schema-invalid requests

These scenarios verify CORE error-handling interoperability for invalid requests.
Acceptable behaviors:
- HTTP 4xx with HttpErrorResponse, OR
- HTTP 200 with Response where message.ack_status = ERR

  @smoke @method=POST @endpoint=registry/search @req=SR-CORE-RG-ASYNC-SEARCH-NEG-01
  Scenario: Async search rejects schema-invalid request
    Given A valid "async search" request payload is prepared
    When The payload is made invalid by removing "message"
    And The invalid "async search" request is sent
    Then The implementation should reject the invalid request

  @smoke @method=POST @endpoint=registry/subscribe @req=SR-CORE-RG-ASYNC-SUBSCRIBE-NEG-01
  Scenario: Async subscribe rejects schema-invalid request
    Given A valid "async subscribe" request payload is prepared
    When The payload is made invalid by removing "message"
    And The invalid "async subscribe" request is sent
    Then The implementation should reject the invalid request

  @smoke @method=POST @endpoint=registry/unsubscribe @req=SR-CORE-RG-ASYNC-UNSUBSCRIBE-NEG-01
  Scenario: Async unsubscribe rejects schema-invalid request
    Given A valid "async unsubscribe" request payload is prepared
    When The payload is made invalid by removing "message"
    And The invalid "async unsubscribe" request is sent
    Then The implementation should reject the invalid request

  @smoke @method=POST @endpoint=registry/txn/status @req=SR-CORE-RG-ASYNC-TXNSTATUS-NEG-01
  Scenario: Async txn status rejects schema-invalid request
    Given A valid "async txn status" request payload is prepared
    When The payload is made invalid by removing "message"
    And The invalid "async txn status" request is sent
    Then The implementation should reject the invalid request

  @smoke @method=POST @endpoint=registry/sync/search @req=SR-CORE-RG-SYNC-SEARCH-NEG-01
  Scenario: Sync search rejects schema-invalid request
    Given A valid "sync search" request payload is prepared
    When The payload is made invalid by removing "message"
    And The invalid "sync search" request is sent
    Then The implementation should reject the invalid request

  @smoke @method=POST @endpoint=registry/sync/txn/status @req=SR-CORE-RG-SYNC-TXNSTATUS-NEG-01
  Scenario: Sync txn status rejects schema-invalid request
    Given A valid "sync txn status" request payload is prepared
    When The payload is made invalid by removing "message"
    And The invalid "sync txn status" request is sent
    Then The implementation should reject the invalid request

