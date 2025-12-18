@profile=crvs-registry @tier=core @method=POST @endpoint=registry/txn/on-status
Feature: CRVS txn on-status callback receiver

This feature validates that a CRVS implementation
can receive txn on-status callbacks.

  @smoke @req=CRVS-CORE-RG-TXN-ON-STATUS-01
  Scenario: Successfully receive txn on-status callback
    Given CRVS wants to send a txn on-status callback
    When A POST request to txn on-status callback is sent
    Then The txn on-status callback response should be received
    And The txn on-status callback response should have status 200 or 202
    And The txn on-status callback response should have "content-type": "application/json" header
    And The txn on-status callback response should be returned in a timely manner
    And The txn on-status callback response should match the expected JSON schema
