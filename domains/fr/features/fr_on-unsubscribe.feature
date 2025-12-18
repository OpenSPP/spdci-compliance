@profile=fr-registry @tier=core @method=POST @endpoint=registry/on-unsubscribe
Feature: FR on-unsubscribe callback receiver

This feature validates that a Farmer Registry implementation
can receive on-unsubscribe callbacks.

  @smoke @req=FR-CORE-RG-ON-UNSUBSCRIBE-01
  Scenario: Successfully receive on-unsubscribe callback
    Given FR wants to send an on-unsubscribe callback
    When A POST request to on-unsubscribe callback is sent
    Then The on-unsubscribe callback response should be received
    And The on-unsubscribe callback response should have status 200 or 202
    And The on-unsubscribe callback response should have "content-type": "application/json" header
    And The on-unsubscribe callback response should be returned in a timely manner
    And The on-unsubscribe callback response should match the expected JSON schema
