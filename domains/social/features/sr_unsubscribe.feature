@profile=sr-registry @tier=core @method=POST @endpoint=registry/unsubscribe
Feature: Unsubscribe from SR based on specific criteria

This API is to be exposed by the SR.
It will be called by the SP systems or other registeries .

    @smoke @req=SR-CORE-RG-ASYNC-UNSUBSCRIBE-01
    Scenario: Successfully unsubscribe from SR to be processed smoke type test
        Given System wanna unsubscribe from SR
        When POST request to unsubscribe is sent
        Then The response from the unsubscribe is received
        And The unsubscribe response should have status 200 or 202
        And The unsubscribe response should have "Content-Type": "application/json" header
        And The unsubscribe response should be returned in a timely manner 15000ms
        And The unsubscribe response should match json schema
