@profile=fr-registry @tier=core @needs-callback
Feature: FR async workflow callbacks

This feature validates that a Farmer Registry implementation:
- ACKs async requests, and
- delivers the corresponding callback to the sender_uri endpoint.

  @smoke @req=FR-CORE-RG-ASYNC-SEARCH-CB-01
  Scenario: Async search triggers on-search callback
    Given Callback receiver is ready
    When SP sends an async search request to FR expecting a callback
    Then FR should respond with ACK for the async request
    And FR should call the on-search callback with matching ids

  @smoke @req=FR-CORE-RG-ASYNC-SUBSCRIBE-CB-01
  Scenario: Async subscribe triggers on-subscribe callback
    Given Callback receiver is ready
    When SP sends an async subscribe request to FR expecting a callback
    Then FR should respond with ACK for the async request
    And FR should call the on-subscribe callback with matching ids

  @smoke @req=FR-CORE-RG-ASYNC-UNSUBSCRIBE-CB-01
  Scenario: Async unsubscribe triggers on-unsubscribe callback
    Given Callback receiver is ready
    When SP sends an async unsubscribe request to FR expecting a callback
    Then FR should respond with ACK for the async request
    And FR should call the on-unsubscribe callback with matching ids

  @smoke @req=FR-CORE-RG-ASYNC-TXNSTATUS-CB-01
  Scenario: Async txn status triggers txn on-status callback
    Given Callback receiver is ready
    When SP sends an async txn status request to FR expecting a callback
    Then FR should respond with ACK for the async request
    And FR should call the txn on-status callback with matching ids
