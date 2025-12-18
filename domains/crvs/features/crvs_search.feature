@profile=crvs-registry @tier=core @method=POST @endpoint=registry/search
Feature: Async search person from CRVS

This API is to be exposed by the CRVS registry.
Accepts search requests and returns ACK, with results delivered via callback.

    @smoke @req=CRVS-CORE-RG-ASYNC-SEARCH-01
    Scenario: Successfully submit async search request to CRVS
        Given System wants to async search for person in CRVS
        When A POST request to CRVS async search is sent
        Then The response from the CRVS async search should be received
        And The CRVS async search response should have status 200 or 202
        And The CRVS async search response should have "Content-Type": "application/json" header
        And The CRVS async search response should have ack_status ACK
