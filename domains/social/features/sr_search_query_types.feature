@profile=sr-registry @tier=core @method=POST
Feature: Search SR using different query types

The Social API spec supports three query types for searching:
- idtype-value: Search by identifier type and value (e.g., UIN)
- expression: NoSQL-style query expressions
- predicate: Attribute-based predicate expressions

These tests validate that the SR implementation accepts all query types.

    @smoke @endpoint=registry/search @req=SR-CORE-RG-ASYNC-SEARCH-EXPRESSION-01
    Scenario: Successfully search SR using expression query type
        Given System wants to search SR using expression query
        When A POST request to search is sent with expression query
        Then The response from the expression search should be received
        And The expression search response should have status 200 or 202
        And The expression search response should have "Content-Type": "application/json" header
        And The expression search response should be returned in a timely manner
        And The expression search response should match the expected JSON schema

    @smoke @endpoint=registry/search @req=SR-CORE-RG-ASYNC-SEARCH-PREDICATE-01
    Scenario: Successfully search SR using predicate query type
        Given System wants to search SR using predicate query
        When A POST request to search is sent with predicate query
        Then The response from the predicate search should be received
        And The predicate search response should have status 200 or 202
        And The predicate search response should have "Content-Type": "application/json" header
        And The predicate search response should be returned in a timely manner
        And The predicate search response should match the expected JSON schema

    @smoke @endpoint=registry/sync/search @req=SR-CORE-RG-SYNC-SEARCH-EXPRESSION-01
    Scenario: Successfully sync search SR using expression query type
        Given System wants to sync search SR using expression query
        When A POST request to sync search is sent with expression query
        Then The response from the sync expression search should be received
        And The sync expression search response should have status 200
        And The sync expression search response should have "Content-Type": "application/json" header
        And The sync expression search response should be returned in a timely manner
        And The sync expression search response should match the expected JSON schema

    @smoke @endpoint=registry/sync/search @req=SR-CORE-RG-SYNC-SEARCH-PREDICATE-01
    Scenario: Successfully sync search SR using predicate query type
        Given System wants to sync search SR using predicate query
        When A POST request to sync search is sent with predicate query
        Then The response from the sync predicate search should be received
        And The sync predicate search response should have status 200
        And The sync predicate search response should have "Content-Type": "application/json" header
        And The sync predicate search response should be returned in a timely manner
        And The sync predicate search response should match the expected JSON schema
