@profile=crvs-registry @tier=core @method=POST @endpoint=registry/subscribe
Feature: Subscribe to CRVS events

This API is to be exposed by the CRVS registry.
Allows systems to subscribe to vital events (birth, death, marriage, etc.).

    @smoke @req=CRVS-CORE-RG-SUBSCRIBE-01
    Scenario: Successfully subscribe to CRVS events
        Given System wants to subscribe to CRVS events
        When A POST request to CRVS subscribe is sent
        Then The response from the CRVS subscribe should be received
        And The CRVS subscribe response should have status 200 or 202
        And The CRVS subscribe response should have "Content-Type": "application/json" header
        And The CRVS subscribe response should have ack_status ACK
