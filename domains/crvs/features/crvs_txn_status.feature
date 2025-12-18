@profile=crvs-registry @tier=core @method=POST @endpoint=registry/txn/status
Feature: Check transaction status in CRVS

This API is to be exposed by the CRVS registry.
Allows systems to check the status of previously submitted transactions.

    @smoke @req=CRVS-CORE-RG-TXN-STATUS-01
    Scenario: Successfully check transaction status in CRVS
        Given System wants to check transaction status in CRVS
        When A POST request to CRVS txn status is sent
        Then The response from the CRVS txn status should be received
        And The CRVS txn status response should have status 200 or 202
        And The CRVS txn status response should have "Content-Type": "application/json" header
