@profile=crvs-registry @tier=core @method=POST @endpoint=registry/unsubscribe
Feature: Unsubscribe from CRVS events

This API is to be exposed by the CRVS registry.
Allows systems to unsubscribe from previously subscribed events.

    @smoke @req=CRVS-CORE-RG-UNSUBSCRIBE-01
    Scenario: Successfully unsubscribe from CRVS events
        Given System wants to unsubscribe from CRVS events
        When A POST request to CRVS unsubscribe is sent
        Then The response from the CRVS unsubscribe should be received
        And The CRVS unsubscribe response should have status 200 or 202
        And The CRVS unsubscribe response should have "Content-Type": "application/json" header
        And The CRVS unsubscribe response should have ack_status ACK or NACK
