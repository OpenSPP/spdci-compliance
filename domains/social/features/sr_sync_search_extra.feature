@profile=sr-registry @tier=extra @method=POST @endpoint=registry/sync/search
Feature: Extra (non-normative) checks for reg_records

This feature contains optional checks that go beyond the OpenAPI schema.
It is not required for CORE compliance.

    @functional @req=SR-EXTRA-RG-SYNC-SEARCH-REGRECORDS-01
    Scenario: Validate the structure of reg_records in search response
        Given System has sent a sync search request for SR person for a functional test
        When A POST request to sync search is sent Functional Test
        Then The response from the sync search should be received Functional Test
        And The sync search response should contain a reg_records array Functional Test
        And Each item in the reg_records array should match the defined JSON schema Functional Test
