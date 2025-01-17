Feature: Handover a batch of credit instructions to be processed

This API is to be exposed by the Payments BB.
It will be called by the Source BB to handover a batch of credit instructions to be processed.

    @smoke
    Scenario: Successfully search beneficiaries to be processed smoke type test
        Given System wanna search for beneficiaries
        When POST request to search is sent
        Then The response from the search is received
        And The search response should have status 200
        And The search response should have "Content-Type": "application/json" header
        And The search response should match json schema