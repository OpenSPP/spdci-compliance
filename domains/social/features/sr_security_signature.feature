@tier=security @signature
Feature: SPDCI signature verification (optional)

These scenarios check whether an implementation rejects invalid message signatures.
They require an Authorization header to avoid failing earlier on auth.

  @profile=sr-registry @smoke @method=POST @endpoint=registry/search @req=SR-SEC-SIG-RG-01
  Scenario: SR Registry - Async search rejects invalid signature
    Given A valid "async search" request payload is prepared for signature testing
    When The request signature is set to an invalid value
    And The "async search" request is sent with the invalid signature
    Then The request should be rejected due to invalid signature

  @profile=spmis-subscriber @smoke @method=POST @endpoint=registry/notify @req=SR-SEC-SIG-SP-01
  Scenario: SPMIS Subscriber - Notify rejects invalid signature
    Given A valid "notify" request payload is prepared for signature testing
    When The request signature is set to an invalid value
    And The "notify" request is sent with the invalid signature
    Then The request should be rejected due to invalid signature

