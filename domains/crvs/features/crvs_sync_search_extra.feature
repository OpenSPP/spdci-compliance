@profile=crvs-registry @tier=core @method=POST @endpoint=registry/sync/search
Feature: CRVS sync search extra validation

This feature validates additional sync search response structure
for CRVS implementations.

  @smoke @req=CRVS-CORE-RG-SYNC-SEARCH-EXTRA-01
  Scenario: Sync search response contains reg_records
    Given System wants to validate sync search response in CRVS
    When A POST request to sync search is sent
    Then The sync search response should be received
    And The sync search response should have status 200 or 202
    And The sync search response should contain reg_records array
