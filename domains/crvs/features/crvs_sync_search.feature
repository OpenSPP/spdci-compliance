@profile=crvs-registry @tier=core @method=POST @endpoint=registry/sync/search
Feature: Search person from CRVS based on specific criteria

This API is to be exposed by the CRVS.
It will be called by the SP systems or other registries.

    @smoke @req=CRVS-CORE-RG-SYNC-SEARCH-01
    Scenario: Successfully search CRVS to be processed
        Given System wants to sync search for person in CRVS
        When A POST request to CRVS sync search is sent
        Then The response from the CRVS sync search should be received
        And The CRVS sync search response should have status 200
        And The CRVS sync search response should have "Content-Type": "application/json" header
        And The CRVS sync search response should be returned in a timely manner
        And The CRVS sync search response should match the expected JSON schema
