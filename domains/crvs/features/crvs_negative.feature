@profile=crvs-registry @tier=core
Feature: CRVS Registry rejects schema-invalid requests

These scenarios verify CORE error-handling interoperability for invalid requests.
Acceptable behaviors:
- HTTP 4xx with HttpErrorResponse, OR
- HTTP 200 with Response where message.ack_status = ERR

  @smoke @method=POST @endpoint=registry/search @req=CRVS-CORE-RG-ASYNC-SEARCH-NEG-01
  Scenario: Async search rejects schema-invalid request
    Given A valid CRVS "async search" request payload is prepared
    When The CRVS payload is made invalid by removing "message"
    And The invalid CRVS "async search" request is sent
    Then The CRVS implementation should reject the invalid request

  @smoke @method=POST @endpoint=registry/subscribe @req=CRVS-CORE-RG-SUBSCRIBE-NEG-01
  Scenario: Subscribe rejects schema-invalid request
    Given A valid CRVS "subscribe" request payload is prepared
    When The CRVS payload is made invalid by removing "message"
    And The invalid CRVS "subscribe" request is sent
    Then The CRVS implementation should reject the invalid request

  @smoke @method=POST @endpoint=registry/sync/search @req=CRVS-CORE-RG-SYNC-SEARCH-NEG-01
  Scenario: Sync search rejects schema-invalid request
    Given A valid CRVS "sync search" request payload is prepared
    When The CRVS payload is made invalid by removing "message"
    And The invalid CRVS "sync search" request is sent
    Then The CRVS implementation should reject the invalid request
