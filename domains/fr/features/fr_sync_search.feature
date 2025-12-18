@profile=fr-registry @tier=core @method=POST @endpoint=registry/sync/search
Feature: Search farmer from FR based on specific criteria

This API is to be exposed by the Farmer Registry.
It will be called by the SP systems or other registries.

    @smoke @req=FR-CORE-RG-SYNC-SEARCH-01
    Scenario: Successfully search FR to be processed
        Given System wants to sync search for farmer in FR
        When A POST request to FR sync search is sent
        Then The response from the FR sync search should be received
        And The FR sync search response should have status 200
        And The FR sync search response should have "Content-Type": "application/json" header
        And The FR sync search response should be returned in a timely manner
        And The FR sync search response should match the expected JSON schema
