@profile=dr-registry @tier=core
Feature: DR subscriptions

  @smoke @method=POST @endpoint=registry/subscribe @req=DR-CORE-RG-SUBSCRIBE-01
  Scenario: Successfully subscribe to DR events
    Given System wants to subscribe to the registry events
    When A POST request to subscribe is sent
    Then The subscribe response should be received
    And The subscribe response should have status 200 or 202
    And The subscribe response should have "Content-Type": "application/json" header
    And The subscribe response should match the expected JSON schema

  @smoke @method=POST @endpoint=registry/unsubscribe @req=DR-CORE-RG-UNSUBSCRIBE-01
  Scenario: Successfully unsubscribe from DR events
    Given System wants to unsubscribe from the registry events
    When A POST request to unsubscribe is sent
    Then The unsubscribe response should be received
    And The unsubscribe response should have status 200 or 202
    And The unsubscribe response should have "Content-Type": "application/json" header
    And The unsubscribe response should match the expected JSON schema
