@profile=sr-registry @tier=core
Feature: SPDCI pagination support

The SPDCI spec defines pagination with:
- page_size: Number of records per page
- page_number: Page number (starts at 1)

These tests verify pagination is properly supported.

  # ============================================
  # PAGINATION IN SEARCH REQUESTS
  # ============================================

  @method=POST @endpoint=registry/search @req=SR-CORE-PAG-01
  Scenario: Search request with pagination parameters
    Given A valid "async search" request payload is prepared with pagination
    When The pagination is set to page_size 10 and page_number 1
    And The paginated search request is sent
    Then The request should be accepted or processed
    And The response should acknowledge pagination

  @method=POST @endpoint=registry/sync/search @req=SR-CORE-PAG-02
  Scenario: Sync search request with pagination
    Given A valid "sync search" request payload is prepared with pagination
    When The pagination is set to page_size 5 and page_number 1
    And The paginated sync search request is sent
    Then The request should be accepted or processed

  @method=POST @endpoint=registry/search @req=SR-CORE-PAG-03
  Scenario: Search with page_number greater than 1
    Given A valid "async search" request payload is prepared with pagination
    When The pagination is set to page_size 10 and page_number 2
    And The paginated search request is sent
    Then The request should be accepted or processed

  # ============================================
  # PAGINATION VALIDATION
  # ============================================

  @method=POST @endpoint=registry/search @req=SR-VAL-PAG-01
  Scenario: Search rejects invalid page_size (zero)
    Given A valid "async search" request payload is prepared with pagination
    When The pagination is set to page_size 0 and page_number 1
    And The paginated search request is sent
    Then The request should be rejected due to invalid pagination

  @method=POST @endpoint=registry/search @req=SR-VAL-PAG-02
  Scenario: Search rejects invalid page_number (zero)
    Given A valid "async search" request payload is prepared with pagination
    When The pagination is set to page_size 10 and page_number 0
    And The paginated search request is sent
    Then The request should be rejected due to invalid pagination

  @method=POST @endpoint=registry/search @req=SR-VAL-PAG-03
  Scenario: Search rejects negative page_size
    Given A valid "async search" request payload is prepared with pagination
    When The pagination is set to page_size -1 and page_number 1
    And The paginated search request is sent
    Then The request should be rejected due to invalid pagination
