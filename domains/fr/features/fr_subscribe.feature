@profile=fr-registry @tier=core @method=POST @endpoint=registry/subscribe
Feature: Subscribe to FR events

This API is to be exposed by the Farmer Registry.
Allows systems to subscribe to farmer registration events.

    @smoke @req=FR-CORE-RG-SUBSCRIBE-01
    Scenario: Successfully subscribe to FR events
        Given System wants to subscribe to FR events
        When A POST request to FR subscribe is sent
        Then The response from the FR subscribe should be received
        And The FR subscribe response should have status 200 or 202
        And The FR subscribe response should have "Content-Type": "application/json" header
        And The FR subscribe response should have ack_status ACK
