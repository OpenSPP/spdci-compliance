@profile=sr-registry @tier=core @method=POST @endpoint=registry/sync/search
Feature: Search perspn from SR based on specific criteria

This API is to be exposed by the SR.
It will be called by the SP systems or other registries.

    @smoke @req=SR-CORE-RG-SYNC-SEARCH-01
    Scenario: Successfully search SR to be processed
        Given System wants to sync search for person in SR
        When A POST request to sync search is sent
        Then The response from the sync search should be received
        And The sync search response should have status 200
        And The sync search response should have "Content-Type": "application/json" header
        And The sync search response should be returned in a timely manner within 15000ms
        And The sync search response should match the expected JSON schema
