@profile=fr-registry @tier=core @method=POST @endpoint=registry/txn/status
Feature: Check transaction status in FR

This API is to be exposed by the Farmer Registry.
Allows systems to check the status of previously submitted transactions.

    @smoke @req=FR-CORE-RG-TXN-STATUS-01
    Scenario: Successfully check transaction status in FR
        Given System wants to check transaction status in FR
        When A POST request to FR txn status is sent
        Then The response from the FR txn status should be received
        And The FR txn status response should have status 200 or 202
        And The FR txn status response should have "Content-Type": "application/json" header
