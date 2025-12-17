@profile=spmis-subscriber @tier=core @method=POST @endpoint=registry/notify
Feature: Receive registry notifications from SR

This API is exposed by SPMIS to receive registry event notifications from SR.

    @smoke @req=SR-CORE-SP-NOTIFY-01
    Scenario: Successfully receive notify event from SR
        Given SR has an event to notify subscribers
        When SR calls SP notify endpoint
        Then SP should receive the notify response from SR
        And The notify response should have status 200
        And The notify response should have "Content-Type": "application/json" header
        And The notify response should be received within 15000ms
        And The notify response should match the expected JSON schema

