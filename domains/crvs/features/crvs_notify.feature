@profile=crvs-registry @tier=core @method=POST @endpoint=registry/notify
Feature: CRVS notify callback receiver

This feature validates that a CRVS implementation
can receive notify callbacks.

  @smoke @req=CRVS-CORE-RG-NOTIFY-01
  Scenario: Successfully receive notify callback
    Given CRVS wants to send a notify callback
    When A POST request to notify callback is sent
    Then The notify callback response should be received
    And The notify callback response should have status 200 or 202
    And The notify callback response should have "content-type": "application/json" header
    And The notify callback response should be returned in a timely manner
    And The notify callback response should match the expected JSON schema
