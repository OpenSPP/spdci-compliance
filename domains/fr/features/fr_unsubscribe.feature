@profile=fr-registry @tier=core @method=POST @endpoint=registry/unsubscribe
Feature: Unsubscribe from FR events

This API is to be exposed by the Farmer Registry.
Allows systems to unsubscribe from previously subscribed events.

    @smoke @req=FR-CORE-RG-UNSUBSCRIBE-01
    Scenario: Successfully unsubscribe from FR events
        Given System wants to unsubscribe from FR events
        When A POST request to FR unsubscribe is sent
        Then The response from the FR unsubscribe should be received
        And The FR unsubscribe response should have status 200 or 202
        And The FR unsubscribe response should have "Content-Type": "application/json" header
        And The FR unsubscribe response should have ack_status ACK or NACK
