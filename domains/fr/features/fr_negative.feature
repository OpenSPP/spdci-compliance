@profile=fr-registry @tier=core
Feature: FR Registry rejects schema-invalid requests

These scenarios verify CORE error-handling interoperability for invalid requests.
Acceptable behaviors:
- HTTP 4xx with HttpErrorResponse, OR
- HTTP 200 with Response where message.ack_status = ERR

  @smoke @method=POST @endpoint=registry/search @req=FR-CORE-RG-ASYNC-SEARCH-NEG-01
  Scenario: Async search rejects schema-invalid request
    Given A valid FR "async search" request payload is prepared
    When The FR payload is made invalid by removing "message"
    And The invalid FR "async search" request is sent
    Then The FR implementation should reject the invalid request

  @smoke @method=POST @endpoint=registry/subscribe @req=FR-CORE-RG-SUBSCRIBE-NEG-01
  Scenario: Subscribe rejects schema-invalid request
    Given A valid FR "subscribe" request payload is prepared
    When The FR payload is made invalid by removing "message"
    And The invalid FR "subscribe" request is sent
    Then The FR implementation should reject the invalid request

  @smoke @method=POST @endpoint=registry/sync/search @req=FR-CORE-RG-SYNC-SEARCH-NEG-01
  Scenario: Sync search rejects schema-invalid request
    Given A valid FR "sync search" request payload is prepared
    When The FR payload is made invalid by removing "message"
    And The invalid FR "sync search" request is sent
    Then The FR implementation should reject the invalid request
