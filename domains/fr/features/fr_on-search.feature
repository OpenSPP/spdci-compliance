@profile=fr-registry @tier=core @method=POST @endpoint=registry/on-search
Feature: FR on-search callback receiver

This feature validates that a Farmer Registry implementation
can receive on-search callbacks.

  @smoke @req=FR-CORE-RG-ON-SEARCH-01
  Scenario: Successfully receive on-search callback
    Given FR wants to send an on-search callback
    When A POST request to on-search callback is sent
    Then The on-search callback response should be received
    And The on-search callback response should have status 200 or 202
    And The on-search callback response should have "content-type": "application/json" header
    And The on-search callback response should be returned in a timely manner
    And The on-search callback response should match the expected JSON schema
