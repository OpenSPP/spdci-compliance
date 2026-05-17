@profile=dr-subscriber @tier=core
Feature: DR callback receivers

This feature validates that an SPMIS subscriber implementation
can receive Disability Registry callbacks.

  @smoke @method=POST @endpoint=registry/on-search @req=DR-CORE-RG-ON-SEARCH-01
  Scenario: Successfully receive on-search callback
    Given The registry wants to send an on-search callback
    When A POST request to on-search callback is sent
    Then The on-search callback response should be received
    And The on-search callback response should have status 200 or 202
    And The on-search callback response should have "Content-Type": "application/json" header
    And The on-search callback response should match the expected JSON schema

  @smoke @method=POST @endpoint=registry/on-subscribe @req=DR-CORE-RG-ON-SUBSCRIBE-01
  Scenario: Successfully receive on-subscribe callback
    Given The registry wants to send an on-subscribe callback
    When A POST request to on-subscribe callback is sent
    Then The on-subscribe callback response should be received
    And The on-subscribe callback response should have status 200 or 202
    And The on-subscribe callback response should have "Content-Type": "application/json" header
    And The on-subscribe callback response should match the expected JSON schema

  @smoke @method=POST @endpoint=registry/on-unsubscribe @req=DR-CORE-RG-ON-UNSUBSCRIBE-01
  Scenario: Successfully receive on-unsubscribe callback
    Given The registry wants to send an on-unsubscribe callback
    When A POST request to on-unsubscribe callback is sent
    Then The on-unsubscribe callback response should be received
    And The on-unsubscribe callback response should have status 200 or 202
    And The on-unsubscribe callback response should have "Content-Type": "application/json" header
    And The on-unsubscribe callback response should match the expected JSON schema

  @smoke @method=POST @endpoint=registry/txn/on-status @req=DR-CORE-RG-TXN-ON-STATUS-01
  Scenario: Successfully receive txn on-status callback
    Given The registry wants to send a txn on-status callback
    When A POST request to txn on-status callback is sent
    Then The txn on-status callback response should be received
    And The txn on-status callback response should have status 200 or 202
    And The txn on-status callback response should have "Content-Type": "application/json" header
    And The txn on-status callback response should match the expected JSON schema

  @smoke @method=POST @endpoint=registry/notify @req=DR-CORE-RG-NOTIFY-01
  Scenario: Successfully receive notify callback
    Given The registry wants to send a notify callback
    When A POST request to notify callback is sent
    Then The notify callback response should be received
    And The notify callback response should have status 200 or 202
    And The notify callback response should have "Content-Type": "application/json" header
    And The notify callback response should match the expected JSON schema
