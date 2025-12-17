@profile=spmis-subscriber @tier=core @method=POST @endpoint=registry/txn/on-status
Feature: Get transaction status

This API is to be exposed by the SR.
It will be called by the SP systems or other registries.

    @smoke @req=SR-CORE-SP-TXN-ON-STATUS-01
    Scenario: Successfully receive async txn status result from SR
        Given SP has previously sent a txn status request to SR
        When SR completes processing and calls SP txn on-status callback
        Then SP should receive the txn on-status response from SR
        And The txn on-status response should have status 200
        And The txn on-status response should have "Content-Type": "application/json" header
        And The txn on-status response should be returned in a timely manner 15000ms
        And The txn on-status response should match json schema
