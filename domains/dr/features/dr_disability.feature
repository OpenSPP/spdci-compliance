@profile=dr-registry @tier=core
Feature: DR disability-specific sync endpoints

  @smoke @method=POST @endpoint=registry/sync/disabled @req=DR-CORE-RG-SYNC-DISABLED-01
  Scenario: Successfully check disability status
    Given System wants to check disability status in DR
    When A POST request to DR disability status is sent
    Then The DR disability status response should be received
    And The DR disability status response should have status 200
    And The DR disability status response should have "Content-Type": "application/json" header
    And The DR disability status response should match the expected JSON schema
    And The DR disability status response should contain disabled_status

  @smoke @method=POST @endpoint=registry/sync/get-disability-details @req=DR-CORE-RG-SYNC-DISABILITY-DETAILS-01
  Scenario: Successfully get disability details
    Given System wants to get disability details from DR
    When A POST request to DR disability details is sent
    Then The DR disability details response should be received
    And The DR disability details response should have status 200
    And The DR disability details response should have "Content-Type": "application/json" header
    And The DR disability details response should match the expected JSON schema
    And The DR disability details response should contain disability details records

  @smoke @method=POST @endpoint=registry/sync/get-disability-support @req=DR-CORE-RG-SYNC-DISABILITY-SUPPORT-01
  Scenario: Successfully get disability support
    Given System wants to get disability support from DR
    When A POST request to DR disability support is sent
    Then The DR disability support response should be received
    And The DR disability support response should have status 200
    And The DR disability support response should have "Content-Type": "application/json" header
    And The DR disability support response should match the expected JSON schema
    And The DR disability support response should contain disability support records
