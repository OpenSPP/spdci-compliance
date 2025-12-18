@profile=fr-registry @tier=core @method=POST @endpoint=registry/sync/txn/status
Feature: FR sync transaction status

This feature validates that a Farmer Registry implementation
supports sync transaction status requests.

  @smoke @req=FR-CORE-RG-SYNC-TXNSTATUS-01
  Scenario: Successfully request sync transaction status
    Given System wants to check sync transaction status in FR
    When A POST request to sync txn status is sent
    Then The sync txn status response should be received
    And The sync txn status response should have status 200 or 202
    And The sync txn status response should have "content-type": "application/json" header
    And The sync txn status response should be returned in a timely manner
    And The sync txn status response should match the expected JSON schema
