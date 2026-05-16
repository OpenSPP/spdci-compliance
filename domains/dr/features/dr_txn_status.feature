@profile=dr-registry @tier=core
Feature: DR transaction status

  @smoke @method=POST @endpoint=registry/txn/status @req=DR-CORE-RG-TXN-STATUS-01
  Scenario: Successfully request async transaction status
    Given System wants to check async transaction status in the registry
    When A POST request to async txn status is sent
    Then The async txn status response should be received
    And The async txn status response should have status 200 or 202
    And The async txn status response should have "Content-Type": "application/json" header
    And The async txn status response should match the expected JSON schema
