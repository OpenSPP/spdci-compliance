@profile=dr-registry @tier=core
Feature: DR registry search

  @smoke @method=POST @endpoint=registry/search @req=DR-CORE-RG-ASYNC-SEARCH-01
  Scenario: Successfully submit async search request to DR
    Given System wants to async search the registry
    When A POST request to async search is sent
    Then The async search response should be received
    And The async search response should have status 200 or 202
    And The async search response should have "Content-Type": "application/json" header
    And The async search response should match the expected JSON schema

  @smoke @method=POST @endpoint=registry/sync/search @req=DR-CORE-RG-SYNC-SEARCH-01
  Scenario: Successfully submit sync search request to DR
    Given System wants to sync search the registry
    When A POST request to sync search is sent
    Then The sync search response should be received
    And The sync search response should have status 200
    And The sync search response should have "Content-Type": "application/json" header
    And The sync search response should match the expected JSON schema

  @smoke @method=POST @endpoint=registry/search @req=DR-CORE-RG-SEARCH-EXPRESSION-01
  Scenario: Async search with expression query
    Given System wants to search the registry using expression query
    When A POST request to async search is sent with expression query
    Then The expression search response should be received
    And The expression search response should have status 200 or 202
    And The expression search response should match the expected JSON schema

  @smoke @method=POST @endpoint=registry/search @req=DR-CORE-RG-SEARCH-PREDICATE-01
  Scenario: Async search with predicate query
    Given System wants to search the registry using predicate query
    When A POST request to async search is sent with predicate query
    Then The predicate search response should be received
    And The predicate search response should have status 200 or 202
    And The predicate search response should match the expected JSON schema
