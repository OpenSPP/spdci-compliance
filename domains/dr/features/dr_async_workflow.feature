@profile=dr-registry @tier=core @needs-callback
Feature: DR async workflow callbacks

  @smoke @req=DR-CORE-RG-ASYNC-SEARCH-CB-01
  Scenario: Async search triggers on-search callback
    Given Callback receiver is ready
    When SP sends an async search request to the registry expecting a callback
    Then The registry should respond with ACK for the async request
    And The registry should call the on-search callback with matching ids

  @smoke @req=DR-CORE-RG-ASYNC-SUBSCRIBE-CB-01
  Scenario: Async subscribe triggers on-subscribe callback
    Given Callback receiver is ready
    When SP sends an async subscribe request to the registry expecting a callback
    Then The registry should respond with ACK for the async request
    And The registry should call the on-subscribe callback with matching ids

  @smoke @req=DR-CORE-RG-ASYNC-UNSUBSCRIBE-CB-01
  Scenario: Async unsubscribe triggers on-unsubscribe callback
    Given Callback receiver is ready
    When SP sends an async unsubscribe request to the registry expecting a callback
    Then The registry should respond with ACK for the async request
    And The registry should call the on-unsubscribe callback with matching ids

  @smoke @req=DR-CORE-RG-ASYNC-TXN-STATUS-CB-01
  Scenario: Async txn status triggers txn on-status callback
    Given Callback receiver is ready
    When SP sends an async txn status request to the registry expecting a callback
    Then The registry should respond with ACK for the async request
    And The registry should call the txn on-status callback with matching ids
