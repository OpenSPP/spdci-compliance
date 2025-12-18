@profile=fr-registry @tier=core @method=POST @endpoint=registry/on-subscribe
Feature: FR on-subscribe callback receiver

This feature validates that a Farmer Registry implementation
can receive on-subscribe callbacks.

  @smoke @req=FR-CORE-RG-ON-SUBSCRIBE-01
  Scenario: Successfully receive on-subscribe callback
    Given FR wants to send an on-subscribe callback
    When A POST request to on-subscribe callback is sent
    Then The on-subscribe callback response should be received
    And The on-subscribe callback response should have status 200 or 202
    And The on-subscribe callback response should have "content-type": "application/json" header
    And The on-subscribe callback response should be returned in a timely manner
    And The on-subscribe callback response should match the expected JSON schema
