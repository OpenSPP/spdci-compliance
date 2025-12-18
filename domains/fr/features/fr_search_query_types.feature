@profile=fr-registry @tier=core @method=POST @endpoint=registry/search
Feature: FR search query types

This feature validates that a Farmer Registry implementation
supports different query types: expression and predicate.

  @smoke @req=FR-CORE-RG-SEARCH-EXPRESSION-01
  Scenario: Async search with expression query
    Given System wants to search FR using expression query
    When A POST request to async search is sent with expression query
    Then The expression search response should be received
    And The expression search response should have status 200 or 202
    And The expression search response should have "content-type": "application/json" header
    And The expression search response should be returned in a timely manner
    And The expression search response should match the expected JSON schema

  @smoke @req=FR-CORE-RG-SEARCH-PREDICATE-01
  Scenario: Async search with predicate query
    Given System wants to search FR using predicate query
    When A POST request to async search is sent with predicate query
    Then The predicate search response should be received
    And The predicate search response should have status 200 or 202
    And The predicate search response should have "content-type": "application/json" header
    And The predicate search response should be returned in a timely manner
    And The predicate search response should match the expected JSON schema

  @smoke @req=FR-CORE-RG-SYNC-SEARCH-EXPRESSION-01
  Scenario: Sync search with expression query
    Given System wants to sync search FR using expression query
    When A POST request to sync search is sent with expression query
    Then The sync search response should be received
    And The sync search response should have status 200 or 202
    And The sync search response should have "content-type": "application/json" header
    And The sync search response should be returned in a timely manner
    And The sync search response should match the expected JSON schema

  @smoke @req=FR-CORE-RG-SYNC-SEARCH-PREDICATE-01
  Scenario: Sync search with predicate query
    Given System wants to sync search FR using predicate query
    When A POST request to sync search is sent with predicate query
    Then The sync search response should be received
    And The sync search response should have status 200 or 202
    And The sync search response should have "content-type": "application/json" header
    And The sync search response should be returned in a timely manner
    And The sync search response should match the expected JSON schema
