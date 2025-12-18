@profile=fr-registry @tier=core @method=POST @endpoint=registry/search
Feature: Async search farmer from FR

This API is to be exposed by the Farmer Registry.
Accepts search requests and returns ACK, with results delivered via callback.

    @smoke @req=FR-CORE-RG-ASYNC-SEARCH-01
    Scenario: Successfully submit async search request to FR
        Given System wants to async search for farmer in FR
        When A POST request to FR async search is sent
        Then The response from the FR async search should be received
        And The FR async search response should have status 200 or 202
        And The FR async search response should have "Content-Type": "application/json" header
        And The FR async search response should have ack_status ACK
