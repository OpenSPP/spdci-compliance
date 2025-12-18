@profile=fr-subscriber @tier=core
Feature: FR Subscriber rejects schema-invalid callback requests

These scenarios verify CORE error-handling for FR subscriber endpoints.
Acceptable behaviors:
- HTTP 4xx with HttpErrorResponse, OR
- HTTP 200 with Response where message.ack_status = ERR

  @smoke @method=POST @endpoint=registry/on-search @req=FR-CORE-SP-ON-SEARCH-NEG-01
  Scenario: On-search callback rejects schema-invalid request
    Given A valid "on-search callback" request payload is prepared
    When The payload is made invalid by removing "message"
    And The invalid "on-search callback" request is sent
    Then The implementation should reject the invalid request

  @smoke @method=POST @endpoint=registry/on-subscribe @req=FR-CORE-SP-ON-SUBSCRIBE-NEG-01
  Scenario: On-subscribe callback rejects schema-invalid request
    Given A valid "on-subscribe callback" request payload is prepared
    When The payload is made invalid by removing "message"
    And The invalid "on-subscribe callback" request is sent
    Then The implementation should reject the invalid request

  @smoke @method=POST @endpoint=registry/on-unsubscribe @req=FR-CORE-SP-ON-UNSUBSCRIBE-NEG-01
  Scenario: On-unsubscribe callback rejects schema-invalid request
    Given A valid "on-unsubscribe callback" request payload is prepared
    When The payload is made invalid by removing "message"
    And The invalid "on-unsubscribe callback" request is sent
    Then The implementation should reject the invalid request

  @smoke @method=POST @endpoint=registry/txn/on-status @req=FR-CORE-SP-TXN-ON-STATUS-NEG-01
  Scenario: Txn on-status callback rejects schema-invalid request
    Given A valid "txn on-status callback" request payload is prepared
    When The payload is made invalid by removing "message"
    And The invalid "txn on-status callback" request is sent
    Then The implementation should reject the invalid request

  @smoke @method=POST @endpoint=registry/notify @req=FR-CORE-SP-NOTIFY-NEG-01
  Scenario: Notify rejects schema-invalid request
    Given A valid "notify" request payload is prepared
    When The payload is made invalid by removing "message"
    And The invalid "notify" request is sent
    Then The implementation should reject the invalid request
