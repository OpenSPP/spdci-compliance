@profile=fr-registry @tier=core @method=POST @endpoint=registry/txn/on-status
Feature: FR txn on-status callback receiver

This feature validates that a Farmer Registry implementation
can receive txn on-status callbacks.

  @smoke @req=FR-CORE-RG-TXN-ON-STATUS-01
  Scenario: Successfully receive txn on-status callback
    Given FR wants to send a txn on-status callback
    When A POST request to txn on-status callback is sent
    Then The txn on-status callback response should be received
    And The txn on-status callback response should have status 200 or 202
    And The txn on-status callback response should have "content-type": "application/json" header
    And The txn on-status callback response should be returned in a timely manner
    And The txn on-status callback response should match the expected JSON schema
