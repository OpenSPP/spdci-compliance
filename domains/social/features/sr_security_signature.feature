@profile=sr-registry @tier=security @signature
Feature: SR Registry signature verification (optional)

These scenarios check whether an implementation rejects invalid message signatures.
They require an Authorization header to avoid failing earlier on auth.

  @smoke @method=POST @endpoint=registry/search @req=SR-SEC-SIG-RG-01
  Scenario: Async search rejects invalid signature
    Given A valid "async search" request payload is prepared for signature testing
    When The request signature is set to an invalid value
    And The "async search" request is sent with the invalid signature
    Then The request should be rejected due to invalid signature

